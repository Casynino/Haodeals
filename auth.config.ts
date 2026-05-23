import type { NextAuthConfig } from "next-auth"

/**
 * Edge-compatible auth config — no Prisma, no bcrypt, no nodemailer.
 * Used by middleware.ts (Edge Runtime) to verify JWT tokens.
 * auth.ts extends this with full Node.js providers + Prisma callbacks.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [], // providers only needed at sign-in time (Node.js runtime)
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
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
}
