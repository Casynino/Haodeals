import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id as string },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(
    orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: { ...item.product, images: JSON.parse(item.product.images) },
      })),
    }))
  )
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { address, items } = await request.json()
  const userId = session.user.id as string

  if (!address || !items?.length) {
    return NextResponse.json({ error: "Invalid order data" }, { status: 400 })
  }

  const productIds = items.map((i: { productId: string }) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  })

  const total = items.reduce(
    (sum: number, item: { productId: string; quantity: number }) => {
      const product = products.find((p) => p.id === item.productId)
      return sum + (product?.price ?? 0) * item.quantity
    },
    0
  )

  const order = await prisma.order.create({
    data: {
      userId,
      address,
      total,
      status: "confirmed",
      items: {
        create: items.map((item: { productId: string; quantity: number }) => {
          const product = products.find((p) => p.id === item.productId)
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: product?.price ?? 0,
          }
        }),
      },
    },
    include: { items: { include: { product: true } } },
  })

  await prisma.cart.deleteMany({ where: { userId } })

  return NextResponse.json(order, { status: 201 })
}
