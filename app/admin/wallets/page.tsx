"use client"

import { useEffect, useState } from "react"
import {
  Wallet, Search, X, ArrowDownToLine, ArrowUpFromLine,
  ShoppingBag, Landmark, AlertTriangle, CheckCircle2, Clock,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface WalletRow {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  createdAt: string
  balance: number
  deposited: number
  pendingDeposits: number
  withdrawn: number
  spent: number
  orderCount: number
  txCount: number
}

interface Totals {
  outstanding: number
  deposited: number
  withdrawn: number
  spent: number
  pending: number
}

interface ApiResponse {
  wallets: WalletRow[]
  totals: Totals
  treasuryBalance: number | null
  treasuryConfigured: boolean
}

export default function AdminWallets() {
  const [data,    setData]    = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState("")

  useEffect(() => {
    fetch("/api/admin/wallets")
      .then((r) => r.json())
      .then((d) => { setData(d?.wallets ? d : { wallets: [], totals: { outstanding: 0, deposited: 0, withdrawn: 0, spent: 0, pending: 0 }, treasuryBalance: null, treasuryConfigured: false }); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const wallets = data?.wallets ?? []
  const totals  = data?.totals ?? { outstanding: 0, deposited: 0, withdrawn: 0, spent: 0, pending: 0 }

  const filtered = wallets.filter((w) => {
    const q = search.toLowerCase()
    return !q || (w.name ?? "").toLowerCase().includes(q) || w.email.toLowerCase().includes(q)
  })

  const withBalance = wallets.filter((w) => w.balance > 0).length

  // Reconciliation gap: outstanding liability vs what treasury actually holds
  const treasury = data?.treasuryBalance ?? null
  const gap = treasury !== null ? totals.outstanding - treasury : null

  return (
    <div className="px-4 lg:px-6 py-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-violet-400/60" />
          <h1 className="text-base font-semibold tracking-[0.2em] text-foreground/85">WALLETS</h1>
        </div>
        <span className="text-[9px] font-mono text-foreground/30">{withBalance} with balance</span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Outstanding Balance", val: totals.outstanding, icon: Wallet,         color: "text-violet-400",  bg: "bg-violet-500/10",  hint: "Total owed to users" },
          { label: "Total Deposited",     val: totals.deposited,    icon: ArrowDownToLine, color: "text-emerald-400", bg: "bg-emerald-500/10", hint: "Confirmed top-ups" },
          { label: "Total Withdrawn",     val: totals.withdrawn,    icon: ArrowUpFromLine, color: "text-rose-400",    bg: "bg-rose-500/10",    hint: "Paid out" },
          { label: "Total Spent",         val: totals.spent,        icon: ShoppingBag,     color: "text-blue-400",    bg: "bg-blue-500/10",    hint: "On orders" },
        ].map(({ label, val, icon: Icon, color, bg, hint }) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-base font-black text-foreground/85 font-mono">{formatPrice(val)}</p>
            <p className="text-[8px] text-foreground/28 font-mono tracking-widest mt-0.5">{label.toUpperCase()}</p>
            <p className="text-[8px] text-foreground/20 mt-0.5">{hint}</p>
          </div>
        ))}
      </div>

      {/* Treasury reconciliation */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="h-3.5 w-3.5 text-amber-400/70" />
          <p className="text-[10px] tracking-[0.2em] text-foreground/55 font-mono">TREASURY RECONCILIATION</p>
        </div>
        {!data?.treasuryConfigured ? (
          <div className="flex items-center gap-2 text-[10px] text-amber-400/80">
            <AlertTriangle className="h-3.5 w-3.5" />
            NTZS_TREASURY_USER_ID is not configured — deposits and withdrawals will fail.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/8 bg-white/[0.015] p-3">
              <p className="text-[8px] text-foreground/30 font-mono tracking-widest">USER LIABILITY</p>
              <p className="text-sm font-black font-mono text-violet-400 mt-1">{formatPrice(totals.outstanding)}</p>
              <p className="text-[8px] text-foreground/22 mt-0.5">Sum of all user balances</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.015] p-3">
              <p className="text-[8px] text-foreground/30 font-mono tracking-widest">TREASURY HOLDS</p>
              <p className="text-sm font-black font-mono text-emerald-400 mt-1">
                {treasury !== null ? formatPrice(treasury) : "Unavailable"}
              </p>
              <p className="text-[8px] text-foreground/22 mt-0.5">Live nTZS treasury balance</p>
            </div>
            <div className={`rounded-xl border p-3 ${
              gap === null ? "border-white/8 bg-white/[0.015]"
              : Math.abs(gap) < 1 ? "border-emerald-500/20 bg-emerald-500/[0.04]"
              : "border-amber-500/20 bg-amber-500/[0.04]"
            }`}>
              <p className="text-[8px] text-foreground/30 font-mono tracking-widest">GAP</p>
              {gap === null ? (
                <p className="text-sm font-black font-mono text-foreground/40 mt-1">—</p>
              ) : Math.abs(gap) < 1 ? (
                <p className="text-sm font-black font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Balanced
                </p>
              ) : (
                <p className="text-sm font-black font-mono text-amber-400 mt-1">{formatPrice(gap)} short</p>
              )}
              <p className="text-[8px] text-foreground/22 mt-0.5">
                {gap !== null && gap >= 1 ? "Pre-migration funds not in treasury" : "Liability vs treasury"}
              </p>
            </div>
          </div>
        )}
        {totals.pending > 0 && (
          <div className="flex items-center gap-1.5 mt-3 text-[9px] text-amber-400/70 font-mono">
            <Clock className="h-3 w-3" />
            {formatPrice(totals.pending)} in pending deposits (not yet counted in balances)
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/22" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…"
          className="w-full pl-8 pr-8 py-2 bg-white/4 border border-white/10 rounded-xl text-[10px] text-foreground/65 placeholder:text-foreground/20 focus:outline-none focus:border-white/25 transition-colors" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/28 hover:text-foreground"><X className="h-3 w-3" /></button>}
      </div>

      {/* Wallet table */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-white/8 text-[7px] tracking-widest text-foreground/22 uppercase">
          <span className="col-span-4">User</span>
          <span className="col-span-2 text-right">Deposited</span>
          <span className="col-span-2 text-right">Withdrawn</span>
          <span className="col-span-2 text-right">Spent</span>
          <span className="col-span-2 text-right">Balance</span>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="h-10 bg-white/4 animate-pulse rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Wallet className="h-8 w-8 mx-auto mb-2 text-foreground/10" />
            <p className="text-[9px] text-foreground/25 font-mono">{search ? "No users match your search" : "No users yet"}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.045]">
            {filtered.map((w) => (
              <div key={w.id} className="grid grid-cols-12 gap-2 items-center px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold ${
                    w.role === "admin" ? "bg-amber-500/15 text-amber-400" : "bg-violet-500/15 text-violet-400"
                  }`}>
                    {w.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-foreground/70 truncate flex items-center gap-1.5">
                      {w.name || "—"}
                      {w.role === "admin" && <span className="text-[7px] px-1 py-px rounded bg-amber-500/15 text-amber-400/80 tracking-widest">ADMIN</span>}
                    </p>
                    <p className="text-[8px] text-foreground/28 font-mono truncate">{w.email}</p>
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <span className={`text-[10px] font-mono ${w.deposited > 0 ? "text-emerald-400/80" : "text-foreground/22"}`}>
                    {w.deposited > 0 ? formatPrice(w.deposited) : "—"}
                  </span>
                  {w.pendingDeposits > 0 && (
                    <p className="text-[7px] text-amber-400/60 font-mono">+{formatPrice(w.pendingDeposits)} pending</p>
                  )}
                </div>
                <div className="col-span-2 text-right">
                  <span className={`text-[10px] font-mono ${w.withdrawn > 0 ? "text-rose-400/80" : "text-foreground/22"}`}>
                    {w.withdrawn > 0 ? formatPrice(w.withdrawn) : "—"}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <span className={`text-[10px] font-mono ${w.spent > 0 ? "text-blue-400/80" : "text-foreground/22"}`}>
                    {w.spent > 0 ? formatPrice(w.spent) : "—"}
                  </span>
                  {w.orderCount > 0 && <p className="text-[7px] text-foreground/22 font-mono">{w.orderCount} order{w.orderCount === 1 ? "" : "s"}</p>}
                </div>
                <div className="col-span-2 text-right">
                  <span className={`text-[11px] font-mono font-bold ${w.balance > 0 ? "text-foreground/85" : "text-foreground/22"}`}>
                    {formatPrice(w.balance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[8px] text-foreground/22 font-mono leading-relaxed">
        Balance = confirmed deposits − withdrawals − order spend. Funds are held in the shared HaoDeals
        treasury; individual balances are tracked here in the database.
      </p>
      <div className="h-4" />
    </div>
  )
}
