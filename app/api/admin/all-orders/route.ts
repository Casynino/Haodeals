import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth as auth } from "@/auth-admin"

// Always fetch live order data — never serve a cached version
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { product: { select: { name: true, images: true } } } },
      trackingEvents: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(
    orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          images: (() => { try { return JSON.parse(item.product.images) } catch { return [] } })(),
        },
      })),
    })),
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  )
}
