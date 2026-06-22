"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Home, LayoutGrid, ShoppingCart, Heart, User } from "lucide-react"
import { useCart } from "@/hooks/useCart"

export function BottomNav() {
  const pathname = usePathname()
  const { status } = useSession()
  const count = useCart((s) => s.count())
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Hide on admin and auth screens
  if (pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/register")) return null

  const profileHref = status === "authenticated" ? "/profile" : "/login"

  const items = [
    { href: "/",          label: "Home",    icon: Home,         match: (p: string) => p === "/" },
    { href: "/products",  label: "Shop",    icon: LayoutGrid,   match: (p: string) => p.startsWith("/products") },
    { href: "/cart",      label: "Cart",    icon: ShoppingCart, match: (p: string) => p.startsWith("/cart"), badge: mounted ? count : 0 },
    { href: "/wishlist",  label: "Saved",   icon: Heart,        match: (p: string) => p.startsWith("/wishlist") },
    { href: profileHref,  label: "Profile", icon: User,         match: (p: string) => p.startsWith("/profile") },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-foreground/10 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 h-16">
        {items.map(({ href, label, icon: Icon, match, badge }) => {
          const active = match(pathname)
          return (
            <Link
              key={label}
              href={href}
              className="relative flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <div className="relative">
                <Icon className={`h-[22px] w-[22px] transition-colors ${active ? "text-gold" : "text-foreground/45"}`} />
                {badge ? (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-gold text-black text-[10px] font-bold flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${active ? "text-gold" : "text-foreground/45"}`}>
                {label}
              </span>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gold" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
