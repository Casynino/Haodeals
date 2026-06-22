"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import {
  DollarSign, ShoppingBag, Users, Package, TrendingUp, TrendingDown,
  AlertTriangle, AlertCircle, CheckCircle2, Info, Zap, RefreshCw,
  Plus, Megaphone, Loader2, ChevronRight, Star, Activity,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Analytics {
  revenue:   { total: number; thisMonth: number; lastMonth: number; today: number; growthPct: number; daily: { date: string; amount: number }[] }
  orders:    { total: number; thisMonth: number; today: number; growthPct: number; byStatus: { status: string; count: number }[] }
  customers: { total: number; thisMonth: number; topSpenders: { name: string; email: string; totalSpent: number; orderCount: number }[] }
  products:  { total: number; outOfStock: number; lowStock: { id: string; name: string; stock: number; category: string }[]; topSelling: { id: string; name: string; category: string; sold: number; revenue: number }[] }
  categories: { name: string; revenue: number; pct: number }[]
  insights:  { type: string; text: string; action: string }[]
}
interface RecentOrder { id: string; total: number; status: string; createdAt: string; trackingId: string | null; user: { name?: string; email: string }; items: unknown[] }

/* ── Mini sparkline ─────────────────────────────────────────────────────── */
function Spark({ data, color = "#34d399" }: { data: number[]; color?: string }) {
  if (!data.length || data.every((v) => v === 0)) return <div className="w-14 h-5 opacity-0" />
  const max = Math.max(...data) || 1; const min = Math.min(...data)
  const range = max - min || 1; const W = 56, H = 20
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * W},${H - ((v - min) / range) * (H - 2) - 1}`).join(" ")
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Revenue line chart ─────────────────────────────────────────────────── */
function LineChart({ data, color = "#34d399" }: { data: { date: string; amount: number }[]; color?: string }) {
  if (!data.length) return null
  const max = Math.max(...data.map((d) => d.amount)) || 1; const W = 600, H = 90
  const pts = data.map((d, i) => `${(i / Math.max(data.length - 1, 1)) * W},${H - (d.amount / max) * (H - 8) - 2}`).join(" ")
  const hasData = data.some((d) => d.amount > 0)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 90 }}>
      <defs>
        <linearGradient id="dash-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 0.33, 0.66, 1].map((p, i) => (
        <line key={i} x1="0" y1={H - p * (H - 8) - 2} x2={W} y2={H - p * (H - 8) - 2} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {hasData && <>
        <polygon points={`0,${H} ${pts} ${W},${H}`} fill="url(#dash-grad)" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>}
      {!hasData && <text x={W / 2} y={H / 2} textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="11" fontFamily="monospace">No revenue data yet</text>}
    </svg>
  )
}

/* ── Insight badge ─────────────────────────────────────────────────────── */
const insightCfg = {
  success: { cls: "text-emerald-400 bg-emerald-500/8 border-emerald-500/18", Icon: CheckCircle2 },
  warning: { cls: "text-amber-400 bg-amber-500/8 border-amber-500/18",       Icon: AlertTriangle },
  danger:  { cls: "text-rose-400 bg-rose-500/8 border-rose-500/18",          Icon: AlertCircle },
  info:    { cls: "text-blue-400 bg-blue-500/8 border-blue-500/18",          Icon: Info },
}

const STATUS_COLOR: Record<string, string> = {
  payment_confirmed: "text-blue-400 border-blue-400/25", packaging: "text-amber-400 border-amber-400/25",
  in_transit: "text-purple-400 border-purple-400/25", delivered: "text-emerald-400 border-emerald-400/25",
  cancelled: "text-rose-400 border-rose-400/25",
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [analytics,    setAnalytics]    = useState<Analytics | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading,      setLoading]      = useState(true)
  const [lastRefresh,  setLastRefresh]  = useState<Date | null>(null)
  const [announce,     setAnnounce]     = useState({ subject: "", message: "", link: "" })
  const [sending,      setSending]      = useState(false)
  const [showAnnounce, setShowAnnounce] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [analyticsRes, statsRes] = await Promise.all([
        fetch("/api/admin/analytics", { cache: "no-store" }),
        fetch("/api/admin/stats",     { cache: "no-store" }),
      ])
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
      if (statsRes.ok) {
        const stats = await statsRes.json()
        setRecentOrders(stats.recentOrders ?? [])
      }
      setLastRefresh(new Date())
    } finally { if (!silent) setLoading(false) }
  }, [])

  useEffect(() => {
    fetchAll()
    pollRef.current = setInterval(() => fetchAll(true), 30_000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchAll])

  async function handleAnnounce(e: React.FormEvent) {
    e.preventDefault()
    if (!announce.subject.trim() || !announce.message.trim()) return
    setSending(true)
    const res = await fetch("/api/admin/announce", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(announce) })
    const data = await res.json()
    if (res.ok) { toast.success(`Sent to ${data.sent} users`); setAnnounce({ subject: "", message: "", link: "" }); setShowAnnounce(false) }
    else toast.error(data.error ?? "Failed")
    setSending(false)
  }

  const topSellMax = analytics?.products.topSelling[0]?.sold ?? 1
  const sparkRev   = analytics?.revenue.daily.map((d) => d.amount) ?? []

  /* ── KPI cards config ── */
  const kpis = [
    { label: "TOTAL REVENUE",  value: formatPrice(analytics?.revenue.total ?? 0),    sub: `Today: ${formatPrice(analytics?.revenue.today ?? 0)}`, growth: analytics?.revenue.growthPct, icon: DollarSign,  color: "bg-emerald-500/12 text-emerald-400",  accent: "text-emerald-400", spark: sparkRev },
    { label: "TOTAL ORDERS",   value: String(analytics?.orders.total ?? "—"),          sub: `Today: ${analytics?.orders.today ?? 0} new`,           growth: analytics?.orders.growthPct,  icon: ShoppingBag, color: "bg-blue-500/12 text-blue-400",        accent: "text-blue-400",    spark: analytics?.orders.byStatus.map((s) => s.count) ?? [] },
    { label: "CUSTOMERS",      value: String(analytics?.customers.total ?? "—"),       sub: `+${analytics?.customers.thisMonth ?? 0} this month`,  growth: undefined,                    icon: Users,       color: "bg-violet-500/12 text-violet-400",    accent: "text-violet-400",  spark: [] },
    { label: "PRODUCTS",       value: String(analytics?.products.total ?? "—"),        sub: `${analytics?.products.outOfStock ?? 0} out of stock`, growth: undefined,                    icon: Package,     color: "bg-amber-500/12 text-amber-400",      accent: "text-amber-400",   spark: [] },
  ]

  return (
    <div className="px-4 lg:px-6 py-6 space-y-6 max-w-[1400px]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-[0.2em] text-foreground/85">DASHBOARD</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-400/80 rounded-full animate-pulse" />
              <span className="text-[10px] text-emerald-400/65 tracking-widest">Live</span>
            </div>
          </div>
          {lastRefresh && <p className="text-[10px] text-foreground/20 mt-0.5">Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAnnounce(!showAnnounce)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-yellow-400/20 text-[11px] tracking-widest text-yellow-400/60 hover:text-yellow-400 hover:border-yellow-400/40 transition-colors">
            <Megaphone className="h-3 w-3" /> ANNOUNCE
          </button>
          <button onClick={() => fetchAll()} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-white/12 text-[11px] tracking-widest text-foreground/40 hover:text-foreground/70 hover:border-white/22 transition-all disabled:opacity-40">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> REFRESH
          </button>
          <Link href="/admin/products"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-white/20 text-[11px] tracking-widest text-foreground/50 hover:text-foreground hover:border-white/40 transition-colors">
            <Plus className="h-3 w-3" /> ADD.PRODUCT
          </Link>
        </div>
      </div>

      {/* Announce panel */}
      {showAnnounce && (
        <div className="border border-yellow-400/15 bg-yellow-400/[0.025] p-4 rounded-2xl">
          <form onSubmit={handleAnnounce} className="grid sm:grid-cols-3 gap-3">
            <input value={announce.subject} onChange={(e) => setAnnounce({ ...announce, subject: e.target.value })} placeholder="Subject…" required
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-yellow-400/30" />
            <input value={announce.message} onChange={(e) => setAnnounce({ ...announce, message: e.target.value })} placeholder="Message…" required
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-yellow-400/30" />
            <button type="submit" disabled={sending}
              className="flex items-center justify-center gap-2 py-2 bg-yellow-400/80 text-black text-[11px] font-bold tracking-widest rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50">
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Megaphone className="h-3.5 w-3.5" /> SEND TO ALL</>}
            </button>
          </form>
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map(({ label, value, sub, growth, icon: Icon, color, accent, spark }) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 hover:border-white/14 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <Spark data={spark} color={growth !== undefined ? (growth >= 0 ? "#34d399" : "#fb7185") : "#a78bfa"} />
            </div>
            <p className="text-[11px] text-foreground/30 tracking-widest uppercase mb-0.5">{label}</p>
            {loading
              ? <div className="h-6 w-24 bg-white/6 animate-pulse rounded-lg mb-1" />
              : <p className="text-xl font-black text-foreground/88 tracking-tight">{value}</p>
            }
            {sub && <p className="text-[11px] text-foreground/30">{sub}</p>}
            {growth !== undefined && !loading && (
              <div className={`flex items-center gap-1 mt-2 text-[11px] font-semibold ${growth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {growth >= 0 ? "+" : ""}{growth}% vs last month
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Revenue chart + Category ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] tracking-widest text-foreground/30 uppercase">Revenue Trend</p>
              <p className="text-sm font-semibold text-foreground/70 mt-0.5">Last 30 days</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-foreground/25">This month</p>
              <p className="text-base font-bold text-emerald-400">{formatPrice(analytics?.revenue.thisMonth ?? 0)}</p>
            </div>
          </div>
          {loading
            ? <div className="h-24 bg-white/4 animate-pulse rounded-xl" />
            : <LineChart data={analytics?.revenue.daily ?? []} />
          }
        </div>

        {/* Category breakdown */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <p className="text-[11px] tracking-widest text-foreground/30 uppercase mb-4">Revenue by Category</p>
          <div className="space-y-2.5">
            {(analytics?.categories ?? []).slice(0, 5).map((c, i) => {
              const COLORS = ["#a78bfa","#34d399","#f59e0b","#60a5fa","#fb7185"]
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                      <span className="text-foreground/55 truncate max-w-[100px]">{c.name}</span>
                    </div>
                    <span className="text-foreground/40">{c.pct}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: COLORS[i] + "99" }} />
                  </div>
                </div>
              )
            })}
            {!analytics?.categories.length && !loading && <p className="text-[11px] text-foreground/22 text-center py-4">No sales data yet</p>}
          </div>
        </div>
      </div>

      {/* ── Top products + Low stock ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-[11px] tracking-widest text-foreground/30 uppercase">Top Selling Products</p>
            </div>
            <Link href="/admin/analytics" className="text-[10px] text-foreground/25 hover:text-foreground/55 transition-colors flex items-center gap-1">
              Full report <ChevronRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {(analytics?.products.topSelling ?? []).slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-foreground/18 text-xs w-4 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-foreground/65 truncate">{p.name}</span>
                    <span className="text-emerald-400 flex-shrink-0 ml-2">{formatPrice(p.revenue)}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${topSellMax ? (p.sold / topSellMax) * 100 : 0}%` }} />
                  </div>
                  <p className="text-[10px] text-foreground/25">{p.sold} sold · {p.category}</p>
                </div>
              </div>
            ))}
            {!analytics?.products.topSelling.length && !loading && <p className="text-[11px] text-foreground/22 text-center py-4">No sales data yet</p>}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="rounded-2xl border border-amber-500/18 bg-amber-500/[0.025] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-[11px] tracking-widest text-amber-400/55 uppercase">Stock Alerts</p>
            </div>
            <Link href="/admin/inventory" className="text-[10px] text-foreground/25 hover:text-foreground/55 transition-colors flex items-center gap-1">
              Manage <ChevronRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          {analytics?.products.outOfStock ? (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-500/8 border border-rose-500/15">
              <p className="text-[11px] text-rose-400">{analytics.products.outOfStock} product{analytics.products.outOfStock > 1 ? "s" : ""} OUT OF STOCK — losing sales!</p>
            </div>
          ) : null}
          <div className="space-y-2.5 max-h-44 overflow-y-auto">
            {(analytics?.products.lowStock ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[12px] text-foreground/65 truncate">{p.name}</p>
                  <p className="text-[10px] text-foreground/28">{p.category}</p>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2
                  ${p.stock <= 3 ? "bg-rose-500/12 text-rose-400" : "bg-amber-500/12 text-amber-400"}`}>
                  {p.stock} left
                </span>
              </div>
            ))}
            {!analytics?.products.lowStock.length && !loading && (
              <p className="text-[11px] text-foreground/22 text-center py-4">✓ All products well stocked</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent orders ── */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-foreground/30" />
            <p className="text-[11px] tracking-widest text-foreground/30 uppercase">Recent Orders</p>
          </div>
          <Link href="/admin/orders" className="flex items-center gap-1 text-[10px] tracking-widest text-foreground/25 hover:text-foreground/55 transition-colors">
            VIEW ALL <ChevronRight className="h-2.5 w-2.5" />
          </Link>
        </div>
        {loading
          ? <div className="p-4 space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 bg-white/4 animate-pulse rounded-xl" />)}</div>
          : recentOrders.length === 0
          ? <p className="text-[11px] text-foreground/22 text-center py-8">No orders yet</p>
          : (
            <div className="divide-y divide-white/[0.05]">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-foreground/70 uppercase tracking-wide truncate">{o.user.name ?? o.user.email}</p>
                    <p className="text-[10px] text-foreground/25">#{o.id.slice(0,8).toUpperCase()} · {(o.items as unknown[]).length} items · {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</p>
                  </div>
                  <span className={`text-[11px] border px-2 py-0.5 hidden sm:inline flex-shrink-0 ${STATUS_COLOR[o.status] ?? "text-foreground/40 border-white/12"}`}>
                    {o.status.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className="text-emerald-400/80 text-xs font-semibold flex-shrink-0">{formatPrice(o.total)}</span>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* ── Insights ── */}
      {(analytics?.insights ?? []).length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-3.5 w-3.5 text-yellow-400" />
            <p className="text-[11px] tracking-widest text-foreground/30 uppercase">Insights & Recommended Actions</p>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {analytics!.insights.map((ins, i) => {
              const cfg = insightCfg[ins.type as keyof typeof insightCfg] ?? insightCfg.info
              const Icon = cfg.Icon
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.cls}`}>
                  <Icon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[12px] text-foreground/72 leading-snug">{ins.text}</p>
                    <p className="text-[10px] opacity-55 mt-0.5">→ {ins.action}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="h-6" />
    </div>
  )
}
