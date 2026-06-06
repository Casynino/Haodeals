import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth as auth } from "@/auth-admin"

export const dynamic = "force-dynamic"
export const revalidate = 0

const PAID = { notIn: ["pending_payment", "cancelled"] }

export async function GET() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const now = new Date()
  const todayStart    = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart     = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0,0,0,0)
  const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMStart    = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMEnd      = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const thirtyAgo     = new Date(now.getTime() - 30 * 86_400_000)

  /* ── Parallel queries ─────────────────────────────────────────────────── */
  const [
    revTotal, revMonth, revLastM, revToday, revWeek,
    ordTotal, ordMonth, ordLastM, ordToday,
    ordByStatus,
    usersTotal, usersMonth,
    orders30d,
    topItemsRaw,
    lowStock,
    outOfStockCount,
    topCustomersRaw,
    allOrderItems,
    productCount,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { status: PAID }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { status: PAID, createdAt: { gte: monthStart } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { status: PAID, createdAt: { gte: lastMStart, lte: lastMEnd } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { status: PAID, createdAt: { gte: todayStart } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { status: PAID, createdAt: { gte: weekStart } }, _sum: { total: true } }),

    prisma.order.count({ where: { status: PAID } }),
    prisma.order.count({ where: { status: PAID, createdAt: { gte: monthStart } } }),
    prisma.order.count({ where: { status: PAID, createdAt: { gte: lastMStart, lte: lastMEnd } } }),
    prisma.order.count({ where: { status: PAID, createdAt: { gte: todayStart } } }),
    prisma.order.groupBy({ by: ["status"], _count: true }),

    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),

    prisma.order.findMany({
      where: { status: PAID, createdAt: { gte: thirtyAgo } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),

    prisma.product.findMany({
      where: { stock: { gt: 0, lte: 10 } },
      select: { id: true, name: true, stock: true, images: true, category: { select: { name: true } } },
      orderBy: { stock: "asc" },
      take: 8,
    }),

    prisma.product.count({ where: { stock: 0 } }),

    prisma.order.groupBy({
      by: ["userId"],
      where: { status: PAID },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
      take: 8,
    }),

    // All order items for category revenue
    prisma.orderItem.findMany({
      where: { order: { status: PAID } },
      select: { quantity: true, price: true, product: { select: { categoryId: true, category: { select: { name: true } } } } },
    }),

    prisma.product.count(),
  ])

  /* ── Enrich top products ─────────────────────────────────────────────── */
  const topIds = topItemsRaw.map((r) => r.productId)
  const [topProductDetails, topProductRevItems] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: topIds } }, select: { id: true, name: true, price: true, category: { select: { name: true } } } }),
    prisma.orderItem.findMany({ where: { productId: { in: topIds } }, select: { productId: true, quantity: true, price: true } }),
  ])
  const productRevMap = new Map<string, number>()
  topProductRevItems.forEach((i) => {
    productRevMap.set(i.productId, (productRevMap.get(i.productId) ?? 0) + i.quantity * i.price)
  })
  const topSelling = topItemsRaw.map((r) => {
    const detail = topProductDetails.find((p) => p.id === r.productId)
    return {
      id: r.productId,
      name: detail?.name ?? "Unknown",
      category: detail?.category?.name ?? "",
      sold: r._sum.quantity ?? 0,
      revenue: productRevMap.get(r.productId) ?? 0,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  /* ── Enrich top customers ───────────────────────────────────────────── */
  const custIds = topCustomersRaw.map((c) => c.userId)
  const custDetails = await prisma.user.findMany({
    where: { id: { in: custIds } },
    select: { id: true, name: true, email: true, createdAt: true },
  })
  const topCustomers = topCustomersRaw.map((c) => {
    const d = custDetails.find((u) => u.id === c.userId)
    return { id: c.userId, name: d?.name ?? "—", email: d?.email ?? "", totalSpent: c._sum.total ?? 0, orderCount: c._count }
  })

  /* ── Category revenue ──────────────────────────────────────────────── */
  const catMap = new Map<string, number>()
  allOrderItems.forEach((i) => {
    const n = i.product.category.name
    catMap.set(n, (catMap.get(n) ?? 0) + i.quantity * i.price)
  })
  const totalCatRev = [...catMap.values()].reduce((s, v) => s + v, 0) || 1
  const categories = [...catMap.entries()]
    .map(([name, revenue]) => ({ name, revenue, pct: Math.round((revenue / totalCatRev) * 100) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)

  /* ── Daily revenue (last 30 days) ──────────────────────────────────── */
  const dailyMap = new Map<string, number>()
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyAgo.getTime() + i * 86_400_000)
    dailyMap.set(d.toISOString().slice(0, 10), 0)
  }
  orders30d.forEach((o) => dailyMap.set(o.createdAt.toISOString().slice(0, 10), (dailyMap.get(o.createdAt.toISOString().slice(0, 10)) ?? 0) + o.total))
  const daily = [...dailyMap.entries()].map(([date, amount]) => ({ date, amount }))

  /* ── Growth ─────────────────────────────────────────────────────────── */
  const rm = revMonth._sum.total ?? 0
  const rl = revLastM._sum.total ?? 0
  const revGrowth = rl > 0 ? Math.round(((rm - rl) / rl) * 100) : rm > 0 ? 100 : 0
  const om = ordMonth
  const ol = ordLastM
  const ordGrowth = ol > 0 ? Math.round(((om - ol) / ol) * 100) : om > 0 ? 100 : 0

  /* ── Smart insights ─────────────────────────────────────────────────── */
  const insights: { type: string; text: string; action: string }[] = []
  if (revGrowth >= 10) insights.push({ type: "success", text: `Revenue up ${revGrowth}% this month vs last`, action: "Keep the momentum!" })
  else if (revGrowth <= -10) insights.push({ type: "danger", text: `Revenue dropped ${Math.abs(revGrowth)}% vs last month`, action: "Review promotions & pricing" })
  if (outOfStockCount > 0) insights.push({ type: "danger", text: `${outOfStockCount} product${outOfStockCount > 1 ? "s" : ""} out of stock — losing sales`, action: "Restock urgently" })
  if (lowStock.length > 0) insights.push({ type: "warning", text: `${lowStock.length} product${lowStock.length > 1 ? "s" : ""} running low on stock`, action: "Restock soon" })
  if (topSelling[0]) insights.push({ type: "info", text: `"${topSelling[0].name}" is your best seller`, action: "Consider promoting it more" })
  if (categories[0]) insights.push({ type: "info", text: `${categories[0].name} drives ${categories[0].pct}% of revenue`, action: "Invest in this category" })
  if (usersMonth > 3) insights.push({ type: "success", text: `${usersMonth} new customers joined this month`, action: "Great growth!" })

  return NextResponse.json({
    revenue: { total: revTotal._sum.total ?? 0, thisMonth: rm, lastMonth: rl, today: revToday._sum.total ?? 0, thisWeek: revWeek._sum.total ?? 0, growthPct: revGrowth, daily },
    orders:  { total: ordTotal, thisMonth: om, lastMonth: ol, today: ordToday, growthPct: ordGrowth, byStatus: ordByStatus.map((s) => ({ status: s.status, count: s._count })) },
    customers: { total: usersTotal, thisMonth: usersMonth, topSpenders: topCustomers },
    products: { total: productCount, outOfStock: outOfStockCount, lowStock: lowStock.map((p) => ({ id: p.id, name: p.name, stock: p.stock, category: p.category.name })), topSelling },
    categories,
    insights,
  })
}
