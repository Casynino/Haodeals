import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth as auth } from "@/auth-admin"
import { sendOrderStatusEmail, sendPromoCodeEmail } from "@/lib/email"
import { generatePromoCode } from "@/lib/order-utils"
import { addOrderStatusMessage } from "@/lib/messaging"

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
  payment_confirmed:
    "Great news! We have received your payment and your order is confirmed. Thank you for choosing a great deal with us today.",
  packaging:
    "Good news! Your order has been reviewed by our team and is now being packed with care in our facility. We make sure every item is handled carefully so it reaches you safely and in perfect condition.",
  in_transit:
    "Great news! Your order has been carefully packed and is now ready for shipping. It is on its way to you. We truly appreciate your trust in us.",
  delivered:
    "Your order has been delivered successfully! We hope you love your purchase. Thank you for choosing a great deal with us today.",
  cancelled:
    "Your order has been cancelled. If you have already paid, a full refund will be processed shortly.",
  refund_processing:
    "We are processing your refund. This typically takes 3–5 business days. We apologize for any inconvenience.",
  refunded:
    "Your refund has been completed. The amount should appear in your account. Thank you for your patience.",
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

  // Add status message to conversation — non-blocking
  addOrderStatusMessage(id, status, eventMessage).catch(() => {})

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
