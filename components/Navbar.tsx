"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ThemeToggle"
import { CartDrawer } from "@/components/CartDrawer"
import { useCart } from "@/hooks/useCart"
import { Package, LogOut, User, ShieldCheck, Search, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"

export function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { count } = useCart()
  useEffect(() => setMounted(true), [])
  const itemCount = mounted ? count() : 0
  const user = session?.user as
    | { name?: string; email?: string; image?: string; role?: string }
    | undefined
  const isAdmin = user?.role === "admin"

  const navLinks = [
    { href: "/products", label: "DEALS" },
    { href: "/products?category=electronics", label: "ELECTRONICS" },
    { href: "/products?category=fashion", label: "FASHION" },
    { href: "/products?category=home", label: "HOME" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/95 backdrop-blur-sm">
      {/* Top status bar */}
      <div className="border-b border-white/5 hidden md:block">
        <div className="container mx-auto px-4 py-1 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[9px] text-foreground/30 font-mono">
            <span>SYS.ACTIVE</span>
            <span>◦</span>
            <span>SECURE.CONNECTION</span>
            <span>◦</span>
            <span>FREE.SHIPPING.ON.TSh 100,000+</span>
          </div>
          <div className="flex items-center gap-3 text-[9px] text-foreground/30">
            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
            <span>MARKET.SYS v2.0.0</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="container mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-mono font-bold text-sm tracking-[0.2em] shrink-0">
          <span className="text-foreground/40">[</span>
          <span className="text-foreground">HAO</span>
          <span className="text-foreground/60">DEALS</span>
          <span className="text-foreground/40">]</span>
        </Link>

        <span className="text-foreground/20 text-xs hidden md:block">|</span>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-[10px] font-mono tracking-widest text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors border border-transparent hover:border-white/10"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 ml-auto">
          <Link href="/products">
            <button className="w-8 h-8 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors border border-transparent hover:border-white/10">
              <Search className="h-3.5 w-3.5" />
            </button>
          </Link>

          <CartDrawer />
          <ThemeToggle />

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono tracking-widest text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors border border-transparent hover:border-white/10">
                <span className="text-foreground/30">&gt;</span>
                <span>{(user?.name ?? user?.email ?? "USER").toUpperCase().slice(0, 8)}</span>
                {isAdmin && <span className="text-yellow-400/70">[ADMIN]</span>}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 bg-background border border-white/10 p-0 font-mono text-xs" align="end">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-[9px] text-foreground/40 tracking-widest">SESSION.USER</p>
                  <p className="text-xs text-foreground truncate mt-0.5">{user?.email}</p>
                </div>
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="px-3 py-2 text-[10px] tracking-widest text-foreground/60 hover:text-foreground hover:bg-foreground/5 flex items-center gap-2"
                >
                  <User className="h-3 w-3" /> PROFILE
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/orders")}
                  className="px-3 py-2 text-[10px] tracking-widest text-foreground/60 hover:text-foreground hover:bg-foreground/5 flex items-center gap-2"
                >
                  <Package className="h-3 w-3" /> ORDERS
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => router.push("/admin")}
                    className="px-3 py-2 text-[10px] tracking-widest text-yellow-400/70 hover:text-yellow-400 hover:bg-yellow-400/5 flex items-center gap-2"
                  >
                    <ShieldCheck className="h-3 w-3" /> ADMIN.PANEL
                  </DropdownMenuItem>
                )}
                <div className="border-t border-white/10">
                  <DropdownMenuItem
                    className="px-3 py-2 text-[10px] tracking-widest text-red-400/70 hover:text-red-400 hover:bg-red-400/5 flex items-center gap-2"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="h-3 w-3" /> TERMINATE.SESSION
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <button className="px-3 py-1.5 text-[10px] font-mono tracking-widest border border-white/20 text-foreground/60 hover:text-foreground hover:border-white/40 hover:bg-foreground/5 transition-colors">
                SIGN.IN
              </button>
            </Link>
          )}

          <button
            className="md:hidden w-8 h-8 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-background">
          <div className="container mx-auto px-4 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-2 py-3 text-[10px] font-mono tracking-widest text-foreground/50 hover:text-foreground border-b border-white/5"
                onClick={() => setMobileOpen(false)}
              >
                <span className="text-foreground/25">&gt;</span>{link.label}
              </Link>
            ))}
            {session ? (
              <>
                <Link href="/orders" className="flex items-center gap-2 px-2 py-3 text-[10px] font-mono tracking-widest text-foreground/50 hover:text-foreground border-b border-white/5" onClick={() => setMobileOpen(false)}>
                  <span className="text-foreground/25">&gt;</span>MY.ORDERS
                </Link>
                <Link href="/profile" className="flex items-center gap-2 px-2 py-3 text-[10px] font-mono tracking-widest text-foreground/50 hover:text-foreground border-b border-white/5" onClick={() => setMobileOpen(false)}>
                  <span className="text-foreground/25">&gt;</span>PROFILE
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="flex items-center gap-2 px-2 py-3 text-[10px] font-mono tracking-widest text-yellow-400/60 hover:text-yellow-400 border-b border-white/5" onClick={() => setMobileOpen(false)}>
                    <span className="text-yellow-400/30">&gt;</span>ADMIN.PANEL
                  </Link>
                )}
                <button
                  className="flex items-center gap-2 w-full px-2 py-3 text-[10px] font-mono tracking-widest text-red-400/60 hover:text-red-400"
                  onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }) }}
                >
                  <span className="text-red-400/30">&gt;</span>TERMINATE.SESSION
                </button>
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-2 px-2 py-3 text-[10px] font-mono tracking-widest text-foreground/50 hover:text-foreground" onClick={() => setMobileOpen(false)}>
                <span className="text-foreground/25">&gt;</span>SIGN.IN
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
