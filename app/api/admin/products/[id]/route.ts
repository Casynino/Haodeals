import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth as auth } from "@/auth-admin"

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin") return null
  return session
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const { name, description, price, originalPrice, stock, images, featured, categoryId, options, dealEndsAt } = body

  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      stock: parseInt(stock),
      images: JSON.stringify(images),
      options: options?.length ? options : null,
      featured: !!featured,
      dealEndsAt: dealEndsAt ? new Date(dealEndsAt) : null,
      categoryId,
    },
    include: { category: true },
  })

  return NextResponse.json({ ...product, images: JSON.parse(product.images) })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const { id } = await params
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
