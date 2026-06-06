import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Always return fresh product data — deals expire in real-time
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const featured = searchParams.get("featured")
  const search = searchParams.get("search")
  const limit = parseInt(searchParams.get("limit") ?? "50")

  const products = await prisma.product.findMany({
    where: {
      ...(category && { category: { slug: category } }),
      ...(featured === "true" && { featured: true }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    },
    include: {
      category: true,
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return NextResponse.json(
    products.map((p) => ({
      ...p,
      images: JSON.parse(p.images),
    }))
  )
}
