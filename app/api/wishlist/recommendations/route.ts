import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GET /api/wishlist/recommendations
 *
 * Returns up to 12 personalised product recommendations based on:
 *   1. Categories of products the user has saved
 *   2. Price range of saved products (±60% of average)
 *   3. Products the user has previously purchased (for complementary items)
 *
 * Excludes products the user has already saved or purchased.
 * Falls back to featured/newest if the user has no saved items yet.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json([])
  const userId = session.user.id as string

  /* ── Gather user context ─────────────────────────────────────────── */
  const [defaultList, orders] = await Promise.all([
    prisma.wishlist.findFirst({
      where: { userId, isDefault: true },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, price: true, categoryId: true },
            },
          },
        },
      },
    }),
    prisma.order.findMany({
      where: { userId, status: { not: "pending_payment" } },
      include: {
        items: {
          include: { product: { select: { id: true, categoryId: true } } },
        },
      },
    }),
  ])

  const savedProducts  = defaultList?.items.map((i) => i.product) ?? []
  const savedIds       = new Set(savedProducts.map((p) => p.id))
  const purchasedIds   = new Set(orders.flatMap((o) => o.items.map((i) => i.product.id)))
  const purchasedCategoryIds = new Set(orders.flatMap((o) => o.items.map((i) => i.product.categoryId)))
  const excludeIds     = [...new Set([...savedIds, ...purchasedIds])]

  /* ── Compute preferences ─────────────────────────────────────────── */
  const savedCategoryIds = [...new Set(savedProducts.map((p) => p.categoryId))]
  const allPreferredCats = [...new Set([...savedCategoryIds, ...purchasedCategoryIds])]

  const prices  = savedProducts.map((p) => p.price)
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null
  const priceMin = avgPrice ? avgPrice * 0.4 : 0
  const priceMax = avgPrice ? avgPrice * 2.2 : 9_999_999

  /* ── Query candidates ────────────────────────────────────────────── */
  const candidates = await prisma.product.findMany({
    where: {
      id:    { notIn: excludeIds.length ? excludeIds : ["__none__"] },
      stock: { gt: 0 },
      ...(allPreferredCats.length > 0
        ? {
            OR: [
              { categoryId: { in: allPreferredCats } },
              ...(avgPrice ? [{ price: { gte: priceMin, lte: priceMax } }] : []),
            ],
          }
        : {}),
    },
    include: {
      category: { select: { name: true } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 40, // over-fetch so scoring can pick the best 12
  })

  /* ── Score & rank ────────────────────────────────────────────────── */
  const scored = candidates
    .map((p) => {
      let score = 0
      // Saved category match (strongest signal)
      if (savedCategoryIds.includes(p.categoryId))    score += 5
      // Purchased category match (second signal)
      if (purchasedCategoryIds.has(p.categoryId))     score += 3
      // Price proximity to average saved price
      if (avgPrice) {
        const diff = Math.abs(p.price - avgPrice) / avgPrice
        if (diff < 0.20) score += 3
        else if (diff < 0.50) score += 1
      }
      // Boost featured & discounted products
      if (p.featured)           score += 2
      if (p.originalPrice && p.originalPrice > p.price) score += 1

      return { ...p, _score: score }
    })
    .sort((a, b) => b._score - a._score || b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 12)

  /* ── Serialize ───────────────────────────────────────────────────── */
  return NextResponse.json(
    scored.map(({ _score, ...p }) => ({
      ...p,
      images: (() => { try { return JSON.parse(p.images) } catch { return [] } })(),
    }))
  )
}
