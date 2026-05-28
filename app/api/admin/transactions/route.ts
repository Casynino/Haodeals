import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { email: true, role: true },
  })
  if (!user) return null
  if (user.role === "admin" || user.email === ADMIN_EMAIL) return user
  return null
}

/** GET  — list all pending transactions across all users */
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const pending = await prisma.transaction.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  })

  return NextResponse.json(pending)
}

/** PATCH — bulk-cancel stale pending transactions older than N hours (default 2h) */
export async function PATCH(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { olderThanHours = 2, ids } = await req.json().catch(() => ({}))

  let result

  if (Array.isArray(ids) && ids.length > 0) {
    // Cancel specific IDs
    result = await prisma.transaction.updateMany({
      where: { id: { in: ids }, status: "pending" },
      data: { status: "failed" },
    })
  } else {
    // Cancel all pending older than N hours
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    result = await prisma.transaction.updateMany({
      where: { status: "pending", createdAt: { lt: cutoff } },
      data: { status: "failed" },
    })
  }

  return NextResponse.json({ cancelled: result.count })
}
