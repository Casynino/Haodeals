/**
 * Pure, browser-safe order utilities — no Node.js imports.
 * Use this in client components. For server-side logic (Prisma, email),
 * use lib/order-utils.ts (server only).
 */

export const STATUS_LABELS: Record<string, string> = {
  payment_confirmed:  "Payment Confirmed",
  packaging:          "Packaging in Progress",
  in_transit:         "In Transit",
  delivered:          "Delivered",
  cancelled:          "Cancelled",
  refund_processing:  "Refund Processing",
  refunded:           "Refund Completed",
  // legacy
  pending_payment:    "Awaiting Payment",
  confirmed:          "Confirmed",
  order_received:     "Order Received",
  ready_for_delivery: "Ready for Delivery",
  out_for_delivery:   "Out for Delivery",
  shipped:            "Shipped",
  pending:            "Pending",
}

export function statusLabel(s: string): string {
  return STATUS_LABELS[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Maps any DB status to 0–3 display stage index. Returns -1 for exceptions. */
export function statusToDisplayStage(status: string): number {
  if (["payment_confirmed", "order_received", "confirmed", "pending_payment", "pending"].includes(status)) return 0
  if (["packaging", "ready_for_delivery"].includes(status)) return 1
  if (["in_transit", "out_for_delivery", "shipped"].includes(status)) return 2
  if (["delivered"].includes(status)) return 3
  return -1
}
