import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { sendOrderNotificationToAdmin } from "@/lib/email"

function generateTrackingId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `HD-${seg(4)}-${seg(4)}`
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id as string },
    include: {
      items: { include: { product: true } },
      trackingEvents: { orderBy: { createdAt: "asc" } },
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

  // Generate unique tracking ID (retry on collision)
  let trackingId = generateTrackingId()
  let collision = await prisma.order.findUnique({ where: { trackingId } })
  while (collision) {
    trackingId = generateTrackingId()
    collision = await prisma.order.findUnique({ where: { trackingId } })
  }

  const order = await prisma.order.create({
    data: {
      userId,
      address,
      total,
      status: "payment_confirmed",
      trackingId,
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
      trackingEvents: {
        create: {
          status: "payment_confirmed",
          message: "Your payment has been confirmed and your order is being processed.",
        },
      },
    },
    include: {
      items: { include: { product: true } },
      trackingEvents: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  })

  await prisma.cart.deleteMany({ where: { userId } })

  // Admin notification — non-blocking
  sendOrderNotificationToAdmin({
    id: order.id,
    total: order.total,
    address: order.address,
    userName: order.user.name ?? "Customer",
    userEmail: order.user.email,
    userPhone: order.user.phone,
    items: order.items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      price: i.price,
    })),
  }).catch(() => {})

  return NextResponse.json({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      product: { ...item.product, images: JSON.parse(item.product.images) },
    })),
  }, { status: 201 })
}
