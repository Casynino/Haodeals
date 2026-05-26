import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id as string
  const { id } = await params

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: {
      user: { select: { name: true, email: true } },
      order: { select: { id: true, trackingId: true } },
      messages: {
        include: {
          sender: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  // Mark customer unread as 0
  if (conversation.customerUnread > 0) {
    await prisma.conversation.update({
      where: { id },
      data: { customerUnread: 0 },
    })
  }

  return NextResponse.json({
    ...conversation,
    customerUnread: 0,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages: conversation.messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id as string
  const { id } = await params
  const { body } = await request.json()

  if (!body?.trim()) {
    return NextResponse.json({ error: "Message body is required" }, { status: 400 })
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
  })

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        senderRole: "customer",
        body: body.trim(),
      },
      include: {
        sender: { select: { name: true, email: true } },
      },
    }),
    prisma.conversation.update({
      where: { id },
      data: {
        adminUnread: { increment: 1 },
        lastMessageAt: new Date(),
      },
    }),
  ])

  return NextResponse.json(
    { ...message, createdAt: message.createdAt.toISOString() },
    { status: 201 }
  )
}
