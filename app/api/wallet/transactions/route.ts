import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Always return fresh transaction data — never serve a cached history
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id as string

  // Check if this user is the admin/treasury
  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  const isAdmin = userRecord?.role === "admin"

  if (isAdmin) {
    // ── Admin/treasury view ──────────────────────────────────────────────────
    // Show own deposits/withdrawals + ALL incoming customer order payments
    const [transactions, incomingOrders] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      // Every confirmed order across all users = an incoming payment to treasury
      prisma.order.findMany({
        where: { status: { notIn: ["pending_payment", "cancelled"] } },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          total: true,
          status: true,
          trackingId: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          items: {
            take: 2,
            select: {
              quantity: true,
              product: { select: { name: true } },
            },
          },
        },
      }),
    ])

    function incomingDescription(order: typeof incomingOrders[number]): string {
      const from = order.user.name ?? order.user.email.split("@")[0]
      const ref  = order.trackingId ?? order.id.slice(-8).toUpperCase()
      if (!order.items.length) return `Payment from ${from} — order #${ref}`
      const first = order.items[0]
      const qty   = first.quantity > 1 ? ` ×${first.quantity}` : ""
      const extra = order.items.length > 1 ? ` +${order.items.length - 1} more` : ""
      return `${from} — ${first.product.name}${qty}${extra}`
    }

    const history = [
      ...transactions.map((t) => {
        const fallbackDesc =
          t.type === "deposit"    ? `Mobile Money top-up via ${t.phoneNumber ?? "unknown"}` :
          t.type === "withdrawal" ? `Mobile Money withdrawal to ${t.phoneNumber ?? "unknown"}` :
          null
        return {
          id:          t.id,
          type:        t.type as "deposit" | "withdrawal",
          amountTzs:   t.amountTzs,
          status:      t.status,
          phoneNumber: t.phoneNumber,
          description: t.description ?? fallbackDesc,
          createdAt:   t.createdAt,
        }
      }),
      ...incomingOrders.map((o) => ({
        id:          o.id,
        type:        "incoming" as const,
        amountTzs:   o.total,
        status:      o.status,
        phoneNumber: null,
        description: incomingDescription(o),
        createdAt:   o.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(history, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    })
  }

  // ── Regular user view ──────────────────────────────────────────────────────
  const [transactions, orders] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.order.findMany({
      where: { userId, status: { not: "pending_payment" } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        total: true,
        status: true,
        trackingId: true,
        createdAt: true,
        items: {
          take: 2,
          select: {
            quantity: true,
            product: { select: { name: true } },
          },
        },
      },
    }),
  ])

  /** Build a human-readable label for an order */
  function orderDescription(order: typeof orders[number]): string {
    if (!order.items.length) return `Payment for order #${order.trackingId ?? order.id.slice(-8).toUpperCase()}`
    const first = order.items[0]
    const qty   = first.quantity > 1 ? ` ×${first.quantity}` : ""
    const extra = order.items.length > 1 ? ` +${order.items.length - 1} more` : ""
    return `Order payment — ${first.product.name}${qty}${extra}`
  }

  const history = [
    ...transactions.map((t) => {
      const fallbackDesc =
        t.type === "deposit"    ? `Mobile Money top-up via ${t.phoneNumber ?? "unknown"}` :
        t.type === "withdrawal" ? `Mobile Money withdrawal to ${t.phoneNumber ?? "unknown"}` :
        null
      return {
        id:          t.id,
        type:        t.type as "deposit" | "withdrawal",
        amountTzs:   t.amountTzs,
        status:      t.status,
        phoneNumber: t.phoneNumber,
        description: t.description ?? fallbackDesc,
        createdAt:   t.createdAt,
      }
    }),
    ...orders.map((o) => ({
      id:          o.id,
      type:        "purchase" as const,
      amountTzs:   o.total,
      status:      o.status,
      phoneNumber: null,
      description: orderDescription(o),
      createdAt:   o.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json(history, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  })
}
