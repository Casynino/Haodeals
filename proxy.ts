import { auth } from "@/auth"
import { NextResponse } from "next/server"

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
  if (needsPhone && !pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
