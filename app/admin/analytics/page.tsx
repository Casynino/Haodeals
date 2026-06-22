"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package,
  AlertTriangle, CheckCircle2, Info, Zap, RefreshCw, ArrowLeft,
  BarChart2, PieChart, Activity, Star, AlertCircle,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"

/* ── Types ───────────────────────────────────────────────────────────────── */
interface Analytics {
  revenue:   { total: number; thisMonth: number; lastMonth: number; today: number; thisWeek: number; growthPct: number; daily: { date: string; amount: number }[] }
  orders:    { total: number; thisMonth: number; lastMonth: number; today: number; growthPct: number; byStatus: { status: string; count: number }[] }
  customers: { total: number; thisMonth: number; topSpenders: { id: string; name: string; email: string; totalSpent: number; orderCount: number }[] }
  products:  { total: number; outOfStock: number; lowStock: { id: string; name: string; stock: number; category: string }[]; topSelling: { id: string; name: string; category: string; sold: number; revenue: number }[] }
  categories: { name: string; revenue: number; pct: number }[]
  insights:  { type: string; text: string; action: string }[]
}

type Tab = "overview" | "products" | "customers" | "revenue"

/* ── Chart colour palette ────────────────────────────────────────────────── */
const CAT_COLORS = ["#a78bfa","#34d399","#f59e0b","#60a5fa","#fb7185","#22d3ee","#f97316"]

/* ── Sparkline ───────────────────────────────────────────────────────────── */
function Spark({ data, color = "#34d399" }: { data: number[]; color?: string }) {
  if (!data.length || data.every((v) => v === 0)) return <div className="w-16 h-6" />
  const max = Math.max(...data) || 1
  const min = Math.min(...data)
  const range = max - min || 1
  const W = 64, H = 24
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * W},${H - ((v - min) / range) * (H - 2) - 1}`).join(" ")
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Full line chart (30 days) ───────────────────────────────────────────── */
function LineChart({ data, color = "#34d399" }: { data: { date: string; amount: number }[]; color?: string }) {
  if (!data.length) return null
  const max = Math.max(...data.map((d) => d.amount)) || 1
  const W = 600, H = 110
  const pts = data.map((d, i) => `${(i / Math.max(data.length - 1, 1)) * W},${H - (d.amount / max) * (H - 10) - 2}`).join(" ")
  const area = `0,${H} ${pts} ${W},${H}`
  const nonZero = data.some((d) => d.amount > 0)

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(max * p))

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-foreground/25 pr-1 pointer-events-none">
        {ticks.reverse().map((t, i) => <span key={i}>{t > 0 ? formatPrice(t).replace("TSh ", "") : "0"}</span>)}
      </div>
      <div className="pl-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 110 }}>
          <defs>
            <linearGradient id="lg-main" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line key={i} x1="0" y1={H - p * (H - 10) - 2} x2={W} y2={H - p * (H - 10) - 2}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          {nonZero && (
            <>
              <polygon points={area} fill="url(#lg-main)" />
              <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {!nonZero && (
            <text x={W/2} y={H/2} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="12" fontFamily="monospace">No data yet</text>
          )}
        </svg>
        {/* X-axis labels */}
        <div className="flex justify-between text-[10px] text-foreground/22 mt-1">
          {[data[0], data[Math.floor(data.length / 4)], data[Math.floor(data.length / 2)], data[Math.floor(data.length * 3 / 4)], data[data.length - 1]]
            .filter(Boolean).map((d, i) => <span key={i}>{d.date.slice(5)}</span>)}
        </div>
      </div>
    </div>
  )
}

/* ── Donut chart ─────────────────────────────────────────────────────────── */
function Donut({ segments }: { segments: { name: string; pct: number; color: string }[] }) {
  const r = 38, circ = 2 * Math.PI * r
  let offset = circ / 4
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 flex-shrink-0 -rotate-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="13" />
      {segments.filter((s) => s.pct > 0).map((s, i) => {
        const dash = (s.pct / 100) * circ
        const el = <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={s.color}
          strokeWidth="13" strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={-offset} strokeOpacity="0.88" />
        offset += dash
        return el
      })}
    </svg>
  )
}

/* ── KPI card ────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, growth, icon: Icon, color, spark }: {
  label: string; value: string; sub?: string; growth?: number
  icon: React.ElementType; color: string; spark?: number[]
}) {
  const up = (growth ?? 0) >= 0
  return (
    <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.025] p-5 space-y-3 hover:border-foreground/15 transition-all">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        {spark && <Spark data={spark} color={growth && growth >= 0 ? "#34d399" : "#fb7185"} />}
      </div>
      <div>
        <p className="text-[12px] text-foreground/38 tracking-widest uppercase">{label}</p>
        <p className="text-2xl font-black text-foreground/90 tracking-tight mt-0.5">{value}</p>
        {sub && <p className="text-[12px] text-foreground/35 mt-0.5">{sub}</p>}
      </div>
      {growth !== undefined && (
        <div className={`flex items-center gap-1 text-[12px] font-semibold ${up ? "text-emerald-400" : "text-rose-400"}`}>
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {up ? "+" : ""}{growth}% vs last month
        </div>
      )}
    </div>
  )
}

/* ── Insight card ────────────────────────────────────────────────────────── */
const insightConfig = {
  success: { icon: CheckCircle2, cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  warning: { icon: AlertTriangle, cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  danger:  { icon: AlertCircle,  cls: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  info:    { icon: Info,         cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
}

/* ────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────────────────────────────────────── */
export default function AdminAnalytics() {
  const [data,        setData]        = useState<Analytics | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<Tab>("overview")
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" })
      if (res.ok) { setData(await res.json()); setLastRefresh(new Date()) }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const sparkRevenue = data?.revenue.daily.map((d) => d.amount) ?? []
  const topCatMax    = data?.categories[0]?.revenue ?? 1
  const topSellMax   = data?.products.topSelling[0]?.sold ?? 1

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview",  label: "Overview",  icon: Activity  },
    { id: "products",  label: "Products",  icon: Package   },
    { id: "customers", label: "Customers", icon: Users     },
    { id: "revenue",   label: "Revenue",   icon: BarChart2 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-foreground/30 hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-[0.15em] text-foreground/90">ANALYTICS</h1>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400/80 rounded-full animate-pulse" />
                  <span className="text-[11px] text-emerald-400/70">Live</span>
                </div>
              </div>
              {lastRefresh && (
                <p className="text-[10px] text-foreground/22 mt-0.5">
                  Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              )}
            </div>
          </div>
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-foreground/12 text-[11px] tracking-widest text-foreground/40 hover:text-foreground/70 hover:border-foreground/22 transition-all active:scale-95 disabled:opacity-40">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> REFRESH
          </button>
        </div>

        {/* ── Tab nav ── */}
        <div className="flex gap-1 border-b border-foreground/8 pb-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[12px] tracking-widest border-b-2 transition-all
                ${tab === id ? "border-violet-500 text-violet-400" : "border-transparent text-foreground/38 hover:text-foreground/60"}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* ════════════ OVERVIEW TAB ════════════ */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard label="Total Revenue" value={formatPrice(data?.revenue.total ?? 0)}
                sub={`Today: ${formatPrice(data?.revenue.today ?? 0)}`}
                growth={data?.revenue.growthPct} icon={DollarSign}
                color="bg-emerald-500/15 text-emerald-400" spark={sparkRevenue} />
              <KpiCard label="Total Orders" value={String(data?.orders.total ?? "—")}
                sub={`Today: ${data?.orders.today ?? 0} orders`}
                growth={data?.orders.growthPct} icon={ShoppingBag}
                color="bg-blue-500/15 text-blue-400"
                spark={data?.orders.byStatus.map((s) => s.count) ?? []} />
              <KpiCard label="Customers" value={String(data?.customers.total ?? "—")}
                sub={`+${data?.customers.thisMonth ?? 0} new this month`}
                icon={Users} color="bg-violet-500/15 text-violet-400" />
              <KpiCard label="Products" value={String(data?.products.total ?? "—")}
                sub={`${data?.products.outOfStock ?? 0} out of stock`}
                icon={Package} color="bg-amber-500/15 text-amber-400" />
            </div>

            {/* Revenue chart + category donut */}
            <div className="grid lg:grid-cols-3 gap-4">
              {/* 30-day revenue chart */}
              <div className="lg:col-span-2 rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] tracking-widest text-foreground/35 uppercase">Revenue Trend</p>
                    <p className="text-sm font-semibold text-foreground/75 mt-0.5">Last 30 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-foreground/30">This month</p>
                    <p className="text-base font-bold text-emerald-400">{formatPrice(data?.revenue.thisMonth ?? 0)}</p>
                  </div>
                </div>
                {loading
                  ? <div className="h-28 bg-foreground/4 animate-pulse rounded-xl" />
                  : <LineChart data={data?.revenue.daily ?? []} />
                }
              </div>

              {/* Category donut */}
              <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-5">
                <p className="text-[11px] tracking-widest text-foreground/35 uppercase mb-4">By Category</p>
                {loading ? (
                  <div className="flex items-center justify-center h-28"><div className="w-28 h-28 bg-foreground/4 animate-pulse rounded-full" /></div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Donut segments={(data?.categories ?? []).map((c, i) => ({ name: c.name, pct: c.pct, color: CAT_COLORS[i % CAT_COLORS.length] }))} />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {(data?.categories ?? []).slice(0, 5).map((c, i) => (
                        <div key={c.name} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                          <span className="text-[11px] text-foreground/55 truncate flex-1">{c.name}</span>
                          <span className="text-[11px] text-foreground/45 flex-shrink-0">{c.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top products + Order status */}
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Top selling */}
              <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-3.5 w-3.5 text-amber-400" />
                  <p className="text-[11px] tracking-widest text-foreground/35 uppercase">Top Selling Products</p>
                </div>
                <div className="space-y-3">
                  {(data?.products.topSelling ?? []).slice(0, 5).map((p, i) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[12px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-foreground/28 w-4 flex-shrink-0">{i + 1}</span>
                          <span className="text-foreground/70 truncate">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-foreground/35">{p.sold} sold</span>
                          <span className="text-emerald-400">{formatPrice(p.revenue)}</span>
                        </div>
                      </div>
                      <div className="h-1 bg-foreground/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                          style={{ width: `${topSellMax ? (p.sold / topSellMax) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                  {!(data?.products.topSelling?.length) && !loading && (
                    <p className="text-[11px] text-foreground/25 text-center py-4">No sales data yet</p>
                  )}
                </div>
              </div>

              {/* Order status breakdown */}
              <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag className="h-3.5 w-3.5 text-blue-400" />
                  <p className="text-[11px] tracking-widest text-foreground/35 uppercase">Order Status</p>
                </div>
                <div className="space-y-2.5">
                  {(data?.orders.byStatus ?? []).map((s) => {
                    const total = (data?.orders.byStatus ?? []).reduce((sum, x) => sum + x.count, 0) || 1
                    const pct = Math.round((s.count / total) * 100)
                    const color = {
                      payment_confirmed: "bg-blue-500", packaging: "bg-amber-500",
                      in_transit: "bg-violet-500", delivered: "bg-emerald-500",
                      cancelled: "bg-rose-500",
                    }[s.status] ?? "bg-foreground/30"
                    return (
                      <div key={s.status} className="space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-foreground/50 uppercase tracking-wide">{s.status.replace(/_/g, " ")}</span>
                          <span className=" text-foreground/45">{s.count} · {pct}%</span>
                        </div>
                        <div className="h-1 bg-foreground/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Insights / Recommended Actions */}
            <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-3.5 w-3.5 text-yellow-400" />
                <p className="text-[11px] tracking-widest text-foreground/35 uppercase">Recommended Actions & Insights</p>
              </div>
              {loading ? (
                <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 bg-foreground/4 animate-pulse rounded-xl" />)}</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2">
                  {(data?.insights ?? []).map((ins, i) => {
                    const cfg = insightConfig[ins.type as keyof typeof insightConfig] ?? insightConfig.info
                    const Icon = cfg.icon
                    return (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.cls}`}>
                        <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[12px] text-foreground/75 leading-snug">{ins.text}</p>
                          <p className="text-[11px] opacity-60 mt-0.5">→ {ins.action}</p>
                        </div>
                      </div>
                    )
                  })}
                  {!data?.insights.length && <p className="text-[11px] text-foreground/25 col-span-2 text-center py-4">No insights available yet</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════ PRODUCTS TAB ════════════ */}
        {tab === "products" && (
          <div className="space-y-5">
            {/* Stock alerts */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                  <p className="text-[11px] tracking-widest text-rose-400/60 uppercase">Out of Stock</p>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-[11px] font-bold">{data?.products.outOfStock ?? 0}</span>
                </div>
                {(data?.products.outOfStock ?? 0) === 0
                  ? <p className="text-[11px] text-foreground/25 text-center py-4">✓ All products have stock</p>
                  : <p className="text-[11px] text-rose-400/60">{data?.products.outOfStock} products need urgent restocking</p>
                }
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  <p className="text-[11px] tracking-widest text-amber-400/60 uppercase">Low Stock (≤10)</p>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-bold">{data?.products.lowStock?.length ?? 0}</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(data?.products.lowStock ?? []).map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-[12px] text-foreground/65 truncate">{p.name}</p>
                        <p className="text-[10px] text-foreground/28">{p.category}</p>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2
                        ${p.stock <= 3 ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400"}`}>
                        {p.stock} left
                      </span>
                    </div>
                  ))}
                  {!data?.products.lowStock?.length && <p className="text-[11px] text-foreground/25 text-center py-2">All products well stocked ✓</p>}
                </div>
              </div>
            </div>

            {/* Top selling full list */}
            <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                <p className="text-[11px] tracking-widest text-foreground/35 uppercase">Top Selling Products</p>
              </div>
              <div className="space-y-4">
                {(data?.products.topSelling ?? []).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-4">
                    <span className="text-lg font-black text-foreground/15 w-6 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-foreground/75 truncate">{p.name}</p>
                          <p className="text-[10px] text-foreground/28">{p.category}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-[12px] font-bold text-emerald-400">{formatPrice(p.revenue)}</p>
                          <p className="text-[10px] text-foreground/30">{p.sold} units</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${topSellMax ? (p.sold / topSellMax) * 100 : 0}%`, background: `${CAT_COLORS[i % CAT_COLORS.length]}cc` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {!data?.products.topSelling?.length && !loading && (
                  <p className="text-[11px] text-foreground/25 text-center py-8">No product sales data yet</p>
                )}
              </div>
            </div>

            {/* Category performance */}
            <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-5">
              <div className="flex items-center gap-2 mb-5">
                <PieChart className="h-3.5 w-3.5 text-violet-400" />
                <p className="text-[11px] tracking-widest text-foreground/35 uppercase">Category Performance</p>
              </div>
              <div className="space-y-3">
                {(data?.categories ?? []).map((c, i) => (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-[12px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                        <span className="text-foreground/65">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400">{formatPrice(c.revenue)}</span>
                        <span className="text-foreground/35 w-8 text-right">{c.pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: CAT_COLORS[i % CAT_COLORS.length] + "aa" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════ CUSTOMERS TAB ════════════ */}
        {tab === "customers" && (
          <div className="space-y-5">
            {/* Customer KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-4 text-center">
                <p className="text-[11px] tracking-widest text-foreground/30 uppercase mb-1">Total</p>
                <p className="text-2xl font-black text-foreground/85">{data?.customers.total ?? "—"}</p>
                <p className="text-[11px] text-foreground/30 mt-0.5">registered customers</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4 text-center">
                <p className="text-[11px] tracking-widest text-emerald-400/55 uppercase mb-1">New This Month</p>
                <p className="text-2xl font-black text-emerald-400">+{data?.customers.thisMonth ?? 0}</p>
                <p className="text-[11px] text-foreground/30 mt-0.5">new sign-ups</p>
              </div>
              <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.03] p-4 text-center col-span-2 lg:col-span-1">
                <p className="text-[11px] tracking-widest text-violet-400/55 uppercase mb-1">Avg Spend / Customer</p>
                <p className="text-2xl font-black text-violet-400">
                  {data?.customers.topSpenders.length
                    ? formatPrice(data.customers.topSpenders.reduce((s, c) => s + c.totalSpent, 0) / data.customers.topSpenders.length)
                    : "—"}
                </p>
                <p className="text-[11px] text-foreground/30 mt-0.5">based on top spenders</p>
              </div>
            </div>

            {/* Top customers */}
            <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-5">
              <div className="flex items-center gap-2 mb-5">
                <Users className="h-3.5 w-3.5 text-violet-400" />
                <p className="text-[11px] tracking-widest text-foreground/35 uppercase">Top Customers by Spending</p>
              </div>
              <div className="space-y-3">
                {(data?.customers.topSpenders ?? []).map((c, i) => {
                  const maxSpend = data?.customers.topSpenders[0]?.totalSpent ?? 1
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-foreground/6 hover:border-foreground/12 transition-all">
                      <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center flex-shrink-0 text-[12px] font-black text-violet-400">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-foreground/75 truncate">{c.name || "—"}</p>
                            <p className="text-[10px] text-foreground/30 truncate">{c.email}</p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-[13px] font-bold text-emerald-400">{formatPrice(c.totalSpent)}</p>
                            <p className="text-[10px] text-foreground/25">{c.orderCount} orders</p>
                          </div>
                        </div>
                        <div className="h-1 bg-foreground/5 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${(c.totalSpent / maxSpend) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
                {!data?.customers.topSpenders?.length && (
                  <p className="text-[11px] text-foreground/25 text-center py-8">No customer spending data yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════ REVENUE TAB ════════════ */}
        {tab === "revenue" && (
          <div className="space-y-5">
            {/* Revenue period cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Today",      val: data?.revenue.today ?? 0,     color: "text-foreground/70" },
                { label: "This Week",  val: data?.revenue.thisWeek ?? 0,   color: "text-blue-400"     },
                { label: "This Month", val: data?.revenue.thisMonth ?? 0,  color: "text-emerald-400"  },
                { label: "All Time",   val: data?.revenue.total ?? 0,      color: "text-violet-400"   },
              ].map(({ label, val, color }) => (
                <div key={label} className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-4">
                  <p className="text-[11px] tracking-widest text-foreground/30 uppercase mb-2">{label}</p>
                  <p className={`text-xl font-black ${color}`}>{formatPrice(val)}</p>
                </div>
              ))}
            </div>

            {/* Month vs last month */}
            <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-5">
              <p className="text-[11px] tracking-widest text-foreground/35 uppercase mb-5">This Month vs Last Month</p>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {[
                    { label: "This Month Revenue", val: data?.revenue.thisMonth ?? 0, color: "bg-emerald-500" },
                    { label: "Last Month Revenue", val: data?.revenue.lastMonth ?? 0, color: "bg-foreground/20" },
                  ].map(({ label, val, color }) => {
                    const max = Math.max(data?.revenue.thisMonth ?? 0, data?.revenue.lastMonth ?? 0) || 1
                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-foreground/50">{label}</span>
                          <span className=" text-foreground/65">{formatPrice(val)}</span>
                        </div>
                        <div className="h-3 bg-foreground/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${(val / max) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  {data?.revenue.growthPct !== undefined && (
                    <div className={`flex items-center gap-2 text-sm font-bold mt-2 ${(data.revenue.growthPct ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {(data.revenue.growthPct ?? 0) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {data.revenue.growthPct >= 0 ? "+" : ""}{data.revenue.growthPct}% growth
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {[
                    { label: "This Month Orders", val: data?.orders.thisMonth ?? 0, color: "bg-blue-500" },
                    { label: "Last Month Orders", val: data?.orders.lastMonth ?? 0, color: "bg-foreground/20" },
                  ].map(({ label, val, color }) => {
                    const max = Math.max(data?.orders.thisMonth ?? 0, data?.orders.lastMonth ?? 0) || 1
                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-foreground/50">{label}</span>
                          <span className=" text-foreground/65">{val} orders</span>
                        </div>
                        <div className="h-3 bg-foreground/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${(val / max) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  {data?.orders.growthPct !== undefined && (
                    <div className={`flex items-center gap-2 text-sm font-bold mt-2 ${(data.orders.growthPct ?? 0) >= 0 ? "text-blue-400" : "text-rose-400"}`}>
                      {(data.orders.growthPct ?? 0) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {data.orders.growthPct >= 0 ? "+" : ""}{data.orders.growthPct}% order growth
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 30-day revenue chart (big) */}
            <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-5">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[11px] tracking-widest text-foreground/35 uppercase">Daily Revenue — Last 30 Days</p>
                <p className="text-[11px] text-emerald-400">{formatPrice(data?.revenue.thisMonth ?? 0)} this month</p>
              </div>
              {loading
                ? <div className="h-36 bg-foreground/4 animate-pulse rounded-xl" />
                : <LineChart data={data?.revenue.daily ?? []} color="#34d399" />
              }
            </div>

            {/* Category revenue */}
            <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-5">
              <p className="text-[11px] tracking-widest text-foreground/35 uppercase mb-5">Revenue by Category</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {(data?.categories ?? []).map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl border border-foreground/6">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-foreground/65 truncate">{c.name}</p>
                      <p className="text-[11px] text-foreground/30">{c.pct}% of total</p>
                    </div>
                    <p className="text-[13px] font-bold text-emerald-400 flex-shrink-0">{formatPrice(c.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
