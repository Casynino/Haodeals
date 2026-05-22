import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ntzs, normalizePhone } from "@/lib/ntzs"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { phoneNumber, amount } = await req.json()
  if (!phoneNumber || !amount || amount < 5000) {
    return NextResponse.json({ error: "Minimum withdrawal is TSh 5,000" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { ntzsUserId: true },
  })

  if (!user?.ntzsUserId) {
    return NextResponse.json({ error: "Wallet not provisioned" }, { status: 400 })
  }

  const normalizedPhone = normalizePhone(phoneNumber)
  try {
    const withdrawal = await ntzs.createWithdrawal({
      userId: user.ntzsUserId,
      amountTzs: Math.round(amount),
      phoneNumber: normalizedPhone,
    })

    await prisma.transaction.create({
      data: {
        userId: session.user.id as string,
        type: "withdrawal",
        amountTzs: Math.round(amount),
        status: withdrawal.status,
        phoneNumber: normalizedPhone,
        ntzsId: withdrawal.id,
      },
    })

    return NextResponse.json({ id: withdrawal.id, status: withdrawal.status, message: withdrawal.message })
  } catch (err) {
    console.error("[nTZS] withdrawal error:", err)
    return NextResponse.json({ error: "Failed to initiate withdrawal" }, { status: 502 })
  }
}
