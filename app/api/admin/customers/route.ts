import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth as auth } from "@/auth-admin"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const PAID = { notIn: ["pending_payment", "cancelled"] }

  const [users, ordersByUser] = await Promise.all([
    prisma.user.findMany({
      where: { role: "customer" },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.groupBy({
      by: ["userId"],
      where: { status: PAID },
      _sum: { total: true },
      _count: true,
    }),
  ])

  const spendMap = new Map(ordersByUser.map((o) => [o.userId, { total: o._sum.total ?? 0, count: o._count }]))

  const customers = users.map((u) => ({
    ...u,
    totalSpent: spendMap.get(u.id)?.total ?? 0,
    orderCount: spendMap.get(u.id)?.count ?? 0,
  })).sort((a, b) => b.totalSpent - a.totalSpent)

  return NextResponse.json(customers)
}
