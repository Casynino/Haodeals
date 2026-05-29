import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth as auth } from "@/auth-admin"

// Always fetch fresh data — never serve a cached snapshot to admin
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const [totalOrders, totalUsers, totalProducts, revenueResult, recentOrders, recentPayments] =
    await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.product.count(),
      // Only count revenue from confirmed/paid orders
      prisma.order.aggregate({
        where: { status: { notIn: ["pending_payment", "cancelled"] } },
        _sum: { total: true },
      }),
      // 5 most recent PAID orders (exclude abandoned pending_payment carts)
      prisma.order.findMany({
        where: { status: { not: "pending_payment" } },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
      }),
      // All confirmed inbound payments — most recent 50
      prisma.order.findMany({
        where: { status: { notIn: ["pending_payment", "cancelled"] } },
        take: 50,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          total: true,
          status: true,
          trackingId: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          items: {
            take: 1,
            select: { product: { select: { name: true } } },
          },
        },
      }),
    ])

  return NextResponse.json(
    {
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue: revenueResult._sum.total ?? 0,
      recentOrders,
      recentPayments,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  )
}
