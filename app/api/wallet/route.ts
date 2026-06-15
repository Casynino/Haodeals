import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ntzs, normalizePhone } from "@/lib/ntzs"
import { computeBalance } from "@/lib/wallet"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id as string
  const balanceTzs = await computeBalance(userId)

  return NextResponse.json({
    displayId:  userId.slice(-6).toUpperCase(),
    balanceTzs,
  })
}

// Deposit: mints nTZS tokens directly into the HaoDeals treasury wallet.
// The user's balance is tracked in our own DB (Transaction records).
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { phoneNumber, amount } = await req.json()
  if (!phoneNumber || !amount || amount < 500) {
    return NextResponse.json({ error: "Minimum deposit is TSh 500" }, { status: 400 })
  }

  const treasuryUserId = process.env.NTZS_TREASURY_USER_ID
  if (!treasuryUserId) {
    return NextResponse.json({ error: "Payment service not configured" }, { status: 503 })
  }

  const normalizedPhone = normalizePhone(phoneNumber)
  try {
    const deposit = await ntzs.createDeposit({
      userId: treasuryUserId,
      amountTzs: Math.round(amount),
      paymentMethod: "mobile_money",
      phoneNumber: normalizedPhone,
      collectToTreasury: true,
    })
    await prisma.transaction.create({
      data: {
        userId: session.user.id as string,
        type: "deposit",
        amountTzs: Math.round(amount),
        status: "pending",
        phoneNumber: normalizedPhone,
        ntzsId: deposit.id,
        description: `Mobile Money top-up via ${normalizedPhone}`,
      },
    })
    return NextResponse.json({ depositId: deposit.id, status: deposit.status })
  } catch (err) {
    console.error("[nTZS] deposit error:", err)
    return NextResponse.json({ error: "Failed to initiate deposit" }, { status: 502 })
  }
}
