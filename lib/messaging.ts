import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/utils"

export async function createOrderConversation(
  orderId: string,
  userId: string,
  trackingId: string | null | undefined,
  total: number
) {
  const subject = trackingId
    ? `Order #${trackingId}`
    : `Order confirmed — ${formatPrice(total)}`

  const conversation = await prisma.conversation.create({
    data: {
      userId,
      orderId,
      subject,
      status: "open",
      customerUnread: 0,
      adminUnread: 0,
      messages: {
        create: {
          senderRole: "system",
          body: `Your order has been confirmed! We'll keep you updated as it progresses. Total: ${formatPrice(total)}${trackingId ? ` · Tracking: ${trackingId}` : ""}.`,
        },
      },
    },
  })

  return conversation
}

export async function addOrderStatusMessage(
  orderId: string,
  status: string,
  messageText: string
) {
  const conversation = await prisma.conversation.findUnique({
    where: { orderId },
  })

  if (!conversation) return null

  const [, updatedConversation] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderRole: "system",
        body: messageText,
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        customerUnread: { increment: 1 },
        lastMessageAt: new Date(),
      },
    }),
  ])

  return updatedConversation
}
