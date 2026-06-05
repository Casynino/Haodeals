import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/** POST — add a product to the wishlist */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: wishlistId } = await params
  const userId = session.user.id as string

  const wishlist = await prisma.wishlist.findUnique({ where: { id: wishlistId } })
  if (!wishlist || wishlist.userId !== userId)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

  try {
    const item = await prisma.wishlistItem.create({
      data: { wishlistId, productId },
      include: { product: { select: { id: true, name: true, price: true, images: true } } },
    })
    return NextResponse.json(item, { status: 201 })
  } catch {
    // unique constraint — already in list
    return NextResponse.json({ error: "Already in list" }, { status: 409 })
  }
}
