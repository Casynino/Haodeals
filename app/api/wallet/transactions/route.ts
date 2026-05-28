import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id as string

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
    ...transactions.map((t) => ({
      id:          t.id,
      type:        t.type as "deposit" | "withdrawal",
      amountTzs:   t.amountTzs,
      status:      t.status,
      phoneNumber: t.phoneNumber,
      description: t.description ?? null,
      createdAt:   t.createdAt,
    })),
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

  return NextResponse.json(history)
}
