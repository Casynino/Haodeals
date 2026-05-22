import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { ntzs } from "@/lib/ntzs"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { address, items, phoneNumber } = await request.json()
  const userId = session.user.id as string

  if (!address || !items?.length || !phoneNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Resolve product prices server-side
  const productIds = items.map((i: { productId: string }) => i.productId)
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } })

  const subtotal = items.reduce(
    (sum: number, item: { productId: string; quantity: number }) => {
      const product = products.find((p) => p.id === item.productId)
      return sum + (product?.price ?? 0) * item.quantity
    },
    0
  )
  const shipping = subtotal >= 100000 ? 0 : 5000
  const total = subtotal + shipping

  if (total < 500) {
    return NextResponse.json({ error: "Minimum order amount is TSh 500" }, { status: 400 })
  }

  // Ensure user has a nTZS wallet; provision on-the-fly if missing
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, ntzsUserId: true },
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (!user.ntzsUserId) {
    try {
      const ntzsUser = await ntzs.createUser({
        email: user.email,
        name: user.name ?? undefined,
        externalId: user.id,
      })
      await prisma.user.update({
        where: { id: userId },
        data: { ntzsUserId: ntzsUser.id, ntzsWalletAddress: ntzsUser.walletAddress },
      })
      user = { ...user, ntzsUserId: ntzsUser.id }
    } catch (err) {
      console.error("[nTZS] wallet provisioning failed:", err)
      return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 })
    }
  }

  // Create order with pending_payment status
  const order = await prisma.order.create({
    data: {
      userId,
      address,
      total,
      status: "pending_payment",
      items: {
        create: items.map((item: { productId: string; quantity: number }) => {
          const product = products.find((p) => p.id === item.productId)
          return { productId: item.productId, quantity: item.quantity, price: product?.price ?? 0 }
        }),
      },
    },
  })

  // Initiate mobile money deposit
  try {
    const deposit = await ntzs.createDeposit({
      userId: user.ntzsUserId!,
      amount: Math.round(total),
      paymentMethod: "mobile_money",
      phoneNumber,
      collectToTreasury: true,
      metadata: { orderId: order.id },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { ntzsDepositId: deposit.id },
    })

    return NextResponse.json({ orderId: order.id, depositId: deposit.id, status: "pending" })
  } catch (err) {
    // Clean up order if payment initiation fails
    await prisma.order.delete({ where: { id: order.id } })
    console.error("[nTZS] deposit initiation failed:", err)
    return NextResponse.json({ error: "Failed to initiate payment. Check your phone number." }, { status: 502 })
  }
}
