import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")?.trim().toUpperCase()

  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 })

  const discount = await prisma.discountCode.findFirst({
    where: {
      code,
      userId: session.user.id as string,
      used: false,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, code: true, percent: true, expiresAt: true },
  })

  if (!discount) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 404 })
  }

  return NextResponse.json(discount)
}
