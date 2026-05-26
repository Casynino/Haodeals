import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id as string

  const conversations = await prisma.conversation.findMany({
    where: { userId },
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

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id as string
  const { subject, body } = await request.json()

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Subject and body are required" }, { status: 400 })
  }

  const conversation = await prisma.conversation.create({
    data: {
      userId,
      subject: subject.trim(),
      status: "open",
      adminUnread: 1,
      lastMessageAt: new Date(),
      messages: {
        create: {
          senderId: userId,
          senderRole: "customer",
          body: body.trim(),
        },
      },
    },
    include: {
      user: { select: { name: true, email: true } },
      order: { select: { id: true, trackingId: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  })

  // Notify admin
  await prisma.notification.create({
    data: {
      type: "new_message",
      title: "New Support Message",
      body: `${conversation.user.name ?? conversation.user.email}: ${subject.trim()}`,
      metadata: { conversationId: conversation.id },
    },
  })

  return NextResponse.json(
    {
      ...conversation,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: conversation.messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    },
    { status: 201 }
  )
}
