import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin") return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  const unreadCount = await prisma.notification.count({ where: { read: false } })

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await prisma.notification.updateMany({ where: { read: false }, data: { read: true } })
  return NextResponse.json({ success: true })
}
