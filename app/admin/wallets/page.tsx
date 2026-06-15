"use client"

import { useEffect, useState } from "react"
import {
  Wallet, Search, X, ArrowDownToLine, ArrowUpFromLine,
  ShoppingBag, Landmark, AlertTriangle, CheckCircle2, Clock,
  ArrowRightLeft, Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"

interface WalletRow {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: string
  createdAt: string
  swept: boolean
  hasLegacyWallet: boolean
  balance: number
  deposited: number
  pendingDeposits: number
  adjustments: number
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
  legacyWallets: number
}

interface ApiResponse {
  wallets: WalletRow[]
  totals: Totals
  treasuryBalance: number | null
  treasuryConfigured: boolean
}

interface SweepResult {
  email: string
  realBalance: number
  ledgerBefore: number
  adjustment: number
  transferred: number
  status: "swept" | "no_funds" | "is_treasury" | "error"
  error?: string
}
interface SweepResponse {
  processed: number
  swept: number
  noFunds: number
  treasury: number
  errors: number
  totalSwept: number
  results: SweepResult[]
}

const EMPTY_TOTALS: Totals = { outstanding: 0, deposited: 0, withdrawn: 0, spent: 0, pending: 0, legacyWallets: 0 }

export default function AdminWallets() {
  const [data,    setData]    = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState("")

  // Sweep flow
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sweeping,    setSweeping]    = useState(false)
  const [sweepResult, setSweepResult] = useState<SweepResponse | null>(null)

  // Consolidate-into-treasury flow
  const [consolidateOpen, setConsolidateOpen] = useState(false)
  const [sourceId,        setSourceId]        = useState("")
  const [checking,        setChecking]        = useState(false)
  const [consolidating,   setConsolidating]   = useState(false)
  const [preview,         setPreview]         = useState<{ from: { balanceTzs: number }, treasury: { balanceTzs: number }, isSameAsTreasury: boolean } | null>(null)

  async function checkBalances() {
    setPreview(null)
    if (!sourceId.trim()) { toast.error("Enter the source wallet ID"); return }
    setChecking(true)
    try {
      const r = await fetch(`/api/admin/wallets/consolidate?from=${encodeURIComponent(sourceId.trim())}`)
      const d = await r.json()
      if (!r.ok) { toast.error(d.error ?? "Could not read wallet"); return }
      setPreview(d)
    } catch { toast.error("Could not read wallet") } finally { setChecking(false) }
  }

  async function runConsolidate() {
    setConsolidating(true)
    try {
      const r = await fetch("/api/admin/wallets/consolidate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId: sourceId.trim() }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d.error ?? "Transfer failed"); return }
      toast.success(`Moved ${formatPrice(d.transferred)} into treasury`)
      setConsolidateOpen(false); setSourceId(""); setPreview(null)
      load()
    } catch { toast.error("Transfer failed") } finally { setConsolidating(false) }
  }

  function load() {
    setLoading(true)
    fetch("/api/admin/wallets")
      .then((r) => r.json())
      .then((d) => { setData(d?.wallets ? d : { wallets: [], totals: EMPTY_TOTALS, treasuryBalance: null, treasuryConfigured: false }); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  async function runSweep() {
    setSweeping(true)
    try {
      const r = await fetch("/api/admin/wallets/sweep", { method: "POST" })
      const d: SweepResponse = await r.json()
      if (!r.ok) { toast.error((d as unknown as { error?: string }).error ?? "Sweep failed"); return }
      setSweepResult(d)
      setConfirmOpen(false)
      toast.success(`Swept ${d.swept} wallet${d.swept === 1 ? "" : "s"} — ${formatPrice(d.totalSwept)} into treasury`)
      load()
    } catch {
      toast.error("Sweep failed")
    } finally {
      setSweeping(false)
    }
  }

  const wallets = data?.wallets ?? []
  const totals  = data?.totals ?? EMPTY_TOTALS

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
          { label: "Outstanding Balance", val: totals.outstanding, icon: Wallet,         color: "text-violet-400",  bg: "bg-violet-500/10",  hint: "Spendable, owed to users" },
          { label: "Lifetime Deposits",   val: totals.deposited,    icon: ArrowDownToLine, color: "text-emerald-400", bg: "bg-emerald-500/10", hint: "All-time gross top-ups" },
          { label: "Total Withdrawn",     val: totals.withdrawn,    icon: ArrowUpFromLine, color: "text-rose-400",    bg: "bg-rose-500/10",    hint: "Paid out to users" },
          { label: "Order Revenue",       val: totals.spent,        icon: ShoppingBag,     color: "text-blue-400",    bg: "bg-blue-500/10",    hint: "Spent on orders" },
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
              : gap >= 1 ? "border-amber-500/20 bg-amber-500/[0.04]"
              : "border-emerald-500/20 bg-emerald-500/[0.04]"
            }`}>
              <p className="text-[8px] text-foreground/30 font-mono tracking-widest">COVERAGE</p>
              {gap === null ? (
                <p className="text-sm font-black font-mono text-foreground/40 mt-1">—</p>
              ) : gap >= 1 ? (
                <p className="text-sm font-black font-mono text-amber-400 mt-1">{formatPrice(gap)} short</p>
              ) : (
                <p className="text-sm font-black font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Fully backed
                </p>
              )}
              <p className="text-[8px] text-foreground/22 mt-0.5">
                {gap === null ? "Liability vs treasury"
                  : gap >= 1 ? "Funds not yet in treasury"
                  : gap <= -1 ? `${formatPrice(Math.abs(gap))} surplus (order revenue)`
                  : "Exactly balanced"}
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

        {/* Move external wallet funds into the treasury */}
        {data?.treasuryConfigured && (
          <div className="mt-4 pt-4 border-t border-white/8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[10px] text-foreground/65 font-mono">Consolidate another wallet</p>
              <p className="text-[8px] text-foreground/30 mt-1">
                Move nTZS from a different wallet (e.g. an old one) into the active treasury.
              </p>
            </div>
            <button
              onClick={() => { setPreview(null); setSourceId(""); setConsolidateOpen(true) }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-mono tracking-widest hover:bg-blue-500/25 transition-all active:scale-[0.98] flex-shrink-0"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> MOVE FUNDS IN
            </button>
          </div>
        )}

        {/* Sweep CTA — only when legacy per-user wallets still exist */}
        {data?.treasuryConfigured && totals.legacyWallets > 0 && (
          <div className="mt-4 pt-4 border-t border-white/8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[10px] text-foreground/65 font-mono flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                {totals.legacyWallets} user{totals.legacyWallets === 1 ? "" : "s"} still hold funds in individual nTZS wallets
              </p>
              <p className="text-[8px] text-foreground/30 mt-1">
                Sweep moves each user&apos;s real wallet balance into the treasury and pins their ledger to match.
              </p>
            </div>
            <button
              onClick={() => { setSweepResult(null); setConfirmOpen(true) }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono tracking-widest hover:bg-amber-500/25 transition-all active:scale-[0.98] flex-shrink-0"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> SWEEP TO TREASURY
            </button>
          </div>
        )}

        {/* Last sweep summary */}
        {sweepResult && (
          <div className="mt-4 pt-4 border-t border-white/8">
            <p className="text-[9px] text-foreground/45 font-mono mb-2">
              Last sweep: <span className="text-emerald-400">{sweepResult.swept} swept</span> · {sweepResult.noFunds} empty
              {sweepResult.treasury > 0 && <span> · {sweepResult.treasury} treasury</span>}
              {sweepResult.errors > 0 && <span className="text-rose-400"> · {sweepResult.errors} errors</span>}
              {" · "}{formatPrice(sweepResult.totalSwept)} moved
            </p>
            {sweepResult.errors > 0 && (
              <div className="space-y-1">
                {sweepResult.results.filter((r) => r.status === "error").map((r) => (
                  <p key={r.email} className="text-[8px] text-rose-400/70 font-mono">⚠ {r.email}: {r.error}</p>
                ))}
              </div>
            )}
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
        Balance = confirmed deposits + adjustments − withdrawals − order spend. Funds are held in the shared
        HaoDeals treasury; individual balances are tracked here in the database.
      </p>
      <div className="h-4" />

      {/* ── Sweep confirmation modal ─────────────────────────────────── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => !sweeping && setConfirmOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/12 bg-background p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <ArrowRightLeft className="h-4 w-4 text-amber-400" />
              </div>
              <h2 className="text-sm font-semibold text-foreground/85">Sweep legacy wallets to treasury</h2>
            </div>
            <div className="space-y-2.5 text-[11px] text-foreground/55 leading-relaxed">
              <p>
                This reads the <span className="text-foreground/80">real nTZS balance</span> of each of the{" "}
                <span className="text-amber-400 font-mono">{totals.legacyWallets}</span> legacy wallet(s),
                transfers it into the HaoDeals treasury, and pins each user&apos;s ledger balance to that real amount.
              </p>
              <p className="text-foreground/40">
                After this, treasury holdings will back 100% of user balances (1:1). Each user is detached from their
                old wallet and switched to the treasury model — this can only run once per user.
              </p>
              <div className="flex items-start gap-1.5 text-amber-400/80 bg-amber-500/[0.06] border border-amber-500/15 rounded-lg p-2.5">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
                <span>This moves real funds and is not reversible. Make sure your treasury account is correct.</span>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={sweeping}
                className="flex-1 py-2.5 rounded-xl border border-white/12 text-foreground/55 text-[11px] font-mono tracking-widest hover:bg-white/[0.04] transition-all disabled:opacity-40"
              >
                CANCEL
              </button>
              <button
                onClick={runSweep}
                disabled={sweeping}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/35 text-amber-200 text-[11px] font-mono tracking-widest hover:bg-amber-500/30 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {sweeping ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> SWEEPING…</> : <>CONFIRM SWEEP</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Consolidate-into-treasury modal ───────────────────────────── */}
      {consolidateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => !consolidating && setConsolidateOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/12 bg-background p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <ArrowRightLeft className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="text-sm font-semibold text-foreground/85">Move funds into treasury</h2>
            </div>

            <p className="text-[11px] text-foreground/50 leading-relaxed mb-3">
              Enter the nTZS user ID of the wallet to move funds from. Check the live balances, then transfer
              its full balance into the active treasury. This moves real funds and is not reversible.
            </p>

            <label className="text-[9px] font-mono tracking-widest text-foreground/35 block mb-1.5">SOURCE WALLET ID</label>
            <div className="flex gap-2 mb-3">
              <input
                value={sourceId}
                onChange={(e) => { setSourceId(e.target.value); setPreview(null) }}
                placeholder="nTZS user id of the old wallet"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-blue-500/35 transition-colors font-mono"
              />
              <button
                onClick={checkBalances}
                disabled={checking || !sourceId.trim()}
                className="px-3 py-2 rounded-xl border border-white/12 text-foreground/60 text-[10px] font-mono tracking-widest hover:bg-white/[0.04] transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : "CHECK"}
              </button>
            </div>

            {preview && (
              <div className="space-y-2 mb-4">
                {preview.isSameAsTreasury ? (
                  <div className="flex items-start gap-1.5 text-amber-400/80 bg-amber-500/[0.06] border border-amber-500/15 rounded-lg p-2.5 text-[10px]">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
                    This wallet IS the treasury — nothing to move.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.015] px-3 py-2.5">
                      <span className="text-[9px] text-foreground/40 font-mono tracking-widest">SOURCE HOLDS</span>
                      <span className="text-[12px] font-black font-mono text-blue-400">{formatPrice(preview.from.balanceTzs)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.015] px-3 py-2.5">
                      <span className="text-[9px] text-foreground/40 font-mono tracking-widest">TREASURY NOW</span>
                      <span className="text-[12px] font-black font-mono text-emerald-400">{formatPrice(preview.treasury.balanceTzs)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-2.5">
                      <span className="text-[9px] text-emerald-400/70 font-mono tracking-widest">TREASURY AFTER</span>
                      <span className="text-[12px] font-black font-mono text-emerald-400">{formatPrice(preview.treasury.balanceTzs + preview.from.balanceTzs)}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setConsolidateOpen(false)}
                disabled={consolidating}
                className="flex-1 py-2.5 rounded-xl border border-white/12 text-foreground/55 text-[11px] font-mono tracking-widest hover:bg-white/[0.04] transition-all disabled:opacity-40"
              >
                CANCEL
              </button>
              <button
                onClick={runConsolidate}
                disabled={consolidating || !preview || preview.isSameAsTreasury || preview.from.balanceTzs <= 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/20 border border-blue-500/35 text-blue-200 text-[11px] font-mono tracking-widest hover:bg-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-40"
              >
                {consolidating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> MOVING…</> : <>TRANSFER TO TREASURY</>}
              </button>
            </div>
            {!preview && <p className="text-[8px] text-foreground/25 mt-2 text-center">Check balances first to enable the transfer.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
