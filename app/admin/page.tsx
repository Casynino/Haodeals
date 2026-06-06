"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { ShoppingBag, Users, Package, DollarSign, ArrowRight, TrendingUp, Plus, Megaphone, Loader2, CheckCircle2, MessageSquare, Banknote, RefreshCw, BarChart2 } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

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
  recentPayments: Array<{
    id: string
    total: number
    status: string
    trackingId: string | null
    createdAt: string
    user: { name?: string; email: string }
    items: Array<{ product: { name: string } }>
  }>
}

interface ConversationSummary {
  adminUnread: number
}

const statusConfig: Record<string, string> = {
  pending:           "text-yellow-400/70 border-yellow-400/30",
  confirmed:         "text-blue-400/70 border-blue-400/30",
  payment_confirmed: "text-blue-400/70 border-blue-400/30",
  shipped:           "text-purple-400/70 border-purple-400/30",
  delivered:         "text-green-400/70 border-green-400/30",
  processing:        "text-cyan-400/70 border-cyan-400/30",
  cancelled:         "text-red-400/70 border-red-400/30",
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [msgUnread, setMsgUnread] = useState(0)
  const [announce, setAnnounce] = useState({ subject: "", message: "", link: "" })
  const [sending, setSending] = useState(false)
  const [sentResult, setSentResult] = useState<{ sent: number; total: number } | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await fetch("/api/admin/stats", { cache: "no-store" }).then((r) => r.json())
      setStats(data)
      setLastRefresh(new Date())
    } catch { /* ignore */ } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial load
    fetchStats()

    // Unread messages
    fetch("/api/admin/messages")
      .then((r) => r.ok ? r.json() : null)
      .then((data: ConversationSummary[] | null) => {
        if (Array.isArray(data)) {
          const total = data.reduce((sum, c) => sum + (c.adminUnread ?? 0), 0)
          setMsgUnread(total)
        }
      })
      .catch(() => {})

    // Auto-refresh every 30 s so admin always sees fresh payments
    pollRef.current = setInterval(() => fetchStats(true), 30_000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchStats])

  async function handleAnnounce(e: React.FormEvent) {
    e.preventDefault()
    if (!announce.subject.trim() || !announce.message.trim()) return
    setSending(true)
    setSentResult(null)
    const res = await fetch("/api/admin/announce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(announce),
    })
    const data = await res.json()
    if (res.ok) {
      setSentResult({ sent: data.sent, total: data.total })
      setAnnounce({ subject: "", message: "", link: "" })
      toast.success(`SENT TO ${data.sent} USERS`, { className: "font-mono text-xs" })
    } else {
      toast.error(data.error ?? "SEND FAILED", { className: "font-mono text-xs" })
    }
    setSending(false)
  }

  const statCards = [
    { label: "TOTAL.REVENUE", value: stats ? formatPrice(stats.totalRevenue) : "—", icon: DollarSign, accent: "text-green-400/70" },
    { label: "TOTAL.ORDERS",  value: stats?.totalOrders ?? "—",   icon: ShoppingBag, accent: "text-blue-400/70" },
    { label: "TOTAL.USERS",   value: stats?.totalUsers ?? "—",    icon: Users,       accent: "text-purple-400/70" },
    { label: "PRODUCTS",      value: stats?.totalProducts ?? "—", icon: Package,     accent: "text-foreground/60" },
  ]

  return (
    <div className="container mx-auto px-4 py-8 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/45 text-xs">//</span>
          <h1 className="text-lg font-semibold tracking-[0.2em] text-foreground/90">ADMIN DASHBOARD</h1>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-1.5 h-1.5 bg-green-400/75 rounded-full animate-pulse" />
            <span className="text-[10px] text-green-400/75">Live</span>
          </div>
          {lastRefresh && (
            <span className="text-[9px] text-foreground/25 hidden sm:inline">
              · updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStats()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-white/15 text-[9px] tracking-widest text-foreground/40 hover:text-foreground/70 hover:border-white/30 transition-colors"
            title="Refresh now"
          >
            <RefreshCw className="h-3 w-3" /> REFRESH
          </button>
          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-white/20 text-[9px] tracking-widest text-foreground/50 hover:text-foreground hover:border-white/40 transition-colors"
          >
            <Plus className="h-3 w-3" /> ADD.PRODUCT
          </Link>
        </div>
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
            <p className="text-[10px] tracking-widest text-foreground/55">{label}</p>
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
              <p className="text-xs tracking-widest text-foreground/70 group-hover:text-foreground transition-colors">MANAGE PRODUCTS</p>
              <p className="text-[10px] text-foreground/45 mt-0.5">Add, edit, delete products</p>
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
              <p className="text-xs tracking-widest text-foreground/70 group-hover:text-foreground transition-colors">MANAGE ORDERS</p>
              <p className="text-[10px] text-foreground/45 mt-0.5">Track and manage orders</p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-foreground/20 group-hover:text-foreground/60 transition-colors" />
        </Link>
        <Link
          href="/admin/analytics"
          className="flex items-center justify-between border border-violet-500/20 bg-violet-500/[0.03] hover:border-violet-500/40 hover:bg-violet-500/[0.06] transition-colors p-4 group md:col-span-2"
        >
          <div className="flex items-center gap-3">
            <BarChart2 className="h-4 w-4 text-violet-400/60 group-hover:text-violet-400 transition-colors" />
            <div>
              <p className="text-xs tracking-widest text-foreground/70 group-hover:text-foreground transition-colors">ANALYTICS DASHBOARD</p>
              <p className="text-[10px] text-foreground/45 mt-0.5">Revenue, customers, products & business intelligence</p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-foreground/20 group-hover:text-violet-400/60 transition-colors" />
        </Link>
        <Link
          href="/admin/messages"
          className="flex items-center justify-between border border-white/10 hover:border-white/30 transition-colors p-4 group md:col-span-2"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-foreground/30" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs tracking-widest text-foreground/70 group-hover:text-foreground transition-colors">MANAGE MESSAGES</p>
                {msgUnread > 0 && (
                  <span className="px-1.5 py-0.5 bg-yellow-400/90 text-black text-[9px] font-bold tracking-widest">
                    {msgUnread} UNREAD
                  </span>
                )}
              </div>
              <p className="text-[10px] text-foreground/45 mt-0.5">Customer support conversations</p>
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
                  <p className="text-xs text-foreground/75 uppercase truncate">
                    {order.user.name ?? order.user.email}
                  </p>
                  <p className="text-[10px] text-foreground/45 truncate mt-0.5">
                    #{order.id.slice(0, 8).toUpperCase()} · {(order.items as unknown[]).length} items · {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] tracking-wide border px-2 py-0.5 hidden sm:inline ${statusConfig[order.status] ?? "text-foreground/55 border-white/20"}`}>
                    {order.status.toUpperCase()}
                  </span>
                  <span className="text-green-400/70 text-xs font-mono">{formatPrice(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Treasury inflow — all confirmed payments from customers */}
      <div className="mt-6 border border-white/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Banknote className="h-3.5 w-3.5 text-green-400/50" />
            <p className="text-[9px] tracking-widest text-foreground/40">// TREASURY.INFLOW</p>
            <span className="text-[8px] text-green-400/40 ml-1">PAYMENTS RECEIVED</span>
          </div>
          <Link href="/admin/orders" className="flex items-center gap-1 text-[9px] tracking-widest text-foreground/30 hover:text-foreground transition-colors">
            VIEW.ALL <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-4 space-y-2 animate-pulse">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-foreground/5 border border-white/5" />)}
          </div>
        ) : !stats?.recentPayments?.length ? (
          <p className="text-[10px] tracking-widest text-foreground/25 text-center py-8">NO.PAYMENTS.YET</p>
        ) : (
          <div className="divide-y divide-white/5">
            {stats.recentPayments.map((payment) => {
              const productName = payment.items[0]?.product?.name ?? "Order"
              const ref = payment.trackingId ?? payment.id.slice(-8).toUpperCase()
              const dateStr = new Date(payment.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
              })
              const timeStr = new Date(payment.createdAt).toLocaleTimeString("en-GB", {
                hour: "2-digit", minute: "2-digit",
              })
              return (
                <div key={payment.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-foreground/3 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground/75 uppercase truncate">
                      {payment.user.name ?? payment.user.email}
                    </p>
                    <p className="text-[10px] text-foreground/40 truncate mt-0.5">
                      #{ref} · {productName}{payment.items.length > 1 ? ` +${payment.items.length - 1} more` : ""}
                    </p>
                    <p className="text-[9px] text-foreground/28 mt-0.5">{dateStr} {timeStr}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] tracking-wide border px-2 py-0.5 hidden sm:inline ${statusConfig[payment.status] ?? "text-foreground/55 border-white/20"}`}>
                      {payment.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className="text-green-400/80 text-xs font-mono font-semibold">+{formatPrice(payment.total)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Announce Deal */}
      <div className="mt-6 border border-white/10">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <Megaphone className="h-3.5 w-3.5 text-yellow-400/60" />
          <p className="text-[9px] tracking-widest text-foreground/40">// ANNOUNCE.DEAL</p>
          <span className="ml-auto text-[8px] text-foreground/20">SENDS EMAIL TO ALL {stats?.totalUsers ?? "—"} USERS</span>
        </div>
        <form onSubmit={handleAnnounce} className="p-4 space-y-3">
          <div>
            <label className="text-[10px] tracking-widest text-foreground/55 block mb-1.5">SUBJECT</label>
            <input
              type="text"
              value={announce.subject}
              onChange={(e) => setAnnounce({ ...announce, subject: e.target.value })}
              placeholder="🔥 New deals just dropped..."
              required
              className="w-full bg-transparent border border-white/15 px-3 py-2 text-[10px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-widest text-foreground/55 block mb-1.5">MESSAGE</label>
            <textarea
              value={announce.message}
              onChange={(e) => setAnnounce({ ...announce, message: e.target.value })}
              placeholder="Hey! We just added new deals you don't want to miss..."
              required
              rows={3}
              className="w-full bg-transparent border border-white/15 px-3 py-2 text-[10px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-widest text-foreground/55 block mb-1.5">LINK <span className="text-foreground/35">(optional — e.g. /products)</span></label>
            <input
              type="text"
              value={announce.link}
              onChange={(e) => setAnnounce({ ...announce, link: e.target.value })}
              placeholder="/products?category=electronics"
              className="w-full bg-transparent border border-white/15 px-3 py-2 text-[10px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2 bg-yellow-400/90 text-black text-[9px] tracking-widest font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {sending
                ? <><Loader2 className="h-3 w-3 animate-spin" /> SENDING...</>
                : <><Megaphone className="h-3 w-3" /> SEND.TO.ALL.USERS</>}
            </button>
            {sentResult && (
              <span className="flex items-center gap-1.5 text-[9px] text-green-400/70">
                <CheckCircle2 className="h-3 w-3" />
                SENT TO {sentResult.sent}/{sentResult.total} USERS
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
