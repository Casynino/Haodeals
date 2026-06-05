import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * POST { productId }
 * Toggles a product in the user's default "Saved Items" wishlist.
 * Auto-creates the default list on first use.
 * Returns { liked: boolean }
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id as string

  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

  // Get or create the default wishlist
  let defaultList = await prisma.wishlist.findFirst({
    where: { userId, isDefault: true },
  })
  if (!defaultList) {
    defaultList = await prisma.wishlist.create({
      data: { userId, name: "Saved Items", isDefault: true, emoji: "❤️", color: "rose" },
    })
  }

  // Toggle the item
  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: defaultList.id, productId } },
  })

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } })
    return NextResponse.json({ liked: false })
  } else {
    await prisma.wishlistItem.create({ data: { wishlistId: defaultList.id, productId } })
    return NextResponse.json({ liked: true })
  }
}
