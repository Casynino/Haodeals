"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
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
import { tryAdminSignOut } from "@/app/actions/admin-auth"

type SessionUser = { name?: string; email?: string; image?: string; role?: string }

export function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  // ------------------------------------------------------------
  // Admin session — read independently from hao-admin-token via
  // /api/auth/admin/session so the Navbar stays correct even when
  // the customer authjs.session-token is absent or mismatched.
  // ------------------------------------------------------------
  const [adminUser, setAdminUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    fetch("/api/auth/admin/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: SessionUser } | null) => {
        setAdminUser(data?.user?.role === "admin" ? (data.user ?? null) : null)
      })
      .catch(() => setAdminUser(null))
  }, [])

  // Prefer adminUser for display; fall back to customer session
  const user: SessionUser | undefined = adminUser ?? (session?.user as SessionUser | undefined)
  // isAdmin: true only when hao-admin-token is present and valid
  const isAdmin = !!adminUser
  const isSignedIn = !!session || !!adminUser

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

  // ------------------------------------------------------------
  // Context-aware sign-out:
  //   - On admin routes: clear ONLY hao-admin-token — the customer
  //     session (authjs.session-token) stays intact, so other tabs
  //     that share the customer cookie are completely unaffected.
  //   - Elsewhere: full sign-out (clears both tokens).
  // ------------------------------------------------------------
  async function handleSignOut() {
    const isAdminRoute = pathname.startsWith("/admin")
    if (isAdminRoute && isAdmin) {
      // Admin-panel sign-out: only revoke the admin token
      await tryAdminSignOut()
      setAdminUser(null)
      router.push("/")
      router.refresh()
    } else {
      // Full sign-out: clear admin token (if any) + customer session
      if (adminUser) await tryAdminSignOut()
      signOut({ callbackUrl: "/" })
    }
  }

  const itemCount = mounted ? count() : 0
  const navLinks = [
    { href: "/products", label: "ALL DEALS" },
    { href: "/products?category=tech-deals", label: "TECH" },
    { href: "/products?category=fashion", label: "FASHION" },
    { href: "/products?category=accessories", label: "ACCESSORIES" },
    { href: "/products?category=shoes", label: "SHOES" },
    { href: "/products?category=sports", label: "SPORTS" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/12 bg-background/95 backdrop-blur-sm">
      {/* Top status bar */}
      <div className="border-b border-white/8 hidden md:block">
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-foreground/50 font-mono">
            <span>Free delivery nationwide</span>
            <span className="text-foreground/20">◦</span>
            <span>Secure checkout</span>
            <span className="text-foreground/20">◦</span>
            <span>M-Pesa accepted</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-foreground/45">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span>Tanzania 🇹🇿</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="container mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 font-mono font-bold text-sm tracking-[0.2em] shrink-0">
          <span className="text-foreground/40">[</span>
          <span className="text-foreground">HAO</span>
          <span className="text-foreground/65">DEALS</span>
          <span className="text-foreground/40">]</span>
        </Link>

        <span className="text-foreground/20 text-xs hidden md:block">|</span>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-xs font-mono tracking-wider text-foreground/55 hover:text-foreground hover:bg-foreground/5 transition-colors border border-transparent hover:border-white/12"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 ml-auto">
          <Link href="/products">
            <button className="w-8 h-8 flex items-center justify-center text-foreground/55 hover:text-foreground hover:bg-foreground/5 transition-colors border border-transparent hover:border-white/12">
              <Search className="h-4 w-4" />
            </button>
          </Link>

          <CartDrawer />

          {/* Admin notification bell */}
          {isAdmin && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={openNotifications}
                className="relative w-8 h-8 flex items-center justify-center text-foreground/55 hover:text-foreground hover:bg-foreground/5 transition-colors border border-transparent hover:border-white/12"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-yellow-400 text-black text-[9px] font-mono font-bold rounded-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-background border border-white/18 z-50 shadow-2xl">
                  <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                    <p className="text-[10px] tracking-widest text-foreground/60">Notifications</p>
                    <span className="text-[10px] text-foreground/40">{notifications.length} total</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/6">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-foreground/40 text-center py-6 tracking-wide">No notifications yet</p>
                    ) : notifications.map((n) => (
                      <div key={n.id} className={`px-4 py-3 ${!n.read ? "bg-foreground/[0.03]" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-foreground/75 tracking-wide">{n.title}</p>
                          {!n.read && <span className="w-2 h-2 bg-yellow-400/80 rounded-full mt-0.5 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-foreground/50 mt-1">{n.body}</p>
                        <p className="text-[10px] text-foreground/35 mt-1">{new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <ThemeToggle />

          {isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono tracking-wider text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors border border-transparent hover:border-white/15">
                <span className="text-foreground/40">&gt;</span>
                <span>{(user?.name ?? user?.email ?? "USER").toUpperCase().slice(0, 10)}</span>
                {isAdmin && <span className="text-yellow-400/80 text-[10px]">[ADMIN]</span>}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-background border border-white/15 p-0 font-mono text-xs" align="end">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-[10px] text-foreground/50 tracking-widest mb-0.5">Signed in as</p>
                  <p className="text-xs text-foreground/85 truncate">{user?.email}</p>
                  {isAdmin && (
                    <p className="text-[10px] text-yellow-400/60 mt-0.5 tracking-widest">Admin session active</p>
                  )}
                </div>
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="px-4 py-2.5 text-xs tracking-wide text-foreground/65 hover:text-foreground hover:bg-foreground/5 flex items-center gap-2.5"
                >
                  <User className="h-3.5 w-3.5" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/settings")}
                  className="px-4 py-2.5 text-xs tracking-wide text-foreground/65 hover:text-foreground hover:bg-foreground/5 flex items-center gap-2.5"
                >
                  <Settings className="h-3.5 w-3.5" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/wallet")}
                  className="px-4 py-2.5 text-xs tracking-wide text-foreground/65 hover:text-foreground hover:bg-foreground/5 flex items-center gap-2.5"
                >
                  <Wallet className="h-3.5 w-3.5" /> Wallet
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/orders")}
                  className="px-4 py-2.5 text-xs tracking-wide text-foreground/65 hover:text-foreground hover:bg-foreground/5 flex items-center gap-2.5"
                >
                  <Package className="h-3.5 w-3.5" /> My Orders
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => router.push("/admin")}
                    className="px-4 py-2.5 text-xs tracking-wide text-yellow-400/75 hover:text-yellow-400 hover:bg-yellow-400/5 flex items-center gap-2.5"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> Admin Panel
                  </DropdownMenuItem>
                )}
                <div className="border-t border-white/10">
                  <DropdownMenuItem
                    className="px-4 py-2.5 text-xs tracking-wide text-red-400/75 hover:text-red-400 hover:bg-red-400/5 flex items-center gap-2.5"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {isAdmin && pathname.startsWith("/admin") ? "Leave Admin Panel" : "Sign Out"}
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <button className="px-3.5 py-1.5 text-xs font-mono tracking-wider border border-white/25 text-foreground/65 hover:text-foreground hover:border-white/45 hover:bg-foreground/5 transition-colors">
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav tabs */}
      <div className="md:hidden border-t border-foreground/10 overflow-x-auto scrollbar-none">
        <div className="flex items-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex-shrink-0 px-4 py-2.5 text-xs font-mono tracking-wider text-foreground/55 hover:text-foreground border-r border-foreground/10 hover:bg-foreground/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {isSignedIn && (
            <Link
              href="/wallet"
              className="flex-shrink-0 px-4 py-2.5 text-xs font-mono tracking-wider text-foreground/55 hover:text-foreground border-r border-foreground/10 hover:bg-foreground/5 transition-colors"
            >
              WALLET
            </Link>
          )}
          {isSignedIn && isAdmin && (
            <Link
              href="/admin"
              className="flex-shrink-0 px-4 py-2.5 text-xs font-mono tracking-wider text-yellow-400/65 hover:text-yellow-400 border-r border-foreground/10 transition-colors"
            >
              ADMIN
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
