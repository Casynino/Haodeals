import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  fullName:  z.string().min(1).max(100).optional(),
  phone:     z.string().min(6).max(25).optional().nullable(),
  street:    z.string().min(1).max(300).optional(),
  city:      z.string().min(1).max(100).optional(),
  label:     z.string().max(30).optional().nullable(),
  isDefault: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id as string
  const { id } = await params

  // Ownership check
  const existing = await prisma.address.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid fields" }, { status: 400 })

  const { isDefault, ...rest } = parsed.data

  // If setting as default, unset all others first
  if (isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
  }

  const updated = await prisma.address.update({
    where: { id },
    data: { ...rest, ...(isDefault !== undefined ? { isDefault } : {}) },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id as string
  const { id } = await params

  const existing = await prisma.address.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.address.delete({ where: { id } })

  // If the deleted address was default, promote the most recent remaining one
  if (existing.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } })
    }
  }

  return NextResponse.json({ ok: true })
}
