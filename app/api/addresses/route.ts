import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  fullName:  z.string().min(1).max(100),
  phone:     z.string().min(6).max(25).optional().nullable(),
  street:    z.string().min(1).max(300),
  city:      z.string().min(1).max(100),
  label:     z.string().max(30).optional().nullable(),
  isDefault: z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id as string },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  })
  return NextResponse.json(addresses)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id as string

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid fields" }, { status: 400 })

  const { fullName, phone, street, city, label, isDefault } = parsed.data

  // Count existing addresses
  const count = await prisma.address.count({ where: { userId } })
  const setDefault = isDefault ?? count === 0  // first address is always default

  // If setting as default, unset all others first
  if (setDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } })
  }

  const address = await prisma.address.create({
    data: { userId, fullName, phone: phone ?? null, street, city, label: label ?? null, isDefault: setDefault },
  })

  return NextResponse.json(address, { status: 201 })
}
