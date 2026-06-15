import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { sendWelcomeEmail } from "@/lib/email"

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(9).max(20).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.parse(body)
    const email = parsed.email.toLowerCase().trim()
    const { name, password, phone } = parsed

    // Case-insensitive check to prevent duplicate accounts
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    })
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, phone: phone ?? null },
      select: { id: true, name: true, email: true, phone: true },
    })

    // Welcome email + admin notification — non-blocking
    sendWelcomeEmail(email, name).catch(() => {})
    prisma.notification.create({
      data: {
        type: "new_user",
        title: `New user registered`,
        body: `${name} (${email}) just created an account`,
        metadata: { userId: user.id, email },
      },
    }).catch(() => {})

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
