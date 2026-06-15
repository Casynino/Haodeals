import { prisma } from "@/lib/prisma"

/**
 * A user's spendable balance, derived entirely from our own DB records:
 *
 *   completed deposits  +  reconciliation adjustments
 *   − non-failed withdrawals  −  paid-order spend
 *
 * Funds themselves live in the shared HaoDeals nTZS treasury; this is the
 * authoritative per-user ledger balance.
 */
export async function computeBalance(userId: string): Promise<number> {
  const [depositSum, adjustmentSum, withdrawalSum, orderSum] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "deposit", status: "completed" },
      _sum: { amountTzs: true },
    }),
    // Adjustments carry a signed amount (can be negative) — used by the
    // migration sweep to pin a balance to the real nTZS wallet value.
    prisma.transaction.aggregate({
      where: { userId, type: "adjustment" },
      _sum: { amountTzs: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "withdrawal", status: { notIn: ["failed"] } },
      _sum: { amountTzs: true },
    }),
    prisma.order.aggregate({
      where: { userId, status: { notIn: ["pending_payment", "cancelled"] } },
      _sum: { total: true },
    }),
  ])

  const deposits    = depositSum._sum.amountTzs    ?? 0
  const adjustments = adjustmentSum._sum.amountTzs  ?? 0
  const withdrawals = withdrawalSum._sum.amountTzs  ?? 0
  const purchases   = orderSum._sum.total           ?? 0

  return Math.max(0, deposits + adjustments - withdrawals - purchases)
}
