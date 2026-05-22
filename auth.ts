import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
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

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          phone: user.phone,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session: sessionUpdate }) {
      if (trigger === "update" && sessionUpdate) {
        if (sessionUpdate.name  !== undefined) token.name  = sessionUpdate.name
        if (sessionUpdate.phone !== undefined) token.phone = sessionUpdate.phone
        if (sessionUpdate.image !== undefined) token.image = sessionUpdate.image
      }
      if (user) {
        token.id    = user.id
        token.role  = (user as { role?: string }).role  ?? "customer"
        token.phone = (user as { phone?: string }).phone ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id    = token.id    as string
        session.user.name  = token.name  as string
        session.user.image = token.image as string | null
        ;(session.user as { role?:  string | null }).role  = token.role  as string
        ;(session.user as { phone?: string | null }).phone = token.phone as string | null
      }
      return session
    },
  },
  secret: process.env.AUTH_SECRET,
})
