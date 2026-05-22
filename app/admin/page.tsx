"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingBag, Users, Package, DollarSign, ArrowRight, TrendingUp, Plus } from "lucide-react"

interface Stats {
  totalOrders: number
  totalUsers: number
  totalProducts: number
  totalRevenue: number
  recentOrders: Array<{
    id: string
    total: number
    status: string
    createdAt: string
    user: { name?: string; email: string }
    items: unknown[]
  }>
}

const statusConfig: Record<string, string> = {
  pending:   "text-yellow-400/70 border-yellow-400/30",
  confirmed: "text-blue-400/70 border-blue-400/30",
  shipped:   "text-purple-400/70 border-purple-400/30",
  delivered: "text-green-400/70 border-green-400/30",
  cancelled: "text-red-400/70 border-red-400/30",
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const statCards = [
    { label: "TOTAL.REVENUE", value: stats ? `$${stats.totalRevenue.toFixed(2)}` : "—", icon: DollarSign, accent: "text-green-400/70" },
    { label: "TOTAL.ORDERS",  value: stats?.totalOrders ?? "—",   icon: ShoppingBag, accent: "text-blue-400/70" },
    { label: "TOTAL.USERS",   value: stats?.totalUsers ?? "—",    icon: Users,       accent: "text-purple-400/70" },
    { label: "PRODUCTS",      value: stats?.totalProducts ?? "—", icon: Package,     accent: "text-foreground/60" },
  ]

  return (
    <div className="container mx-auto px-4 py-8 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/30 text-[10px]">//</span>
          <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">ADMIN.DASHBOARD</h1>
          <div className="flex items-center gap-1 ml-2">
            <div className="w-1.5 h-1.5 bg-green-400/60 rounded-full animate-pulse" />
            <span className="text-[8px] text-green-400/60">SYS.ACTIVE</span>
          </div>
        </div>
        <Link
          href="/admin/products"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-white/20 text-[9px] tracking-widest text-foreground/50 hover:text-foreground hover:border-white/40 transition-colors"
        >
          <Plus className="h-3 w-3" /> ADD.PRODUCT
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="border border-white/10 p-4 space-y-2">
            <Icon className={`h-4 w-4 ${accent}`} />
            {loading ? (
              <div className="h-6 bg-foreground/10 animate-pulse w-2/3" />
            ) : (
              <p className={`text-xl font-bold ${accent}`}>{value}</p>
            )}
            <p className="text-[8px] tracking-widest text-foreground/30">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick nav */}
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <Link
          href="/admin/products"
          className="flex items-center justify-between border border-white/10 hover:border-white/30 transition-colors p-4 group"
        >
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 text-foreground/30" />
            <div>
              <p className="text-[10px] tracking-widest text-foreground/60 group-hover:text-foreground transition-colors">MANAGE.PRODUCTS</p>
              <p className="text-[8px] text-foreground/25">ADD.EDIT.DELETE.PRODUCTS</p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-foreground/20 group-hover:text-foreground/60 transition-colors" />
        </Link>
        <Link
          href="/admin/orders"
          className="flex items-center justify-between border border-white/10 hover:border-white/30 transition-colors p-4 group"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-4 w-4 text-foreground/30" />
            <div>
              <p className="text-[10px] tracking-widest text-foreground/60 group-hover:text-foreground transition-colors">MANAGE.ORDERS</p>
              <p className="text-[8px] text-foreground/25">TRACK.AND.MANAGE.ORDERS</p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-foreground/20 group-hover:text-foreground/60 transition-colors" />
        </Link>
      </div>

      {/* Recent orders */}
      <div className="border border-white/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-foreground/30" />
            <p className="text-[9px] tracking-widest text-foreground/40">// RECENT.ORDERS</p>
          </div>
          <Link href="/admin/orders" className="flex items-center gap-1 text-[9px] tracking-widest text-foreground/30 hover:text-foreground transition-colors">
            VIEW.ALL <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-4 space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-foreground/5 border border-white/5" />)}
          </div>
        ) : !stats?.recentOrders.length ? (
          <p className="text-[10px] tracking-widest text-foreground/25 text-center py-8">NO.ORDERS.YET</p>
        ) : (
          <div className="divide-y divide-white/5">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-foreground/3 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-foreground/60 uppercase truncate">
                    {order.user.name ?? order.user.email}
                  </p>
                  <p className="text-[8px] text-foreground/25 truncate">
                    #{order.id.slice(0, 8).toUpperCase()} · {(order.items as unknown[]).length} ITEMS · {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[8px] tracking-widest border px-1.5 py-0.5 hidden sm:inline ${statusConfig[order.status] ?? "text-foreground/40 border-white/15"}`}>
                    {order.status.toUpperCase()}
                  </span>
                  <span className="text-green-400/70 text-xs font-mono">${order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
