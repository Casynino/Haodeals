import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ntzs, normalizePhone } from "@/lib/ntzs"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { ntzsUserId: true, ntzsWalletAddress: true, email: true, name: true, phone: true },
  })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Provision wallet on-the-fly if still missing
  if (!user.ntzsUserId) {
    try {
      const ntzsUser = await ntzs.createUser({
        email: user.email,
        name: user.name ?? undefined,
        externalId: session.user.id as string,
        phone: user.phone ? normalizePhone(user.phone) : undefined,
      })
      await prisma.user.update({
        where: { id: session.user.id as string },
        data: { ntzsUserId: ntzsUser.id, ntzsWalletAddress: ntzsUser.walletAddress },
      })
      return NextResponse.json({
        ntzsUserId: ntzsUser.id,
        walletAddress: ntzsUser.walletAddress,
        balanceTzs: 0,
        balanceUsdc: 0,
      })
    } catch {
      return NextResponse.json({ error: "Wallet not yet provisioned" }, { status: 503 })
    }
  }

  try {
    const ntzsUser = await ntzs.getUser(user.ntzsUserId)
    return NextResponse.json({
      ntzsUserId: ntzsUser.id,
      walletAddress: ntzsUser.walletAddress ?? user.ntzsWalletAddress,
      balanceTzs: ntzsUser.balanceTzs,
      balanceUsdc: ntzsUser.balanceUsdc,
    })
  } catch {
    // Return stored data with unknown balance if nTZS is unreachable
    return NextResponse.json({
      ntzsUserId: user.ntzsUserId,
      walletAddress: user.ntzsWalletAddress,
      balanceTzs: null,
      balanceUsdc: null,
    })
  }
}

// Deposit to own wallet (top-up)
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { phoneNumber, amount } = await req.json()
  if (!phoneNumber || !amount || amount < 500) {
    return NextResponse.json({ error: "Minimum deposit is TSh 500" }, { status: 400 })
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
    const deposit = await ntzs.createDeposit({
      userId: user.ntzsUserId,
      amountTzs: Math.round(amount),
      paymentMethod: "mobile_money",
      phoneNumber: normalizedPhone,
      collectToTreasury: false,
    })
    await prisma.transaction.create({
      data: {
        userId: session.user.id as string,
        type: "deposit",
        amountTzs: Math.round(amount),
        status: "pending",
        phoneNumber: normalizedPhone,
        ntzsId: deposit.id,
      },
    })
    return NextResponse.json({ depositId: deposit.id, status: deposit.status })
  } catch (err) {
    console.error("[nTZS] deposit error:", err)
    return NextResponse.json({ error: "Failed to initiate deposit" }, { status: 502 })
  }
}
