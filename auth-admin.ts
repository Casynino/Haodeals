import NextAuth from "next-auth"
import { adminAuthConfig } from "./auth.config.admin"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers: adminHandlers, auth: adminAuth, signIn: adminSignIn, signOut: adminSignOut } = NextAuth({
  ...adminAuthConfig,
  basePath: "/api/auth/admin",
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        // Only admin-role users can obtain the admin token
        const user = await prisma.user.findFirst({
          where: {
            email: { equals: (credentials.email as string).trim(), mode: "insensitive" },
            role: "admin",
          },
        })
        if (!user || !user.password) return null
        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        if (!isValid) return null
        return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, phone: user.phone }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: sessionUpdate }) {
      if (trigger === "update" && sessionUpdate) {
        if (sessionUpdate.name  !== undefined) token.name  = sessionUpdate.name
        if (sessionUpdate.image !== undefined) token.image = sessionUpdate.image
        if (sessionUpdate.phone !== undefined) {
          token.phone      = sessionUpdate.phone
          token.needsPhone = !sessionUpdate.phone
        }
      }
      if (user) {
        token.id         = user.id
        token.role       = (user as { role?: string }).role  ?? "admin"
        token.phone      = (user as { phone?: string }).phone ?? null
        token.needsPhone = !(user as { phone?: string }).phone
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id    = token.id    as string
        session.user.name  = token.name  as string
        session.user.image = token.image as string | null
        ;(session.user as { role?: string | null }).role         = token.role      as string
        ;(session.user as { phone?: string | null }).phone       = token.phone     as string | null
        ;(session.user as { needsPhone?: boolean }).needsPhone   = token.needsPhone as boolean
      }
      return session
    },
  },
  secret: process.env.AUTH_SECRET,
})
