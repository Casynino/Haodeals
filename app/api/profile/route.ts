import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const updateSchema = z.object({
  name:        z.string().min(2).max(50).optional(),
  phone:       z.string().min(9).max(20).optional().nullable(),
  image:       z.string().url().optional().nullable(),
  newPassword: z.string().min(6).optional(),
  currentPassword: z.string().optional(),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const { name, phone, image, newPassword, currentPassword } = parsed.data
  const userId = session.user.id as string

  const updateData: Record<string, unknown> = {}
  if (name  !== undefined) updateData.name  = name
  if (phone !== undefined) updateData.phone = phone
  if (image !== undefined) updateData.image = image

  // Password change requires current password verification
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password required" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } })
    if (!user?.password) return NextResponse.json({ error: "No password set" }, { status: 400 })
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    updateData.password = await bcrypt.hash(newPassword, 10)
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, phone: true, image: true },
  })

  return NextResponse.json(updated)
}
