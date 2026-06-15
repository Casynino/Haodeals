import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth as auth } from "@/auth-admin"
import { ntzs } from "@/lib/ntzs"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const PAID = { notIn: ["pending_payment", "cancelled"] }

  const [users, txGroups, ordersByUser] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, ntzsUserId: true },
      orderBy: { createdAt: "desc" },
    }),
    // All deposit/withdrawal sums per user, grouped by status
    prisma.transaction.groupBy({
      by: ["userId", "type", "status"],
      _sum: { amountTzs: true },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ["userId"],
      where: { status: PAID },
      _sum: { total: true },
      _count: true,
    }),
  ])

  // Per-user aggregation
  type Agg = {
    deposited: number      // completed deposits
    pendingDeposits: number
    adjustments: number    // signed reconciliation adjustments
    withdrawn: number      // non-failed withdrawals
    spent: number          // paid orders total
    orderCount: number
    txCount: number
  }
  const map = new Map<string, Agg>()
  const ensure = (id: string): Agg => {
    if (!map.has(id)) map.set(id, { deposited: 0, pendingDeposits: 0, adjustments: 0, withdrawn: 0, spent: 0, orderCount: 0, txCount: 0 })
    return map.get(id)!
  }

  for (const g of txGroups) {
    const a = ensure(g.userId)
    const amt = g._sum.amountTzs ?? 0
    a.txCount += g._count
    if (g.type === "deposit") {
      if (g.status === "completed") a.deposited += amt
      else if (g.status === "pending") a.pendingDeposits += amt
    } else if (g.type === "withdrawal" && g.status !== "failed") {
      a.withdrawn += amt
    } else if (g.type === "adjustment") {
      a.adjustments += amt
    }
  }
  for (const o of ordersByUser) {
    const a = ensure(o.userId)
    a.spent += o._sum.total ?? 0
    a.orderCount += o._count
  }

  const wallets = users.map((u) => {
    const a = map.get(u.id) ?? { deposited: 0, pendingDeposits: 0, adjustments: 0, withdrawn: 0, spent: 0, orderCount: 0, txCount: 0 }
    const balance = Math.max(0, a.deposited + a.adjustments - a.withdrawn - a.spent)
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
      swept: !u.ntzsUserId,        // old wallet already reconciled / never had one
      hasLegacyWallet: !!u.ntzsUserId,
      balance,
      deposited: a.deposited,
      pendingDeposits: a.pendingDeposits,
      adjustments: a.adjustments,
      withdrawn: a.withdrawn,
      spent: a.spent,
      orderCount: a.orderCount,
      txCount: a.txCount,
    }
  }).sort((x, y) => y.balance - x.balance)

  // Aggregate totals
  const totals = wallets.reduce(
    (t, w) => {
      t.outstanding += w.balance
      t.deposited   += w.deposited
      t.withdrawn   += w.withdrawn
      t.spent       += w.spent
      t.pending     += w.pendingDeposits
      if (w.hasLegacyWallet) t.legacyWallets += 1
      return t
    },
    { outstanding: 0, deposited: 0, withdrawn: 0, spent: 0, pending: 0, legacyWallets: 0 }
  )

  // Try to read the live treasury balance to compare against outstanding liability
  let treasuryBalance: number | null = null
  const treasuryUserId = process.env.NTZS_TREASURY_USER_ID
  if (treasuryUserId) {
    try {
      const treasury = await ntzs.getUser(treasuryUserId)
      treasuryBalance = treasury.balanceTzs ?? null
    } catch {
      treasuryBalance = null
    }
  }

  return NextResponse.json(
    { wallets, totals, treasuryBalance, treasuryConfigured: !!treasuryUserId, treasuryId: treasuryUserId ?? null },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  )
}
