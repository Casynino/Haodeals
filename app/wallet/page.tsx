"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Copy, RefreshCw, Smartphone, Loader2, CheckCircle2,
  ArrowDownToLine, ArrowUpFromLine, ShoppingBag, Clock,
  ArrowLeftRight, Eye, EyeOff, X,
} from "lucide-react"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"

/* ── Types ───────────────────────────────────────────────────────────────── */

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

type Action      = "idle" | "deposit" | "withdraw"
type DepositStage = "form" | "pending" | "done"

/* ── Config maps ─────────────────────────────────────────────────────────── */

const typeConfig = {
  deposit:    { label: "Deposit",  icon: ArrowDownToLine, bg: "bg-emerald-500/15", color: "text-emerald-400", sign: "+" },
  withdrawal: { label: "Withdraw", icon: ArrowUpFromLine,  bg: "bg-rose-500/15",   color: "text-rose-400",    sign: "−" },
  purchase:   { label: "Purchase", icon: ShoppingBag,      bg: "bg-blue-500/15",   color: "text-blue-400",    sign: "−" },
  incoming:   { label: "Received", icon: ArrowLeftRight,   bg: "bg-emerald-500/15", color: "text-emerald-400", sign: "+" },
}

const statusStyle: Record<string, { pill: string; label: string }> = {
  completed:         { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Confirmed"  },
  confirmed:         { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Confirmed"  },
  payment_confirmed: { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Received"   },
  packaging:         { pill: "bg-amber-500/10   text-amber-400   border-amber-500/20",   label: "Packaging"  },
  in_transit:        { pill: "bg-violet-500/10  text-violet-400  border-violet-500/20",  label: "In Transit" },
  delivered:         { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Delivered"  },
  pending:           { pill: "bg-amber-500/10   text-amber-400   border-amber-500/20",   label: "Pending"    },
  burned:            { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Processed"  },
  requested:         { pill: "bg-violet-500/10  text-violet-400  border-violet-500/20",  label: "Requested"  },
  failed:            { pill: "bg-rose-500/10    text-rose-400    border-rose-500/20",    label: "Failed"     },
  shipped:           { pill: "bg-blue-500/10    text-blue-400    border-blue-500/20",    label: "Shipped"    },
  processing:        { pill: "bg-blue-500/10    text-blue-400    border-blue-500/20",    label: "Processing" },
  refunded:          { pill: "bg-orange-500/10  text-orange-400  border-orange-500/20",  label: "Refunded"   },
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

/* ── Premium EMV chip ────────────────────────────────────────────────────── */
function PremiumChip() {
  return (
    <svg width="46" height="36" viewBox="0 0 46 36" fill="none">
      <rect width="46" height="36" rx="6" fill="url(#cp-body)" />
      {/* contact pads */}
      <rect x="15" y="1"  width="16" height="8"  rx="2" fill="url(#cp-pad)" opacity="0.92" />
      <rect x="15" y="27" width="16" height="8"  rx="2" fill="url(#cp-pad)" opacity="0.92" />
      <rect x="1"  y="11" width="13" height="14" rx="2" fill="url(#cp-pad)" opacity="0.92" />
      <rect x="32" y="11" width="13" height="14" rx="2" fill="url(#cp-pad)" opacity="0.92" />
      {/* centre cavity */}
      <rect x="15" y="9"  width="16" height="18" rx="3" fill="url(#cp-inner)" />
      {/* dividers */}
      <line x1="23" y1="9"  x2="23" y2="27" stroke="rgba(0,0,0,0.22)" strokeWidth="0.6" />
      <line x1="15" y1="18" x2="31" y2="18" stroke="rgba(0,0,0,0.22)" strokeWidth="0.6" />
      {/* top shine */}
      <rect x="0" y="0" width="46" height="7" rx="6" fill="url(#cp-shine)" opacity="0.35" />
      <defs>
        <linearGradient id="cp-body" x1="0" y1="0" x2="46" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fde68a" />
          <stop offset="30%"  stopColor="#d97706" />
          <stop offset="65%"  stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="cp-inner" x1="15" y1="9" x2="31" y2="27" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#92400e" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="cp-pad" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#fde68a" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="cp-shine" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ── NFC arcs ────────────────────────────────────────────────────────────── */
function NfcWaves() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="2"   fill="rgba(255,255,255,0.55)" />
      <path d="M13 8 Q19 13 13 18"    stroke="rgba(255,255,255,0.40)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M13 4 Q22.5 13 13 22"  stroke="rgba(255,255,255,0.22)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/* ── Decorative wave lines (bottom-right of card) ───────────────────────── */
function CardWaves() {
  return (
    <svg
      viewBox="0 0 220 140"
      fill="none"
      className="absolute bottom-0 right-0 w-[62%] h-[72%] pointer-events-none"
      preserveAspectRatio="xMaxYMax meet"
    >
      {[
        { d: "M 220 128 C 160 100 100 120 20 105",  o: 0.38, w: 1.8 },
        { d: "M 220 108 C 165  80 110 100 30  88",  o: 0.26, w: 1.5 },
        { d: "M 220  88 C 168  60 118  80 40  68",  o: 0.17, w: 1.2 },
        { d: "M 220  68 C 170  42 128  62 55  50",  o: 0.10, w: 1.0 },
        { d: "M 220  48 C 175  28 138  45 72  34",  o: 0.06, w: 0.8 },
      ].map(({ d, o, w }, i) => (
        <path key={i} d={d} stroke={`rgba(251,191,36,${o})`} strokeWidth={w} strokeLinecap="round" />
      ))}
    </svg>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function WalletPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [wallet,         setWallet]         = useState<WalletData | null>(null)
  const [history,        setHistory]        = useState<TxItem[]>([])
  const [loadingWallet,  setLoadingWallet]  = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)

  const [action,         setAction]         = useState<Action>("idle")
  const [depositStage,   setDepositStage]   = useState<DepositStage>("form")
  const [phone,          setPhone]          = useState("")
  const [amount,         setAmount]         = useState("")
  const [submitting,     setSubmitting]     = useState(false)
  const [withdrawResult, setWithdrawResult] = useState<{ status: string; message: string } | null>(null)

  // ── Balance visibility (persisted) ──────────────────────────────────────
  const [balanceVisible, setBalanceVisible] = useState(true)
  useEffect(() => {
    const v = localStorage.getItem("wallet_balance_visible")
    if (v !== null) setBalanceVisible(v !== "false")
  }, [])
  function toggleBalance() {
    const next = !balanceVisible
    setBalanceVisible(next)
    localStorage.setItem("wallet_balance_visible", String(next))
  }

  // ── Card 3-D tilt (desktop mouse tracking) ──────────────────────────────
  const [tilt,      setTilt]      = useState({ x: 0, y: 0 })
  const [hovered,   setHovered]   = useState(false)
  const [sweeping,  setSweeping]  = useState(false)

  function handleCardMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const r   = e.currentTarget.getBoundingClientRect()
    const rx  = ((e.clientY - r.top  - r.height / 2) / r.height) * -9
    const ry  = ((e.clientX - r.left - r.width  / 2) / r.width)  * 11
    setTilt({ x: rx, y: ry })
  }
  function handleCardEnter() {
    setHovered(true)
    setSweeping(true)
    setTimeout(() => setSweeping(false), 1500)
  }
  function handleCardLeave() {
    setHovered(false)
    setTilt({ x: 0, y: 0 })
  }

  // Initial sweep on mount
  useEffect(() => {
    const t = setTimeout(() => { setSweeping(true); setTimeout(() => setSweeping(false), 1500) }, 600)
    return () => clearTimeout(t)
  }, [])

  // ── Auto-poll ──────────────────────────────────────────────────────────
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  function clearPoll() { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  function startPoll() {
    clearPoll()
    pollRef.current = setInterval(async () => {
      const res = await fetch("/api/wallet/transactions")
      if (!res.ok) return
      const fresh: TxItem[] = await res.json()
      setHistory((prev) => {
        const resolved = prev
          .filter((t) => t.status === "pending")
          .filter((p) => { const n = fresh.find((f) => f.id === p.id); return n && n.status !== "pending" })
        if (resolved.length > 0) {
          fetch("/api/wallet").then((r) => r.ok ? r.json() : null).then((d) => { if (d) setWallet(d) })
          resolved.forEach((tx) => {
            const updated = fresh.find((f) => f.id === tx.id)!
            const lbl = updated.status === "completed" || updated.status === "confirmed" ? "✓ Confirmed" : updated.status
            toast.success(`Transaction ${lbl}`, { description: tx.description ?? typeConfig[tx.type].label, className: "font-mono text-xs" })
          })
        }
        return fresh
      })
      if (!fresh.some((t) => t.status === "pending")) clearPoll()
    }, 3000)
  }

  useEffect(() => {
    const hasPending = history.some((t) => t.status === "pending")
    if (hasPending) startPoll(); else clearPoll()
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
    fetchWallet(); fetchHistory()
  }, [session])

  async function fetchWallet() {
    setLoadingWallet(true)
    try { const r = await fetch("/api/wallet"); if (r.ok) setWallet(await r.json()) }
    finally { setLoadingWallet(false) }
  }
  async function fetchHistory() {
    setLoadingHistory(true)
    try { const r = await fetch("/api/wallet/transactions"); if (r.ok) setHistory(await r.json()) }
    finally { setLoadingHistory(false) }
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt < 500) { toast.error("Minimum deposit is TSh 500"); return }
    setSubmitting(true)
    const res = await fetch("/api/wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumber: phone, amount: amt }) })
    if (res.ok) { setDepositStage("pending"); fetchHistory() }
    else { const d = await res.json(); toast.error(d.error ?? "Deposit failed") }
    setSubmitting(false)
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt < 5000) { toast.error("Minimum withdrawal is TSh 5,000"); return }
    setSubmitting(true)
    const res = await fetch("/api/wallet/withdraw", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phoneNumber: phone, amount: amt }) })
    const d = await res.json()
    if (res.ok) { setWithdrawResult({ status: d.status, message: d.message }); fetchWallet(); fetchHistory() }
    else toast.error(d.error ?? "Withdrawal failed")
    setSubmitting(false)
  }

  function openAction(a: Action) { setAction(a); setAmount(""); setDepositStage("form"); setWithdrawResult(null) }

  function copyAddress() {
    if (wallet?.walletAddress) { navigator.clipboard.writeText(wallet.walletAddress); toast.success("Wallet address copied") }
  }

  /* ── Derived ─────────────────────────────────────────────────────────── */
  const user       = session?.user as { name?: string | null; email?: string | null } | undefined
  const userName   = user?.name ?? user?.email?.split("@")[0] ?? "Member"
  const firstName  = userName.split(" ")[0]
  const hasPending = history.some((t) => t.status === "pending")
  const addr       = wallet?.walletAddress ?? ""
  const last4      = addr ? addr.slice(-4).toUpperCase() : "···"
  const cardNo     = `**** **** **** ${last4}`

  /* ── Tilt transform string ───────────────────────────────────────────── */
  const cardTransform = `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.025 : 1})`
  const cardTransition = hovered && (tilt.x !== 0 || tilt.y !== 0)
    ? "transform 0.08s ease-out, box-shadow 0.3s ease"
    : "transform 0.7s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s ease"

  if (status === "loading" || (loadingWallet && !wallet)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-violet-400/50" />
          <p className="text-xs text-foreground/25 font-mono tracking-widest">Loading wallet…</p>
        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-md space-y-5">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-foreground/35 font-mono">{greeting()},</p>
            <h1 className="text-xl font-bold text-foreground tracking-tight">{firstName}!</h1>
          </div>
          <button
            onClick={() => { fetchWallet(); fetchHistory() }}
            className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-foreground/30 hover:text-foreground/70 hover:border-white/20 transition-all active:scale-90"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            PREMIUM DIGITAL CARD
        ════════════════════════════════════════════════════════════════ */}
        <div
          className="relative w-full rounded-[28px] overflow-hidden cursor-default select-none"
          style={{
            aspectRatio: "1.7 / 1",
            transform: cardTransform,
            transition: cardTransition,
            /* Deep royal purple base — clearly distinct from dark background */
            background: "linear-gradient(140deg, #0e0630 0%, #1c0a52 25%, #230d60 50%, #1a0848 75%, #0d0428 100%)",
            boxShadow: hovered
              ? "0 45px 90px -16px rgba(139,92,246,0.80), 0 0 40px -8px rgba(251,191,36,0.30), 0 0 0 1px rgba(251,191,36,0.22), inset 0 1px 0 rgba(255,255,255,0.10)"
              : "0 30px 65px -14px rgba(109,40,217,0.75), 0 0 0 1px rgba(251,191,36,0.13), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
          onMouseMove={handleCardMouseMove}
          onMouseEnter={handleCardEnter}
          onMouseLeave={handleCardLeave}
        >
          {/* ── Layer 1: Gold aurora — top-right warm glow ── */}
          <div
            className="absolute inset-0 animate-aurora-1"
            style={{ background: "radial-gradient(ellipse at 80% 15%, rgba(251,191,36,0.26) 0%, rgba(245,158,11,0.10) 35%, transparent 60%)" }}
          />
          {/* ── Layer 2: Rose/magenta — left warmth ── */}
          <div
            className="absolute inset-0 animate-aurora-2"
            style={{ background: "radial-gradient(ellipse at 10% 55%, rgba(236,72,153,0.16) 0%, transparent 50%)" }}
          />
          {/* ── Layer 3: Cyan accent — bottom-right cool ── */}
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 90% 85%, rgba(34,211,238,0.10) 0%, transparent 45%)" }}
          />
          {/* ── Layer 4: Top gloss — bright edge ── */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 35%, transparent 55%)" }}
          />
          {/* ── Layer 5: Bottom vignette ── */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.50) 0%, transparent 52%)" }}
          />
          {/* ── Layer 6: Gold left-edge rim light ── */}
          <div
            className="absolute top-0 left-0 bottom-0 w-px"
            style={{ background: "linear-gradient(to bottom, rgba(251,191,36,0.40), rgba(251,191,36,0.12), transparent)" }}
          />
          {/* ── Layer 7: Gold top-edge rim light ── */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(to right, rgba(251,191,36,0.35), rgba(255,255,255,0.15), rgba(251,191,36,0.10))" }}
          />
          {/* ── Layer 8: Fine dot texture ── */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          {/* ── Layer 9: Decorative gold waves — more visible ── */}
          <CardWaves />
          {/* ── Layer 10: Gold shimmer sweep ── */}
          <div
            key={sweeping ? "sweep" : "idle"}
            className={`absolute inset-0 ${sweeping ? "animate-card-sweep" : "opacity-0"}`}
            style={{ background: "linear-gradient(105deg, transparent 22%, rgba(251,191,36,0.12) 45%, rgba(255,255,255,0.08) 50%, rgba(251,191,36,0.10) 55%, transparent 78%)" }}
          />

          {/* ── Card content ── */}
          <div className="relative z-10 h-full flex flex-col justify-between p-5 sm:p-6">

            {/* Row 1: Chip + NFC + brand */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <PremiumChip />
                <NfcWaves />
              </div>
              {/* nTZS wordmark — gold */}
              <div className="text-right">
                <div
                  className="font-black text-[1.2rem] leading-none tracking-wide"
                  style={{
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    color: "#f9d878",
                    textShadow: "0 0 18px rgba(251,191,36,0.55), 0 0 40px rgba(251,191,36,0.25)",
                  }}
                >
                  nTZS
                </div>
                <div className="text-[7px] tracking-[0.32em] mt-[3px] font-mono uppercase" style={{ color: "rgba(251,191,36,0.45)" }}>Digital</div>
              </div>
            </div>

            {/* Row 2: Balance */}
            <div>
              {/* Label + eye toggle */}
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-[8px] tracking-[0.28em] font-mono uppercase" style={{ color: "rgba(251,191,36,0.55)" }}>
                  Available Balance
                </p>
                <button
                  onClick={toggleBalance}
                  className="transition-colors"
                  style={{ color: "rgba(251,191,36,0.35)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(251,191,36,0.70)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(251,191,36,0.35)")}
                  aria-label={balanceVisible ? "Hide balance" : "Show balance"}
                >
                  {balanceVisible
                    ? <Eye className="h-3 w-3" />
                    : <EyeOff className="h-3 w-3" />}
                </button>
              </div>

              {wallet?.balanceTzs === null ? (
                <p className="text-white/25 text-2xl font-black">Unavailable</p>
              ) : wallet ? (
                <p
                  className="font-black leading-none tracking-tight text-white"
                  style={{
                    fontSize: "clamp(1.6rem, 5.8vw, 2.2rem)",
                    textShadow: "0 0 30px rgba(251,191,36,0.25), 0 2px 8px rgba(0,0,0,0.4)",
                  }}
                >
                  {balanceVisible
                    ? formatPrice(wallet.balanceTzs ?? 0)
                    : <span className="tracking-widest">TSh ••••••</span>}
                </p>
              ) : (
                <div className="h-9 w-44 bg-white/10 animate-pulse rounded-lg" />
              )}
            </div>

            {/* Row 3: Cardholder + wallet number */}
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[7px] tracking-[0.28em] font-mono uppercase mb-[3px]" style={{ color: "rgba(251,191,36,0.42)" }}>Cardholder</p>
                <p className="text-white text-[13px] font-semibold tracking-wide truncate" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{userName}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[7px] tracking-[0.28em] font-mono uppercase mb-[3px]" style={{ color: "rgba(251,191,36,0.42)" }}>Wallet No.</p>
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-1.5 text-[10px] font-mono transition-colors"
                  style={{ color: "rgba(255,255,255,0.50)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(251,191,36,0.85)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.50)")}
                >
                  {cardNo}
                  <Copy className="h-2.5 w-2.5 opacity-50" />
                </button>
              </div>
            </div>
          </div>

          {/* Pending pulse badge */}
          {hasPending && (
            <div className="absolute top-3.5 left-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1 border border-amber-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[7px] font-mono text-amber-300/70 tracking-widest uppercase">Syncing</span>
            </div>
          )}
        </div>

        {/* ── Quick Action Tiles ───────────────────────────────────────── */}
        {action === "idle" && (
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: <ArrowDownToLine className="h-[18px] w-[18px]" />, label: "Add Funds",  onClick: () => openAction("deposit"),  tc: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/12 hover:bg-emerald-500/18" },
              { icon: <ArrowUpFromLine className="h-[18px] w-[18px]" />, label: "Withdraw",   onClick: () => openAction("withdraw"), tc: "text-blue-400",    bg: "bg-blue-500/10    border-blue-500/12    hover:bg-blue-500/18"    },
              { icon: <ShoppingBag    className="h-[18px] w-[18px]" />, label: "My Orders",  href: "/orders",                       tc: "text-violet-400",  bg: "bg-violet-500/10  border-violet-500/12  hover:bg-violet-500/18"  },
            ].map((b) => {
              const tile = (
                <div className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all active:scale-95 cursor-pointer ${b.bg}`}>
                  <span className={b.tc}>{b.icon}</span>
                  <span className="text-[10px] font-mono tracking-wide text-foreground/50">{b.label}</span>
                </div>
              )
              return b.href
                ? <Link key={b.label} href={b.href}>{tile}</Link>
                : <button key={b.label} onClick={b.onClick} className="block">{tile}</button>
            })}
          </div>
        )}

        {/* ── Deposit form ────────────────────────────────────────────── */}
        {action === "deposit" && depositStage === "form" && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-foreground/80">Add Funds</p>
              </div>
              <button onClick={() => setAction("idle")} className="text-foreground/25 hover:text-foreground/60 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleDeposit} className="space-y-3">
              <div>
                <label className="text-[9px] font-mono tracking-widest text-foreground/35 block mb-1.5">PHONE NUMBER</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 712 345 678" required
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/18 focus:outline-none focus:border-violet-500/35 focus:bg-white/[0.04] transition-all" />
              </div>
              <div>
                <label className="text-[9px] font-mono tracking-widest text-foreground/35 block mb-1.5">AMOUNT (TZS)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10,000" min={500} required
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/18 focus:outline-none focus:border-violet-500/35 focus:bg-white/[0.04] transition-all" />
                <p className="text-[9px] font-mono text-foreground/22 mt-1">Minimum TSh 500</p>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-45">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Initiating…</> : <><Smartphone className="h-4 w-4" /> Send Mobile Prompt</>}
              </button>
            </form>
          </div>
        )}

        {action === "deposit" && depositStage === "pending" && (
          <div className="rounded-2xl border border-amber-500/12 bg-amber-500/[0.03] p-6 text-center space-y-3">
            <div className="relative mx-auto w-12 h-12">
              <span className="absolute inset-0 rounded-full border border-amber-400/20 animate-ping" />
              <div className="w-12 h-12 rounded-full bg-amber-500/12 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <p className="font-semibold text-foreground/75">Check your phone</p>
            <p className="text-sm text-foreground/40">Approve the M-Pesa prompt on <span className="text-foreground/65">{phone}</span></p>
            <div className="flex items-center justify-center gap-1.5 text-[9px] font-mono text-amber-400/50">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50 animate-pulse" />
              Auto-updating when confirmed
            </div>
            <button onClick={() => { setDepositStage("done"); setAction("idle"); fetchWallet(); fetchHistory() }}
              className="flex items-center justify-center gap-1.5 mx-auto text-sm text-foreground/35 hover:text-foreground/70 transition-colors mt-1">
              <CheckCircle2 className="h-4 w-4" /> I've approved — refresh
            </button>
          </div>
        )}

        {/* ── Withdraw form ───────────────────────────────────────────── */}
        {action === "withdraw" && !withdrawResult && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center">
                  <ArrowUpFromLine className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-foreground/80">Withdraw Funds</p>
              </div>
              <button onClick={() => setAction("idle")} className="text-foreground/25 hover:text-foreground/60 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <label className="text-[9px] font-mono tracking-widest text-foreground/35 block mb-1.5">PHONE NUMBER</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 712 345 678" required
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/18 focus:outline-none focus:border-violet-500/35 focus:bg-white/[0.04] transition-all" />
              </div>
              <div>
                <label className="text-[9px] font-mono tracking-widest text-foreground/35 block mb-1.5">AMOUNT (TZS)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5,000" min={5000} required
                  className="w-full bg-white/5 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/18 focus:outline-none focus:border-violet-500/35 focus:bg-white/[0.04] transition-all" />
                <p className="text-[9px] font-mono text-foreground/22 mt-1">Minimum TSh 5,000</p>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-45">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : <><ArrowUpFromLine className="h-4 w-4" /> Withdraw Funds</>}
              </button>
            </form>
          </div>
        )}

        {action === "withdraw" && withdrawResult && (
          <div className={`rounded-2xl border p-6 text-center space-y-3 ${withdrawResult.status === "burned" ? "border-emerald-500/12 bg-emerald-500/[0.025]" : "border-violet-500/12 bg-violet-500/[0.025]"}`}>
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${withdrawResult.status === "burned" ? "bg-emerald-500/10" : "bg-violet-500/10"}`}>
              <CheckCircle2 className={`h-6 w-6 ${withdrawResult.status === "burned" ? "text-emerald-400" : "text-violet-400"}`} />
            </div>
            <p className="font-semibold text-foreground/75">{withdrawResult.status === "burned" ? "Withdrawal Processed" : "Withdrawal Requested"}</p>
            <p className="text-sm text-foreground/40">{withdrawResult.message}</p>
            <button onClick={() => setAction("idle")} className="text-sm text-foreground/30 hover:text-foreground/65 transition-colors">Close</button>
          </div>
        )}

        {/* ── Transaction History ──────────────────────────────────────── */}
        <div className="space-y-3 pb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground/65">Recent Transactions</h2>
            {loadingHistory && <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground/25" />}
          </div>

          {!loadingHistory && history.length === 0 ? (
            <div className="rounded-2xl border border-white/7 bg-white/[0.012] px-4 py-10 text-center">
              <Clock className="h-6 w-6 text-foreground/12 mx-auto mb-2.5" />
              <p className="text-sm text-foreground/25">No transactions yet</p>
              <p className="text-xs text-foreground/18 mt-1">Add funds to get started</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/7 bg-white/[0.012] divide-y divide-white/[0.045] overflow-hidden">
              {history.map((tx) => {
                const cfg      = typeConfig[tx.type]
                const Icon     = cfg.icon
                const isPending = tx.status === "pending"
                const ss       = statusStyle[tx.status] ?? { pill: "bg-white/5 text-foreground/30 border-white/10", label: tx.status }
                const isCredit = tx.type === "deposit" || tx.type === "incoming"

                return (
                  <div key={tx.id}
                    className={`flex items-center gap-3.5 px-4 py-4 transition-colors hover:bg-white/[0.018] ${isPending ? "bg-amber-500/[0.025]" : ""}`}
                  >
                    {/* Icon bubble */}
                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center relative ${cfg.bg}`}>
                      {isPending && <span className="absolute inset-0 rounded-full border border-amber-400/25 animate-ping" />}
                      <Icon className={`h-4 w-4 ${isPending ? "text-amber-400" : cfg.color}`} />
                    </div>
                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground/72 truncate font-medium leading-tight">
                        {tx.description ?? cfg.label}
                      </p>
                      <p className="text-[10px] text-foreground/28 mt-0.5 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        {tx.phoneNumber && ` · ${tx.phoneNumber}`}
                      </p>
                    </div>
                    {/* Amount + status */}
                    <div className="text-right flex-shrink-0 space-y-[5px]">
                      <p className={`text-[13px] font-bold font-mono ${isCredit ? "text-emerald-400" : "text-foreground/60"}`}>
                        {cfg.sign}{formatPrice(tx.amountTzs)}
                      </p>
                      <span className={`inline-flex text-[8px] border px-1.5 py-0.5 rounded-full font-mono tracking-wide ${ss.pill}`}>
                        {ss.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
