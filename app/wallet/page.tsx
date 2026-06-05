"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Copy, RefreshCw, Smartphone, Loader2, CheckCircle2,
  ArrowDownToLine, ArrowUpFromLine, ShoppingBag, Clock,
  ArrowLeftRight, Wifi, X,
} from "lucide-react"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"

interface WalletData {
  ntzsUserId: string
  walletAddress: string | null
  balanceTzs: number | null
  balanceUsdc: number | null
}

interface TxItem {
  id: string
  type: "deposit" | "withdrawal" | "purchase" | "incoming"
  amountTzs: number
  status: string
  phoneNumber: string | null
  description: string | null
  createdAt: string
}

type Action = "idle" | "deposit" | "withdraw"
type DepositStage = "form" | "pending" | "done"

const typeConfig = {
  deposit:    { label: "Deposit",   icon: ArrowDownToLine, bg: "bg-emerald-500/15", color: "text-emerald-400", sign: "+" },
  withdrawal: { label: "Withdraw",  icon: ArrowUpFromLine,  bg: "bg-rose-500/15",   color: "text-rose-400",    sign: "−" },
  purchase:   { label: "Purchase",  icon: ShoppingBag,      bg: "bg-blue-500/15",   color: "text-blue-400",    sign: "−" },
  incoming:   { label: "Received",  icon: ArrowLeftRight,   bg: "bg-emerald-500/15", color: "text-emerald-400", sign: "+" },
}

const statusStyle: Record<string, { pill: string; label: string }> = {
  completed:         { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",   label: "Confirmed" },
  confirmed:         { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",   label: "Confirmed" },
  payment_confirmed: { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",   label: "Received" },
  packaging:         { pill: "bg-amber-500/10  text-amber-400  border-amber-500/20",       label: "Packaging" },
  in_transit:        { pill: "bg-violet-500/10 text-violet-400 border-violet-500/20",      label: "In Transit" },
  delivered:         { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",   label: "Delivered" },
  pending:           { pill: "bg-amber-500/10  text-amber-400  border-amber-500/20",       label: "Pending" },
  burned:            { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",   label: "Processed" },
  requested:         { pill: "bg-violet-500/10 text-violet-400 border-violet-500/20",      label: "Requested" },
  failed:            { pill: "bg-rose-500/10   text-rose-400   border-rose-500/20",        label: "Failed" },
  shipped:           { pill: "bg-blue-500/10   text-blue-400   border-blue-500/20",        label: "Shipped" },
  processing:        { pill: "bg-blue-500/10   text-blue-400   border-blue-500/20",        label: "Processing" },
  refunded:          { pill: "bg-orange-500/10 text-orange-400 border-orange-500/20",      label: "Refunded" },
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

// ── Chip SVG (EMV-style) ────────────────────────────────────────────────────
function ChipIcon() {
  return (
    <svg width="42" height="32" viewBox="0 0 42 32" fill="none">
      <rect width="42" height="32" rx="5" fill="url(#chip-grad)" />
      {/* Contact pads */}
      <rect x="14" y="1" width="14" height="6" rx="1" fill="rgba(0,0,0,0.18)" />
      <rect x="14" y="25" width="14" height="6" rx="1" fill="rgba(0,0,0,0.18)" />
      <rect x="1"  y="10" width="8"  height="12" rx="1" fill="rgba(0,0,0,0.18)" />
      <rect x="33" y="10" width="8"  height="12" rx="1" fill="rgba(0,0,0,0.18)" />
      <rect x="14" y="10" width="14" height="12" rx="2" fill="rgba(0,0,0,0.12)" />
      {/* Center cross */}
      <line x1="21" y1="10" x2="21" y2="22" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      <line x1="14" y1="16" x2="28" y2="16" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      <defs>
        <linearGradient id="chip-grad" x1="0" y1="0" x2="42" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor="#f9e784" />
          <stop offset="45%" stopColor="#d4a520" />
          <stop offset="100%" stopColor="#f0cc60" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── NFC / contactless icon ─────────────────────────────────────────────────
function NfcIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 6 Q16 11 11 16" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M11 3 Q20 11 11 19" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="11" cy="11" r="1.5" fill="rgba(255,255,255,0.5)" />
    </svg>
  )
}

export default function WalletPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [wallet, setWallet]               = useState<WalletData | null>(null)
  const [history, setHistory]             = useState<TxItem[]>([])
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)

  const [action, setAction]               = useState<Action>("idle")
  const [depositStage, setDepositStage]   = useState<DepositStage>("form")
  const [phone, setPhone]                 = useState("")
  const [amount, setAmount]               = useState("")
  const [submitting, setSubmitting]       = useState(false)
  const [withdrawResult, setWithdrawResult] = useState<{ status: string; message: string } | null>(null)

  // ── Auto-poll ───────────────────────────────────────────────────────────────
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  function startPoll() {
    clearPoll()
    pollRef.current = setInterval(async () => {
      const res = await fetch("/api/wallet/transactions")
      if (!res.ok) return
      const fresh: TxItem[] = await res.json()
      setHistory((prev) => {
        const prevPending = prev.filter((t) => t.status === "pending")
        const resolved = prevPending.filter((p) => {
          const now = fresh.find((f) => f.id === p.id)
          return now && now.status !== "pending"
        })
        if (resolved.length > 0) {
          fetch("/api/wallet").then((r) => r.ok ? r.json() : null).then((d) => { if (d) setWallet(d) })
          resolved.forEach((tx) => {
            const updated = fresh.find((f) => f.id === tx.id)!
            const label = updated.status === "completed" || updated.status === "confirmed" ? "✓ Confirmed" : updated.status
            toast.success(`Transaction ${label}`, {
              description: tx.description ?? typeConfig[tx.type].label,
              className: "font-mono text-xs",
            })
          })
        }
        return fresh
      })
      if (!fresh.some((t) => t.status === "pending")) clearPoll()
    }, 3000)
  }

  useEffect(() => {
    const hasPending = history.some((t) => t.status === "pending")
    if (hasPending) startPoll()
    else clearPoll()
    return clearPoll
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/wallet")
  }, [status, router])

  useEffect(() => {
    if (!session?.user) return
    const u = session.user as { phone?: string | null }
    if (u.phone) setPhone(u.phone)
    fetchWallet()
    fetchHistory()
  }, [session])

  async function fetchWallet() {
    setLoadingWallet(true)
    try {
      const res = await fetch("/api/wallet")
      if (res.ok) setWallet(await res.json())
    } finally { setLoadingWallet(false) }
  }

  async function fetchHistory() {
    setLoadingHistory(true)
    try {
      const res = await fetch("/api/wallet/transactions")
      if (res.ok) setHistory(await res.json())
    } finally { setLoadingHistory(false) }
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt < 500) { toast.error("Minimum deposit is TSh 500"); return }
    setSubmitting(true)
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phone, amount: amt }),
    })
    if (res.ok) {
      setDepositStage("pending")
      fetchHistory()
    } else {
      const d = await res.json()
      toast.error(d.error ?? "Deposit failed")
    }
    setSubmitting(false)
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt < 5000) { toast.error("Minimum withdrawal is TSh 5,000"); return }
    setSubmitting(true)
    const res = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phone, amount: amt }),
    })
    const d = await res.json()
    if (res.ok) {
      setWithdrawResult({ status: d.status, message: d.message })
      fetchWallet()
      fetchHistory()
    } else {
      toast.error(d.error ?? "Withdrawal failed")
    }
    setSubmitting(false)
  }

  function openAction(a: Action) {
    setAction(a); setAmount(""); setDepositStage("form"); setWithdrawResult(null)
  }

  function copyAddress() {
    if (wallet?.walletAddress) {
      navigator.clipboard.writeText(wallet.walletAddress)
      toast.success("Wallet address copied")
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const user     = session?.user as { name?: string | null; email?: string | null; phone?: string | null } | undefined
  const userName = user?.name ?? user?.email?.split("@")[0] ?? "Wallet"
  const firstName = userName.split(" ")[0]
  const hasPending = history.some((t) => t.status === "pending")

  const addr   = wallet?.walletAddress ?? ""
  const last4  = addr ? addr.slice(-4).toUpperCase() : "····"
  const cardNo = `**** **** **** ${last4}`

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (status === "loading" || (loadingWallet && !wallet)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400/60" />
          <p className="text-xs text-foreground/30 font-mono tracking-widest">Loading wallet…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-md space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-foreground/40 font-mono">{greeting()},</p>
            <h1 className="text-xl font-bold text-foreground tracking-tight">{firstName}!</h1>
          </div>
          <button
            onClick={() => { fetchWallet(); fetchHistory() }}
            className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-foreground/30 hover:text-foreground hover:border-white/25 transition-all active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ── Premium Digital Card ─────────────────────────────────────────── */}
        <div
          className="relative w-full rounded-[24px] overflow-hidden cursor-default select-none transition-transform duration-300 hover:scale-[1.01]"
          style={{
            aspectRatio: "1.7 / 1",
            background: "linear-gradient(135deg, #3b1f8c 0%, #5b33be 30%, #7c3aed 55%, #2563eb 100%)",
            boxShadow: "0 32px 64px -12px rgba(109, 40, 217, 0.55), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Top gloss */}
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at 35% 0%, rgba(255,255,255,0.18) 0%, transparent 55%)",
            }}
          />
          {/* Bottom vignette */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 55%)" }}
          />
          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          {/* Shimmer diagonal */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)",
            }}
          />

          {/* ── Card content ── */}
          <div className="relative z-10 h-full flex flex-col justify-between p-5 sm:p-6">

            {/* Row 1: Chip + NFC + brand */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <ChipIcon />
                <NfcIcon />
              </div>
              {/* nTZS logo */}
              <div className="text-right">
                <div
                  className="text-white/90 font-black text-xl leading-none tracking-wide"
                  style={{ fontFamily: '"Georgia", serif', textShadow: "0 0 20px rgba(255,255,255,0.3)" }}
                >
                  nTZS
                </div>
                <div className="text-white/30 text-[8px] tracking-[0.25em] mt-0.5 font-mono">DIGITAL</div>
              </div>
            </div>

            {/* Row 2: Balance */}
            <div>
              <p className="text-white/45 text-[9px] uppercase tracking-[0.2em] mb-1 font-mono">Available Balance</p>
              {wallet?.balanceTzs === null ? (
                <p className="text-white/30 text-2xl font-black">Unavailable</p>
              ) : wallet ? (
                <div>
                  <p className="text-white font-black tracking-tight" style={{ fontSize: "clamp(1.4rem, 5vw, 1.9rem)" }}>
                    {formatPrice(wallet.balanceTzs ?? 0)}
                    <span className="text-white/35 text-sm font-normal ml-1.5 font-mono">TZS</span>
                  </p>
                  {wallet.balanceUsdc != null && wallet.balanceUsdc > 0 && (
                    <p className="text-white/30 text-[10px] font-mono mt-0.5">USDC {wallet.balanceUsdc.toFixed(2)}</p>
                  )}
                </div>
              ) : (
                <div className="h-8 w-44 bg-white/10 animate-pulse rounded-lg" />
              )}
            </div>

            {/* Row 3: Card number + name */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/35 text-[8px] uppercase tracking-[0.2em] mb-0.5 font-mono">Cardholder</p>
                <p className="text-white text-sm font-semibold tracking-wide">{userName}</p>
              </div>
              <div className="text-right">
                <p className="text-white/35 text-[8px] uppercase tracking-[0.2em] mb-0.5 font-mono">Wallet No.</p>
                <button
                  onClick={copyAddress}
                  className="text-white/55 text-[10px] font-mono hover:text-white/90 transition-colors flex items-center gap-1.5 ml-auto"
                >
                  {cardNo}
                  <Copy className="h-2.5 w-2.5 opacity-60" />
                </button>
              </div>
            </div>
          </div>

          {/* Pending pulse ring */}
          {hasPending && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[8px] text-amber-300/80 font-mono tracking-widest">SYNCING</span>
            </div>
          )}
        </div>

        {/* ── Quick Actions ────────────────────────────────────────────────── */}
        {action === "idle" && (
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: <ArrowDownToLine className="h-5 w-5" />,
                label: "Add Funds",
                onClick: () => openAction("deposit"),
                color: "text-emerald-400",
                bg: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/15",
              },
              {
                icon: <ArrowUpFromLine className="h-5 w-5" />,
                label: "Withdraw",
                onClick: () => openAction("withdraw"),
                color: "text-blue-400",
                bg: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/15",
              },
              {
                icon: <ShoppingBag className="h-5 w-5" />,
                label: "My Orders",
                href: "/orders",
                color: "text-violet-400",
                bg: "bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/15",
              },
            ].map((btn) => {
              const inner = (
                <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 ${btn.bg}`}>
                  <div className={btn.color}>{btn.icon}</div>
                  <span className="text-[10px] font-mono tracking-wide text-foreground/55">{btn.label}</span>
                </div>
              )
              return btn.href
                ? <Link key={btn.label} href={btn.href}>{inner}</Link>
                : <button key={btn.label} onClick={btn.onClick}>{inner}</button>
            })}
          </div>
        )}

        {/* ── Deposit form ─────────────────────────────────────────────────── */}
        {action === "deposit" && depositStage === "form" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-foreground/80">Add Funds</p>
              </div>
              <button onClick={() => setAction("idle")} className="text-foreground/30 hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleDeposit} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono tracking-widest text-foreground/40 block mb-1.5">PHONE NUMBER</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 712 345 678" required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.04] transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-foreground/40 block mb-1.5">AMOUNT (TZS)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10,000" min={500} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.04] transition-all" />
                <p className="text-[9px] font-mono text-foreground/25 mt-1">Minimum TSh 500</p>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Initiating…</> : <><Smartphone className="h-4 w-4" /> Send Mobile Prompt</>}
              </button>
            </form>
          </div>
        )}

        {action === "deposit" && depositStage === "pending" && (
          <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] p-6 text-center space-y-3">
            <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-amber-400/25 animate-ping" />
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <p className="font-semibold text-foreground/80">Check your phone</p>
            <p className="text-sm text-foreground/40">Approve the M-Pesa prompt on <span className="text-foreground/70">{phone}</span></p>
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-amber-400/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-pulse" />
              Auto-updating when confirmed
            </div>
            <button
              onClick={() => { setDepositStage("done"); setAction("idle"); fetchWallet(); fetchHistory() }}
              className="flex items-center justify-center gap-1.5 mx-auto text-sm text-foreground/40 hover:text-foreground transition-colors mt-1"
            >
              <CheckCircle2 className="h-4 w-4" /> I've approved — refresh
            </button>
          </div>
        )}

        {/* ── Withdraw form ────────────────────────────────────────────────── */}
        {action === "withdraw" && !withdrawResult && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center">
                  <ArrowUpFromLine className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-foreground/80">Withdraw Funds</p>
              </div>
              <button onClick={() => setAction("idle")} className="text-foreground/30 hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono tracking-widest text-foreground/40 block mb-1.5">PHONE NUMBER</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 712 345 678" required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.04] transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-mono tracking-widest text-foreground/40 block mb-1.5">AMOUNT (TZS)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5,000" min={5000} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.04] transition-all" />
                <p className="text-[9px] font-mono text-foreground/25 mt-1">Minimum TSh 5,000</p>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : <><ArrowUpFromLine className="h-4 w-4" /> Withdraw Funds</>}
              </button>
            </form>
          </div>
        )}

        {action === "withdraw" && withdrawResult && (
          <div className={`rounded-2xl border p-6 text-center space-y-3 ${withdrawResult.status === "burned" ? "border-emerald-500/15 bg-emerald-500/[0.03]" : "border-violet-500/15 bg-violet-500/[0.03]"}`}>
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${withdrawResult.status === "burned" ? "bg-emerald-500/10" : "bg-violet-500/10"}`}>
              <CheckCircle2 className={`h-6 w-6 ${withdrawResult.status === "burned" ? "text-emerald-400" : "text-violet-400"}`} />
            </div>
            <p className="font-semibold text-foreground/80">
              {withdrawResult.status === "burned" ? "Withdrawal Processed" : "Withdrawal Requested"}
            </p>
            <p className="text-sm text-foreground/45">{withdrawResult.message}</p>
            <button onClick={() => setAction("idle")}
              className="text-sm text-foreground/35 hover:text-foreground transition-colors">
              Close
            </button>
          </div>
        )}

        {/* ── Transaction History ──────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground/70">Recent Transactions</h2>
            {loadingHistory && <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground/30" />}
          </div>

          {!loadingHistory && history.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.015] px-4 py-10 text-center">
              <Clock className="h-6 w-6 text-foreground/15 mx-auto mb-2" />
              <p className="text-sm text-foreground/30">No transactions yet</p>
              <p className="text-xs text-foreground/20 mt-1">Add funds to get started</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/8 bg-white/[0.015] divide-y divide-white/[0.05] overflow-hidden">
              {history.map((tx) => {
                const cfg      = typeConfig[tx.type]
                const Icon     = cfg.icon
                const isPending = tx.status === "pending"
                const ss       = statusStyle[tx.status] ?? { pill: "bg-white/5 text-foreground/30 border-white/10", label: tx.status }
                const isCredit = tx.type === "deposit" || tx.type === "incoming"

                return (
                  <div
                    key={tx.id}
                    className={`flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-white/[0.02] ${isPending ? "bg-amber-500/[0.03]" : ""}`}
                  >
                    {/* Icon bubble */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 relative ${cfg.bg}`}>
                      {isPending && (
                        <span className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping" />
                      )}
                      <Icon className={`h-4 w-4 ${isPending ? "text-amber-400" : cfg.color}`} />
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/75 truncate font-medium">
                        {tx.description ?? cfg.label}
                      </p>
                      <p className="text-[10px] text-foreground/30 mt-0.5 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        {tx.phoneNumber && ` · ${tx.phoneNumber}`}
                      </p>
                    </div>

                    {/* Amount + status */}
                    <div className="text-right flex-shrink-0 space-y-1">
                      <p className={`text-sm font-bold font-mono ${isCredit ? "text-emerald-400" : "text-foreground/65"}`}>
                        {cfg.sign}{formatPrice(tx.amountTzs)}
                      </p>
                      <span className={`inline-flex text-[9px] border px-1.5 py-0.5 rounded-full font-mono tracking-wide ${ss.pill}`}>
                        {ss.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom padding for mobile nav */}
        <div className="h-4" />
      </div>
    </div>
  )
}
