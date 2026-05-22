import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { sendDealAnnouncement } from "@/lib/email"

export async function POST(request: Request) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { subject, message, link } = await request.json()
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 })
  }

  const users = await prisma.user.findMany({ select: { email: true } })
  const emails = users.map((u) => u.email)

  const { sent, failed } = await sendDealAnnouncement(emails, subject, message, link)

  return NextResponse.json({ sent, failed, total: emails.length })
}
