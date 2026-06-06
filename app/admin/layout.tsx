"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, ShoppingBag, Package, Users, BarChart2,
  Boxes, MessageSquare, ChevronLeft, ChevronRight, Menu, X,
  Settings, Bell,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

const NAV = [
  { href: "/admin",           label: "Dashboard",   icon: LayoutDashboard, exact: true },
  { href: "/admin/orders",    label: "Orders",      icon: ShoppingBag                  },
  { href: "/admin/products",  label: "Products",    icon: Package                      },
  { href: "/admin/customers", label: "Customers",   icon: Users                        },
  { href: "/admin/analytics", label: "Analytics",   icon: BarChart2                    },
  { href: "/admin/inventory", label: "Inventory",   icon: Boxes                        },
  { href: "/admin/messages",  label: "Messages",    icon: MessageSquare                },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const { data: session, status } = useSession()
  const router    = useRouter()
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/admin")
  }, [status, router])

  const user = session?.user as { name?: string | null; role?: string } | undefined
  if (status === "loading") return null
  if (user?.role !== "admin") return null

  function SidebarContent({ onClose }: { onClose?: () => void }) {
    return (
      <div className="flex flex-col h-full">
        {/* Brand header */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-white/8 min-h-[56px]
          ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <div>
              <p className="text-[11px] font-black tracking-[0.25em] text-foreground/85">[ HAO DEALS ]</p>
              <p className="text-[8px] text-violet-400/55 tracking-[0.3em] mt-0.5">ADMIN CONSOLE</p>
            </div>
          )}
          <button
            onClick={() => { setCollapsed(!collapsed); onClose?.() }}
            className="p-1 text-foreground/28 hover:text-foreground/60 transition-colors hidden lg:block flex-shrink-0"
          >
            {collapsed
              ? <ChevronRight className="h-3.5 w-3.5" />
              : <ChevronLeft className="h-3.5 w-3.5" />
            }
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 text-foreground/28 hover:text-foreground/60 lg:hidden">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] tracking-widest transition-all font-mono
                  ${active
                    ? "bg-violet-500/15 text-violet-400 border border-violet-500/20 shadow-sm"
                    : "text-foreground/35 hover:text-foreground/68 hover:bg-white/[0.04] border border-transparent"
                  } ${collapsed ? "justify-center px-2" : ""}`}
                title={collapsed ? label : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{label.toUpperCase()}</span>}
                {active && !collapsed && <div className="ml-auto w-1 h-1 bg-violet-400 rounded-full" />}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className={`border-t border-white/8 px-3 py-3 ${collapsed ? "flex justify-center" : ""}`}>
          {collapsed ? (
            <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center">
              <span className="text-[9px] font-bold text-violet-400">{user?.name?.[0]?.toUpperCase() ?? "A"}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-violet-400">{user?.name?.[0]?.toUpperCase() ?? "A"}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold text-foreground/65 truncate">{user?.name ?? "Admin"}</p>
                <p className="text-[7px] text-violet-400/50 tracking-widest">ADMINISTRATOR</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex font-mono">

      {/* ── Desktop sidebar ── */}
      <aside className={`hidden lg:flex flex-col flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)]
        border-r border-white/8 bg-background overflow-hidden transition-all duration-200
        ${collapsed ? "w-14" : "w-56"}`}>
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar (overlay) ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-56 h-full bg-background border-r border-white/10 flex flex-col z-10 shadow-2xl">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/8 sticky top-0 bg-background/95 backdrop-blur-sm z-30">
          <button onClick={() => setMobileOpen(true)}
            className="p-1.5 border border-white/12 rounded-lg text-foreground/40 hover:text-foreground/70 transition-colors">
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-[10px] tracking-[0.25em] text-foreground/55 font-mono">ADMIN PANEL</span>
        </div>

        {children}
      </main>
    </div>
  )
}
