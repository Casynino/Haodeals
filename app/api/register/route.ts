import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { ntzs, normalizePhone } from "@/lib/ntzs"
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
    const { name, email, password, phone } = registerSchema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email } })
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

    // Provision nTZS wallet in the background — don't block registration if it fails
    ntzs.createUser({
      email,
      name: name ?? undefined,
      externalId: user.id,
      phone: phone ? normalizePhone(phone) : undefined,
    })
      .then((ntzsUser) =>
        prisma.user.update({
          where: { id: user.id },
          data: { ntzsUserId: ntzsUser.id, ntzsWalletAddress: ntzsUser.walletAddress },
        })
      )
      .catch((err) => console.error("[nTZS] wallet provisioning failed:", err))

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
