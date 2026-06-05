import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/** DELETE — remove a product from the wishlist */
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: wishlistId, productId } = await params
  const userId = session.user.id as string

  const wishlist = await prisma.wishlist.findUnique({ where: { id: wishlistId } })
  if (!wishlist || wishlist.userId !== userId)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.wishlistItem.deleteMany({ where: { wishlistId, productId } })
  return NextResponse.json({ removed: true })
}
