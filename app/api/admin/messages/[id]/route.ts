import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth as auth } from "@/auth-admin"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id } = await params

  const conversation = await prisma.conversation.findUnique({
    where: { id },
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

  // Mark admin unread as 0
  if (conversation.adminUnread > 0) {
    await prisma.conversation.update({
      where: { id },
      data: { adminUnread: 0 },
    })
  }

  return NextResponse.json({
    ...conversation,
    adminUnread: 0,
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
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const adminId = session.user.id as string
  const { id } = await params
  const { body } = await request.json()

  if (!body?.trim()) {
    return NextResponse.json({ error: "Message body is required" }, { status: 400 })
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
    },
  })

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: id,
        senderId: adminId,
        senderRole: "admin",
        body: body.trim(),
      },
      include: {
        sender: { select: { name: true, email: true } },
      },
    }),
    prisma.conversation.update({
      where: { id },
      data: {
        customerUnread: { increment: 1 },
        lastMessageAt: new Date(),
      },
    }),
    prisma.notification.create({
      data: {
        type: "admin_reply",
        title: "Support Reply",
        body: `Admin replied to your message: "${body.trim().slice(0, 80)}${body.trim().length > 80 ? "…" : ""}"`,
        metadata: {
          conversationId: id,
          userId: conversation.userId,
        },
      },
    }),
  ])

  return NextResponse.json(
    { ...message, createdAt: message.createdAt.toISOString() },
    { status: 201 }
  )
}
