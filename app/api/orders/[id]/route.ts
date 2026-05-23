import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { autoAdvanceOrder } from "@/lib/order-utils"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // Fire lazy auto-advance (payment_confirmed → packaging after 5 min)
  // Runs non-blocking — if it fails, the GET still succeeds
  autoAdvanceOrder(id).catch(() => {})

  const order = await prisma.order.findFirst({
    where: {
      userId: session.user.id as string,
      OR: [{ id }, { trackingId: id }],
    },
    include: {
      items: { include: { product: true } },
      trackingEvents: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      product: { ...item.product, images: JSON.parse(item.product.images) },
    })),
  })
}
