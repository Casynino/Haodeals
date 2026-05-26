import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth as auth } from "@/auth-admin"

export async function GET() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const conversations = await prisma.conversation.findMany({
    include: {
      user: { select: { name: true, email: true } },
      order: { select: { id: true, trackingId: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
  })

  return NextResponse.json(
    conversations.map((c) => ({
      ...c,
      lastMessageAt: c.lastMessageAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messages: c.messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    }))
  )
}
