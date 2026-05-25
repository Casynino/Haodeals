import type { NextAuthConfig } from "next-auth"

/**
 * Edge-compatible admin auth config — no Prisma, no bcrypt, no nodemailer.
 * Used by proxy.ts (Edge Runtime) to verify the hao-admin-token JWT.
 * auth-admin.ts extends this with the full Credentials provider + Prisma.
 *
 * Separate from authConfig so admin and customer sessions use DIFFERENT cookies
 * and can coexist independently in the same browser without interfering.
 */
export const adminAuthConfig: NextAuthConfig = {
  trustHost: true,
  providers: [],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  // Dedicated cookie — completely separate from the customer authjs.session-token.
  // Customer logins CANNOT overwrite this cookie.
  cookies: {
    sessionToken: {
      name: "hao-admin-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
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
