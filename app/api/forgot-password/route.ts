import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import { z } from "zod"
import crypto from "crypto"

const schema = z.object({
  email: z.string().email(),
})

// Token valid for 1 hour
const EXPIRY_MS = 60 * 60 * 1000

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)

    // Case-insensitive user lookup
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } },
      select: { id: true, email: true, name: true },
    })

    // Always return success to prevent email enumeration attacks.
    // We still generate/send if user exists.
    if (user) {
      // Delete any existing tokens for this email
      await prisma.passwordResetToken.deleteMany({ where: { email: user.email } })

      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + EXPIRY_MS)

      await prisma.passwordResetToken.create({
        data: { email: user.email, token, expiresAt },
      })

      const resetUrl = `${process.env.APP_URL ?? process.env.AUTH_URL ?? "https://haodealtz.com"}/reset-password?token=${token}`

      await sendPasswordResetEmail(
        user.email,
        user.name ?? user.email.split("@")[0],
        resetUrl,
      )
    }

    // Always return 200 — never reveal if email exists
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }
    console.error("[forgot-password]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
