import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ntzs, normalizePhone } from "@/lib/ntzs"

async function computeBalance(userId: string): Promise<number> {
  const [depositSum, withdrawalSum, orderSum] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "deposit", status: "completed" },
      _sum: { amountTzs: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "withdrawal", status: { notIn: ["failed"] } },
      _sum: { amountTzs: true },
    }),
    prisma.order.aggregate({
      where: { userId, status: { notIn: ["pending_payment", "cancelled"] } },
      _sum: { total: true },
    }),
  ])

  const deposits    = depositSum._sum.amountTzs   ?? 0
  const withdrawals = withdrawalSum._sum.amountTzs ?? 0
  const purchases   = orderSum._sum.total          ?? 0
  return Math.max(0, deposits - withdrawals - purchases)
}

// Withdrawal: redeems tokens from HaoDeals treasury and sends mobile money to user.
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { phoneNumber, amount } = await req.json()
  if (!phoneNumber || !amount || amount < 5000) {
    return NextResponse.json({ error: "Minimum withdrawal is TSh 5,000" }, { status: 400 })
  }

  const userId = session.user.id as string

  const treasuryUserId = process.env.NTZS_TREASURY_USER_ID
  if (!treasuryUserId) {
    return NextResponse.json({ error: "Payment service not configured" }, { status: 503 })
  }

  const balance = await computeBalance(userId)
  if (balance < amount) {
    return NextResponse.json({
      error: `Insufficient balance. You have TSh ${balance.toLocaleString()}, need TSh ${amount.toLocaleString()}.`,
      code: "insufficient_balance",
    }, { status: 402 })
  }

  const normalizedPhone = normalizePhone(phoneNumber)
  try {
    const withdrawal = await ntzs.createWithdrawal({
      userId: treasuryUserId,
      amountTzs: Math.round(amount),
      phoneNumber: normalizedPhone,
    })

    await prisma.transaction.create({
      data: {
        userId,
        type: "withdrawal",
        amountTzs: Math.round(amount),
        status: withdrawal.status,
        phoneNumber: normalizedPhone,
        ntzsId: withdrawal.id,
        description: `Mobile Money withdrawal to ${normalizedPhone}`,
      },
    })

    return NextResponse.json({ id: withdrawal.id, status: withdrawal.status, message: withdrawal.message })
  } catch (err) {
    console.error("[nTZS] withdrawal error:", err)
    return NextResponse.json({ error: "Failed to initiate withdrawal" }, { status: 502 })
  }
}
