import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth as auth } from "@/auth-admin"

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin") return null
  return session
}

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const body = await request.json()
  const { name, description, price, originalPrice, stock, images, featured, categoryId, options } = body

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  const product = await prisma.product.create({
    data: {
      name,
      slug: `${slug}-${Date.now()}`,
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      stock: parseInt(stock),
      images: JSON.stringify(images),
      options: options?.length ? options : undefined,
      featured: !!featured,
      categoryId,
    },
    include: { category: true },
  })

  return NextResponse.json({ ...product, images: JSON.parse(product.images) }, { status: 201 })
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const products = await prisma.product.findMany({
    include: {
      category: true,
      _count: { select: { orderItems: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(products.map((p) => ({ ...p, images: JSON.parse(p.images) })))
}
