import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse, type NextRequest } from "next/server"
import { decode } from "@auth/core/jwt"

// Customer auth — reads authjs.session-token (or __Secure-authjs.session-token in production)
const { auth } = NextAuth(authConfig)

/**
 * Decode the hao-admin-token JWT without importing Node.js modules.
 * @auth/core/jwt uses the Web Crypto API — fully Edge-compatible.
 * The salt MUST match the cookie name, which is what NextAuth uses when encoding.
 */
async function getAdminToken(req: NextRequest) {
  const cookieName = "hao-admin-token"
  const raw = req.cookies.get(cookieName)?.value
  if (!raw) return null
  try {
    return await decode({
      token: raw,
      secret: process.env.AUTH_SECRET!,
      salt: cookieName,
    })
  } catch {
    return null
  }
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const isCustomerAuthenticated = !!req.auth

  const protectedPaths = ["/checkout", "/orders", "/profile"]
  const adminPaths     = ["/admin"]

  // ── Customer-protected routes ──────────────────────────────────────────────
  if (protectedPaths.some((p) => pathname.startsWith(p)) && !isCustomerAuthenticated) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url))
  }

  // ── Admin routes — verified against the DEDICATED hao-admin-token cookie ───
  // This is independent of the customer session cookie.  A customer logging in
  // on another tab cannot displace the admin session because it writes to a
  // different cookie entirely.
  if (adminPaths.some((p) => pathname.startsWith(p))) {
    const adminToken = await getAdminToken(req)
    if (!adminToken) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    if ((adminToken as { role?: string }).role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return NextResponse.next()
  }

  // ── Phone-onboarding redirect for Google OAuth users ──────────────────────
  // /login and /register are included so users with needsPhone can still reach
  // the login page to switch accounts without being stuck in a redirect loop.
  const needsPhone = isCustomerAuthenticated &&
    (req.auth?.user as { needsPhone?: boolean })?.needsPhone
  const isAuthFlow =
    pathname.startsWith("/onboarding")      ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")  ||
    pathname.startsWith("/login")           ||
    pathname.startsWith("/register")
  if (needsPhone && !isAuthFlow) {
    return NextResponse.redirect(new URL("/onboarding", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
