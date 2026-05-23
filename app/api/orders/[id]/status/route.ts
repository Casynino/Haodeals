import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { sendOrderStatusEmail, sendPromoCodeEmail } from "@/lib/email"
import { generatePromoCode } from "@/lib/order-utils"

const VALID_STATUSES = [
  "payment_confirmed",
  "packaging",
  "in_transit",
  "delivered",
  "cancelled",
  "refund_processing",
  "refunded",
]

const DEFAULT_MESSAGES: Record<string, string> = {
  payment_confirmed:  "Great news! We have received your payment and your order is confirmed.",
  packaging:          "Your order is now being processed and packed. Please wait while we prepare it with care.",
  in_transit:         "Your package is on the way to you.",
  delivered:          "Your order has been delivered successfully. Thank you for shopping with us!",
  cancelled:          "Your order has been cancelled. If you paid, a refund will be processed shortly.",
  refund_processing:  "Your refund is being processed. This usually takes 3–5 business days.",
  refunded:           "Your refund has been completed. The amount should appear in your account.",
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id } = await params
  const { status, message } = await request.json()

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  const eventMessage = message?.trim() || DEFAULT_MESSAGES[status] || `Order status updated to ${status}.`

  const [updatedOrder] = await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { product: true } },
        trackingEvents: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.trackingEvent.create({
      data: { orderId: id, status, message: eventMessage },
    }),
  ])

  // Customer status email — non-blocking
  sendOrderStatusEmail(order.user.email, order.user.name ?? "Customer", {
    orderId: order.id,
    trackingId: order.trackingId,
    status,
    message: eventMessage,
  }).catch(() => {})

  // On delivery: generate loyalty promo code and email customer
  if (status === "delivered") {
    const code = generatePromoCode()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    prisma.discountCode.create({
      data: { code, userId: order.user.id, percent: 10, expiresAt },
    })
      .then(() =>
        sendPromoCodeEmail(order.user.email, order.user.name ?? "Customer", code, 10)
      )
      .catch(() => {})
  }

  return NextResponse.json({
    ...updatedOrder,
    items: updatedOrder.items.map((item) => ({
      ...item,
      product: { ...item.product, images: JSON.parse(item.product.images) },
    })),
  })
}
