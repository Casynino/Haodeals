import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/** GET — returns product IDs in the user's default "Saved Items" wishlist */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json([])
  const userId = session.user.id as string

  const defaultList = await prisma.wishlist.findFirst({
    where: { userId, isDefault: true },
    select: { items: { select: { productId: true } } },
  })

  return NextResponse.json(defaultList?.items.map((i) => i.productId) ?? [])
}
