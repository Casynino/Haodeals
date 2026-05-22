import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// nTZS signs the payload as HMAC-SHA256 over `${timestamp}.${body}`
function verifySignature(body: string, timestamp: string, signature: string): boolean {
  const secret = process.env.NTZS_WEBHOOK_SECRET
  if (!secret) return false
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex")
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const timestamp = req.headers.get("x-ntzs-timestamp") ?? ""
  const signature = req.headers.get("x-ntzs-signature") ?? ""

  if (!verifySignature(body, timestamp, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(body) as {
    event: string
    data: { id: string; metadata?: { orderId?: string }; userId?: string }
  }

  if (event.event === "deposit.completed") {
    const orderId = event.data.metadata?.orderId
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "confirmed" },
      })
      // Clear the user's cart
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true },
      })
      if (order) {
        await prisma.cart.deleteMany({ where: { userId: order.userId } })
      }
    }
  }

  return NextResponse.json({ received: true })
}
