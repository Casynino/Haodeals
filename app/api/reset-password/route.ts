import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, password } = schema.parse(body)

    // Find and validate the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 })
    }

    if (resetToken.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({ where: { token } })
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 })
    }

    // Find the user (case-insensitive for safety)
    const user = await prisma.user.findFirst({
      where: { email: { equals: resetToken.email, mode: "insensitive" } },
    })

    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 400 })
    }

    // Hash new password and update user
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    // Delete all reset tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email: resetToken.email } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 })
    }
    console.error("[reset-password]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
