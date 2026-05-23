import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { sendOrderStatusEmail } from "@/lib/email"

const VALID_STATUSES = [
  "payment_confirmed",
  "order_received",
  "packaging",
  "ready_for_delivery",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refund_processing",
  "refunded",
]

const DEFAULT_MESSAGES: Record<string, string> = {
  payment_confirmed:  "Your payment has been confirmed and your order is being processed.",
  order_received:     "Great news! We have received your order and it's in our queue.",
  packaging:          "Your items are being carefully packed and prepared for shipment.",
  ready_for_delivery: "Your package is fully packed and ready to be handed to our delivery partner.",
  in_transit:         "Your package is on its way! Our delivery team has picked it up.",
  out_for_delivery:   "Your package is out for delivery. Expect it today!",
  delivered:          "Your package has been delivered. Thank you for shopping with HaoDeals!",
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
  const body = await request.json()
  const { status, message } = body

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      trackingEvents: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  const eventMessage = message?.trim() || DEFAULT_MESSAGES[status] || `Order status updated to ${status}.`

  // Update order status and log tracking event in a transaction
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

  // Send customer notification email — non-blocking
  sendOrderStatusEmail(
    order.user.email,
    order.user.name ?? "Customer",
    {
      orderId: order.id,
      trackingId: order.trackingId,
      status,
      message: eventMessage,
    }
  ).catch(() => {})

  return NextResponse.json({
    ...updatedOrder,
    items: updatedOrder.items.map((item) => ({
      ...item,
      product: { ...item.product, images: JSON.parse(item.product.images) },
    })),
  })
}
