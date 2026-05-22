import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { ntzs } from "@/lib/ntzs"
import { sendOrderNotificationToAdmin } from "@/lib/email"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const treasuryUserId = process.env.NTZS_TREASURY_USER_ID
  if (!treasuryUserId) {
    return NextResponse.json({ error: "Payment service not configured" }, { status: 503 })
  }

  const { address, items } = await request.json()
  const userId = session.user.id as string

  if (!address || !items?.length) {
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
  const total = Math.round(subtotal)

  // Check user has a wallet
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, ntzsUserId: true },
  })
  if (!user?.ntzsUserId) {
    return NextResponse.json({ error: "Wallet not provisioned. Please top up your wallet first." }, { status: 400 })
  }

  // Check live balance is sufficient
  try {
    const ntzsUser = await ntzs.getUser(user.ntzsUserId)
    if ((ntzsUser.balanceTzs ?? 0) < total) {
      return NextResponse.json({
        error: `Insufficient balance. You have ${ntzsUser.balanceTzs?.toLocaleString()} TZS, need ${total.toLocaleString()} TZS.`,
        code: "insufficient_balance",
        balance: ntzsUser.balanceTzs,
        required: total,
      }, { status: 402 })
    }
  } catch {
    return NextResponse.json({ error: "Could not verify wallet balance. Try again." }, { status: 503 })
  }

  // Create order
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

  // Transfer from user wallet → treasury
  try {
    const transfer = await ntzs.transfer({
      fromUserId: user.ntzsUserId,
      toUserId: treasuryUserId,
      amountTzs: total,
      metadata: { orderId: order.id },
    })

    // Transfer is synchronous & on-chain — confirm the order immediately
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "confirmed", ntzsDepositId: transfer.id },
    })
    await prisma.cart.deleteMany({ where: { userId } })

    // Notify admin (in-app + email) — non-blocking
    const orderItems = products.map((p) => {
      const item = items.find((i: { productId: string; quantity: number }) => i.productId === p.id)
      return { name: p.name, quantity: item?.quantity ?? 1, price: p.price }
    })
    prisma.notification.create({
      data: {
        type: "new_order",
        title: `New order — TSh ${total.toLocaleString()}`,
        body: `${user?.name ?? user?.email} placed an order for ${orderItems.length} item(s)`,
        metadata: { orderId: order.id, userEmail: user?.email, total },
      },
    }).catch(() => {})
    sendOrderNotificationToAdmin({
      id: order.id,
      total,
      address,
      userName: user?.name ?? "Customer",
      userEmail: user?.email ?? "",
      userPhone: user?.phone,
      items: orderItems,
    })

    return NextResponse.json({ orderId: order.id, transferId: transfer.id, status: "confirmed" })
  } catch (err) {
    await prisma.order.delete({ where: { id: order.id } })
    console.error("[nTZS] transfer failed:", err)
    return NextResponse.json({ error: "Transfer failed. Please try again." }, { status: 502 })
  }
}
