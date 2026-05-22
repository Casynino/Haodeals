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
import { Package, LogOut, User, ShieldCheck, Search, Wallet, Settings, Bell } from "lucide-react"
import { useState, useEffect, useRef } from "react"

export function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as { name?: string; email?: string; image?: string; role?: string } | undefined
  const isAdmin = user?.role === "admin"

  const [mounted, setMounted] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; title: string; body: string; read: boolean; createdAt: string }[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef<HTMLDivElement>(null)
  const { count } = useCart()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!isAdmin) return
    fetch("/api/notifications").then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setNotifications(d.notifications); setUnreadCount(d.unreadCount) }
    })
  }, [isAdmin])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function openNotifications() {
    setNotifOpen((o) => !o)
    if (unreadCount > 0) {
      fetch("/api/notifications", { method: "PATCH" }).then(() => setUnreadCount(0))
    }
  }
  const itemCount = mounted ? count() : 0
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
            <span>FREE.DELIVERY.NATIONWIDE</span>
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

          {/* Admin notification bell */}
          {isAdmin && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={openNotifications}
                className="relative w-8 h-8 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors border border-transparent hover:border-white/10"
              >
                <Bell className="h-3.5 w-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-yellow-400 text-black text-[8px] font-mono font-bold rounded-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-background border border-white/15 z-50 shadow-xl">
                  <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                    <p className="text-[9px] tracking-widest text-foreground/50">// NOTIFICATIONS</p>
                    <span className="text-[8px] text-foreground/30">{notifications.length} TOTAL</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <p className="text-[9px] text-foreground/30 text-center py-6 tracking-widest">NO NOTIFICATIONS</p>
                    ) : notifications.map((n) => (
                      <div key={n.id} className={`px-3 py-2.5 ${!n.read ? "bg-foreground/3" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[9px] text-foreground/70 tracking-wide">{n.title}</p>
                          {!n.read && <span className="w-1.5 h-1.5 bg-yellow-400/70 rounded-full mt-1 shrink-0" />}
                        </div>
                        <p className="text-[8px] text-foreground/40 mt-0.5">{n.body}</p>
                        <p className="text-[7px] text-foreground/25 mt-1">{new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
                  onClick={() => router.push("/settings")}
                  className="px-3 py-2 text-[10px] tracking-widest text-foreground/60 hover:text-foreground hover:bg-foreground/5 flex items-center gap-2"
                >
                  <Settings className="h-3 w-3" /> SETTINGS
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/wallet")}
                  className="px-3 py-2 text-[10px] tracking-widest text-foreground/60 hover:text-foreground hover:bg-foreground/5 flex items-center gap-2"
                >
                  <Wallet className="h-3 w-3" /> WALLET
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

        </div>
      </div>

      {/* Mobile nav tabs — always visible below header bar */}
      <div className="md:hidden border-t border-foreground/10 overflow-x-auto scrollbar-none">
        <div className="flex items-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex-shrink-0 px-4 py-2.5 text-[10px] font-mono tracking-widest text-foreground/50 hover:text-foreground border-r border-foreground/10 hover:bg-foreground/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {session && (
            <Link
              href="/wallet"
              className="flex-shrink-0 px-4 py-2.5 text-[10px] font-mono tracking-widest text-foreground/50 hover:text-foreground border-r border-foreground/10 hover:bg-foreground/5 transition-colors"
            >
              WALLET
            </Link>
          )}
          {session && isAdmin && (
            <Link
              href="/admin"
              className="flex-shrink-0 px-4 py-2.5 text-[10px] font-mono tracking-widest text-yellow-400/60 hover:text-yellow-400 border-r border-foreground/10 transition-colors"
            >
              ADMIN
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
