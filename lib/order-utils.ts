import { prisma } from "@/lib/prisma"
import { sendOrderStatusEmail } from "@/lib/email"
export { statusLabel, statusToDisplayStage, STATUS_LABELS } from "@/lib/order-labels"

/* ── Tracking ID generator ─────────────────────────────────────── */
export function generateTrackingId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `HD-${seg(4)}-${seg(4)}`
}

export async function uniqueTrackingId(): Promise<string> {
  let id = generateTrackingId()
  while (await prisma.order.findUnique({ where: { trackingId: id } })) {
    id = generateTrackingId()
  }
  return id
}

/* ── Promo code generator ──────────────────────────────────────── */
export function generatePromoCode(): string {
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `SAVE10-${suffix}`
}

/* ── Auto-advance logic (lazy, called on GET) ──────────────────── */
const AUTO_ADVANCE_MINUTES = 5 // payment_confirmed → packaging

export async function autoAdvanceOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      trackingId: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  })

  if (!order) return
  if (order.status !== "payment_confirmed") return

  const ageMinutes = (Date.now() - new Date(order.createdAt).getTime()) / 60_000
  if (ageMinutes < AUTO_ADVANCE_MINUTES) return

  const message =
    "Your order is now being processed and packed. Please wait while we prepare it with care."

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "packaging" } }),
    prisma.trackingEvent.create({ data: { orderId, status: "packaging", message } }),
  ])

  sendOrderStatusEmail(order.user.email, order.user.name ?? "Customer", {
    orderId,
    trackingId: order.trackingId,
    status: "packaging",
    message,
  }).catch(() => {})
}

