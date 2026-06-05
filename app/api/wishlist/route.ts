import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/** GET — list all wishlists for the current user with computed totals */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id as string

  const wishlists = await prisma.wishlist.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: {
      items: {
        include: { product: { select: { id: true, price: true, name: true, images: true } } },
      },
    },
  })

  return NextResponse.json(
    wishlists.map((w) => {
      const totalCost = w.items.reduce((s, i) => s + i.product.price, 0)
      const pct = w.targetAmount && w.targetAmount > 0
        ? Math.min(100, Math.round((w.savedAmount / w.targetAmount) * 100))
        : totalCost > 0
        ? Math.min(100, Math.round((w.savedAmount / totalCost) * 100))
        : 0
      return { ...w, totalCost, progressPct: pct }
    })
  )
}

/** POST — create a new wishlist / goal */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id as string

  const { name, description, emoji, color, targetAmount } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })

  const wishlist = await prisma.wishlist.create({
    data: {
      userId,
      name: name.trim(),
      description: description?.trim() || null,
      emoji: emoji || "✨",
      color: color || "violet",
      targetAmount: targetAmount ? parseFloat(targetAmount) : null,
    },
  })

  return NextResponse.json(wishlist, { status: 201 })
}
