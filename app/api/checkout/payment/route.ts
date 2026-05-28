import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { ntzs } from "@/lib/ntzs"
import { sendOrderNotificationToAdmin, sendOrderStatusEmail } from "@/lib/email"
import { uniqueTrackingId } from "@/lib/order-utils"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const treasuryUserId = process.env.NTZS_TREASURY_USER_ID
  if (!treasuryUserId) {
    return NextResponse.json({ error: "Payment service not configured" }, { status: 503 })
  }

  const { address, items, discountCodeId } = await request.json()
  const userId = session.user.id as string

  if (!address || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const productIds = items.map((i: { productId: string }) => i.productId)
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } })

  let subtotal = items.reduce(
    (sum: number, item: { productId: string; quantity: number }) => {
      const product = products.find((p) => p.id === item.productId)
      return sum + (product?.price ?? 0) * item.quantity
    },
    0
  )

  // Apply discount code if provided
  let discountPercent = 0
  let validCode: { id: string; percent: number } | null = null
  if (discountCodeId) {
    const code = await prisma.discountCode.findFirst({
      where: {
        id: discountCodeId,
        userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
    })
    if (code) {
      validCode = code
      discountPercent = code.percent
      subtotal = subtotal * (1 - discountPercent / 100)
    }
  }

  const total = Math.round(subtotal)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, ntzsUserId: true },
  })
  if (!user?.ntzsUserId) {
    return NextResponse.json({ error: "Wallet not provisioned. Please top up your wallet first." }, { status: 400 })
  }

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

  // Generate unique tracking ID
  const trackingId = await uniqueTrackingId()

  // Create order with payment_confirmed status + first tracking event
  const order = await prisma.order.create({
    data: {
      userId,
      address,
      total,
      status: "payment_confirmed",
      trackingId,
      items: {
        create: items.map((item: { productId: string; quantity: number }) => {
          const product = products.find((p) => p.id === item.productId)
          return { productId: item.productId, quantity: item.quantity, price: product?.price ?? 0 }
        }),
      },
      trackingEvents: {
        create: {
          status: "payment_confirmed",
          message: "Great news! We have received your payment and your order is confirmed.",
        },
      },
    },
    include: { items: { include: { product: true } } },
  })

  // Transfer funds: user wallet → treasury
  try {
    const transfer = await ntzs.transfer({
      fromUserId: user.ntzsUserId,
      toUserId: treasuryUserId,
      amountTzs: total,
      metadata: { orderId: order.id },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { ntzsDepositId: transfer.id },
    })

    // Mark discount code as used
    if (validCode) {
      await prisma.discountCode.update({ where: { id: validCode.id }, data: { used: true } })
    }

    await prisma.cart.deleteMany({ where: { userId } })

    // Non-blocking notifications
    const orderItems = order.items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      price: i.price,
    }))

    prisma.notification.create({
      data: {
        type: "new_order",
        title: `New order — TSh ${total.toLocaleString()}`,
        body: `${user.name ?? user.email} placed an order for ${orderItems.length} item(s)`,
        metadata: { orderId: order.id, userEmail: user.email, total, trackingId },
      },
    }).catch(() => {})

    sendOrderNotificationToAdmin({
      id: order.id,
      total,
      address,
      userName: user.name ?? "Customer",
      userEmail: user.email ?? "",
      userPhone: user.phone,
      items: orderItems,
    }).catch(() => {})

    // Customer payment confirmation email
    sendOrderStatusEmail(user.email, user.name ?? "Customer", {
      orderId: order.id,
      trackingId,
      status: "payment_confirmed",
      message: "Great news! We have received your payment and your order is confirmed. We'll start packaging it right away.",
    }).catch(() => {})

    return NextResponse.json({
      orderId: order.id,
      trackingId,
      transferId: transfer.id,
      status: "payment_confirmed",
      discountApplied: discountPercent > 0 ? discountPercent : null,
    })
  } catch (err) {
    await prisma.order.delete({ where: { id: order.id } })
    console.error("[nTZS] transfer failed:", err)
    return NextResponse.json({ error: "Transfer failed. Please try again." }, { status: 502 })
  }
}
