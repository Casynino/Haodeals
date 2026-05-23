import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { sendWelcomeEmail } from "@/lib/email"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user || !user.password) return null
        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        if (!isValid) return null
        return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, phone: user.phone }
      },
    }),
    // Google OAuth
    // Add GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in Vercel → Settings → Env Vars
    // Setup: console.cloud.google.com → APIs & Services → OAuth 2.0 Credentials
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    // Create user in DB on first Google sign-in
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({ where: { email: user.email } })
        if (!existing) {
          const created = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? user.email.split("@")[0],
              image: user.image ?? null,
              role: "customer",
            },
          })
          sendWelcomeEmail(created.email, created.name ?? created.email.split("@")[0]).catch(console.error)
        }
      }
      return true
    },

    async jwt({ token, user, account, trigger, session: sessionUpdate }) {
      if (trigger === "update" && sessionUpdate) {
        if (sessionUpdate.name  !== undefined) token.name  = sessionUpdate.name
        if (sessionUpdate.image !== undefined) token.image = sessionUpdate.image
        if (sessionUpdate.phone !== undefined) {
          token.phone      = sessionUpdate.phone
          token.needsPhone = !sessionUpdate.phone
        }
      }
      if (user && account) {
        if (account.provider !== "credentials") {
          // OAuth: pull role + phone from our DB record
          const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
          if (dbUser) {
            token.id         = dbUser.id
            token.role       = dbUser.role
            token.phone      = dbUser.phone ?? null
            token.needsPhone = !dbUser.phone
          }
        } else {
          token.id         = user.id
          token.role       = (user as { role?: string }).role  ?? "customer"
          token.phone      = (user as { phone?: string }).phone ?? null
          token.needsPhone = !(user as { phone?: string }).phone
        }
      }
      return token
    },

    // Extends the session callback from authConfig
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
