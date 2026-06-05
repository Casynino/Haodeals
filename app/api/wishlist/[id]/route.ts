import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function getOwned(id: string, userId: string) {
  const w = await prisma.wishlist.findUnique({ where: { id } })
  if (!w || w.userId !== userId) return null
  return w
}

/** GET — wishlist with all products */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const wishlist = await prisma.wishlist.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { addedAt: "desc" },
        include: {
          product: {
            select: {
              id: true, name: true, price: true, originalPrice: true,
              images: true, stock: true, category: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  if (!wishlist || wishlist.userId !== (session.user.id as string))
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const totalCost = wishlist.items.reduce((s, i) => s + i.product.price, 0)
  const base = wishlist.targetAmount ?? totalCost
  const pct  = base > 0 ? Math.min(100, Math.round((wishlist.savedAmount / base) * 100)) : 0

  return NextResponse.json({
    ...wishlist,
    items: wishlist.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        images: (() => { try { return JSON.parse(item.product.images) } catch { return [] } })(),
      },
    })),
    totalCost,
    progressPct: pct,
  })
}

/** PATCH — update wishlist fields */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const userId = session.user.id as string
  const w = await getOwned(id, userId)
  if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.wishlist.update({
    where: { id },
    data: {
      name:         body.name        !== undefined ? body.name.trim()               : undefined,
      description:  body.description !== undefined ? body.description?.trim() || null : undefined,
      emoji:        body.emoji       !== undefined ? body.emoji                      : undefined,
      color:        body.color       !== undefined ? body.color                      : undefined,
      targetAmount: body.targetAmount !== undefined ? (body.targetAmount ? parseFloat(body.targetAmount) : null) : undefined,
      savedAmount:  body.savedAmount !== undefined ? parseFloat(body.savedAmount)   : undefined,
      status:       body.status      !== undefined ? body.status                    : undefined,
    },
  })

  return NextResponse.json(updated)
}

/** DELETE — remove wishlist (default list cannot be deleted) */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const userId = session.user.id as string
  const w = await getOwned(id, userId)
  if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (w.isDefault) return NextResponse.json({ error: "Cannot delete Saved Items list" }, { status: 400 })

  await prisma.wishlist.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
