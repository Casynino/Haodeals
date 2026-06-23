import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { sendOrderNotificationToAdmin, sendOrderStatusEmail } from "@/lib/email"
import { uniqueTrackingId } from "@/lib/order-utils"
import { computeBalance } from "@/lib/wallet"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { address, items, discountCodeId } = await request.json()
  const userId = session.user.id as string

  if (!address || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const productIds = items.map((i: { productId: string }) => i.productId)
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } })

  // Validate stock availability
  for (const item of items as { productId: string; quantity: number }[]) {
    const p = products.find((x) => x.id === item.productId)
    if (!p) return NextResponse.json({ error: "Product not found" }, { status: 400 })
    if (p.stock < item.quantity) {
      return NextResponse.json({
        error: `"${p.name}" only has ${p.stock} unit${p.stock === 1 ? "" : "s"} left.`,
        code: "out_of_stock",
      }, { status: 400 })
    }
  }

  // Selling price is always final; the deal timer is urgency only, never raises the price.
  function getEffectivePrice(p: { price: number; originalPrice: number | null; dealEndsAt: Date | null }): number {
    return p.price
  }

  let subtotal = items.reduce(
    (sum: number, item: { productId: string; quantity: number }) => {
      const product = products.find((p) => p.id === item.productId)
      return sum + getEffectivePrice(product ?? { price: 0, originalPrice: null, dealEndsAt: null }) * item.quantity
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
    select: { id: true, name: true, email: true, phone: true },
  })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Check ledger balance (deposits + adjustments − withdrawals − prior orders)
  const availableBalance = await computeBalance(userId)
  if (availableBalance < total) {
    return NextResponse.json({
      error: `Insufficient balance. You have TSh ${availableBalance.toLocaleString()}, need TSh ${total.toLocaleString()}.`,
      code: "insufficient_balance",
      balance: availableBalance,
      required: total,
    }, { status: 402 })
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

  try {
    // Funds already sit in Hǎodeals treasury (collected on deposit).
    // The order itself serves as the debit against the user's DB balance.

    // Mark discount code as used
    if (validCode) {
      await prisma.discountCode.update({ where: { id: validCode.id }, data: { used: true } })
    }

    await prisma.cart.deleteMany({ where: { userId } })

    // Decrement stock for each purchased item (non-blocking)
    Promise.all(
      (items as { productId: string; quantity: number }[]).map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
          select: { id: true, name: true, stock: true },
        })
      )
    ).then((updated) => {
      // Notify admin for every product that just hit zero stock
      updated
        .filter((p) => p.stock <= 0)
        .forEach((p) => {
          prisma.notification.create({
            data: {
              type: "sold_out",
              title: `Sold out — ${p.name}`,
              body: `"${p.name}" has reached zero stock.`,
              metadata: { productId: p.id },
            },
          }).catch(() => {})
        })
    }).catch((err) => console.error("[stock] decrement failed:", err))

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
      status: "payment_confirmed",
      discountApplied: discountPercent > 0 ? discountPercent : null,
    })
  } catch (err) {
    await prisma.order.delete({ where: { id: order.id } })
    console.error("[checkout] order creation failed:", err)
    return NextResponse.json({ error: "Order failed. Please try again." }, { status: 502 })
  }
}
