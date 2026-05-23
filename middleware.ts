import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

// Instantiate NextAuth with the edge-safe config (no Prisma imports).
// This runs in the Edge Runtime on every request.
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  const protectedPaths = ["/checkout", "/orders", "/profile"]
  const adminPaths = ["/admin"]
  const authPaths = ["/login", "/register"]

  if (protectedPaths.some((p) => pathname.startsWith(p)) && !isAuthenticated) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url))
  }

  if (adminPaths.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    const role = (req.auth?.user as { role?: string })?.role
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  if (authPaths.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Redirect OAuth users who haven't added a phone number yet
  const needsPhone = isAuthenticated && (req.auth?.user as { needsPhone?: boolean })?.needsPhone
  const isAuthFlow = pathname.startsWith("/onboarding") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password")
  if (needsPhone && !isAuthFlow) {
    return NextResponse.redirect(new URL("/onboarding", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
