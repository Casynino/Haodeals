"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Wallet, Copy, RefreshCw, Smartphone, Loader2, CheckCircle2,
  ArrowDownToLine, ArrowUpFromLine, ShoppingBag, Clock, ArrowLeftRight,
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
  deposit:    { label: "DEPOSIT",    icon: ArrowDownToLine, color: "text-green-400/70",  sign: "+" },
  withdrawal: { label: "WITHDRAWAL", icon: ArrowUpFromLine,  color: "text-red-400/70",   sign: "-" },
  purchase:   { label: "PURCHASE",   icon: ShoppingBag,      color: "text-blue-400/70",  sign: "-" },
  incoming:   { label: "RECEIVED",   icon: ArrowLeftRight,   color: "text-green-400/70", sign: "+" },
}

const statusColor: Record<string, string> = {
  completed:         "text-green-400/60 border-green-400/20",
  confirmed:         "text-green-400/60 border-green-400/20",
  payment_confirmed: "text-green-400/60 border-green-400/20",
  packaging:         "text-yellow-400/60 border-yellow-400/20",
  in_transit:        "text-purple-400/60 border-purple-400/20",
  delivered:         "text-green-400/60 border-green-400/20",
  pending:           "text-yellow-400/60 border-yellow-400/20",
  burned:            "text-green-400/60 border-green-400/20",
  requested:         "text-purple-400/60 border-purple-400/20",
  failed:            "text-red-400/60 border-red-400/20",
  shipped:           "text-blue-400/60 border-blue-400/20",
  processing:        "text-blue-400/60 border-blue-400/20",
  refunded:          "text-orange-400/60 border-orange-400/20",
}

const statusLabel: Record<string, string> = {
  completed:         "CONFIRMED",
  confirmed:         "CONFIRMED",
  payment_confirmed: "RECEIVED",
  packaging:         "PACKAGING",
  in_transit:        "IN TRANSIT",
  delivered:         "DELIVERED",
  pending:           "PENDING",
  burned:            "PROCESSED",
  requested:         "REQUESTED",
  failed:            "FAILED",
  shipped:           "SHIPPED",
  processing:        "PROCESSING",
  refunded:          "REFUNDED",
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

  // ── Auto-poll: fires when any transaction is "pending" ──────────────────────
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
        // Check if any previously-pending tx is now resolved
        const prevPending = prev.filter((t) => t.status === "pending")
        const resolved = prevPending.filter((p) => {
          const now = fresh.find((f) => f.id === p.id)
          return now && now.status !== "pending"
        })
        if (resolved.length > 0) {
          // Refresh balance too
          fetch("/api/wallet").then((r) => r.ok ? r.json() : null).then((d) => { if (d) setWallet(d) })
          resolved.forEach((tx) => {
            const updated = fresh.find((f) => f.id === tx.id)!
            const label   = updated.status === "completed" || updated.status === "confirmed" ? "✓ Confirmed" : updated.status.toUpperCase()
            toast.success(`Transaction ${label}`, {
              description: tx.description ?? typeConfig[tx.type].label,
              className: "font-mono text-xs",
            })
          })
        }
        return fresh
      })

      // Stop polling once nothing is pending
      const stillPending = fresh.some((t) => t.status === "pending")
      if (!stillPending) clearPoll()
    }, 3000)
  }

  // Start / stop polling based on whether any pending tx exists
  useEffect(() => {
    const hasPending = history.some((t) => t.status === "pending")
    if (hasPending) startPoll()
    else clearPoll()
    return clearPoll
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history])

  // ── Auth redirect ────────────────────────────────────────────────────────────
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
    } finally {
      setLoadingWallet(false)
    }
  }

  async function fetchHistory() {
    setLoadingHistory(true)
    try {
      const res = await fetch("/api/wallet/transactions")
      if (res.ok) setHistory(await res.json())
    } finally {
      setLoadingHistory(false)
    }
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt < 500) {
      toast.error("MINIMUM DEPOSIT IS TSh 500", { className: "font-mono text-xs" }); return
    }
    setSubmitting(true)
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phone, amount: amt }),
    })
    if (res.ok) {
      setDepositStage("pending")
      // Refresh history so the new pending tx enters the polling loop
      fetchHistory()
    } else {
      const d = await res.json()
      toast.error(d.error ?? "DEPOSIT FAILED", { className: "font-mono text-xs" })
    }
    setSubmitting(false)
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt < 5000) {
      toast.error("MINIMUM WITHDRAWAL IS TSh 5,000", { className: "font-mono text-xs" }); return
    }
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
      toast.error(d.error ?? "WITHDRAWAL FAILED", { className: "font-mono text-xs" })
    }
    setSubmitting(false)
  }

  function openAction(a: Action) {
    setAction(a); setAmount(""); setDepositStage("form"); setWithdrawResult(null)
  }

  function copyAddress() {
    if (wallet?.walletAddress) {
      navigator.clipboard.writeText(wallet.walletAddress)
      toast.success("ADDRESS COPIED", { className: "font-mono text-xs" })
    }
  }

  if (status === "loading" || loadingWallet) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center font-mono">
        <div className="flex items-center gap-2 text-foreground/30 text-[10px]">
          <Loader2 className="h-3 w-3 animate-spin" /> LOADING.WALLET...
        </div>
      </div>
    )
  }

  // Whether any tx is still pending (drives the live indicator in the header)
  const hasPending = history.some((t) => t.status === "pending")

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl font-mono space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/30 text-[10px]">//</span>
          <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">WALLET.TERMINAL</h1>
          {hasPending && (
            <span className="flex items-center gap-1 text-[8px] text-yellow-400/60">
              <span className="w-1 h-1 bg-yellow-400/60 rounded-full animate-pulse" />
              SYNCING
            </span>
          )}
        </div>
        <button
          onClick={() => { fetchWallet(); fetchHistory() }}
          className="flex items-center gap-1 text-[9px] text-foreground/30 hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-2.5 w-2.5" /> REFRESH
        </button>
      </div>

      {/* Balance card */}
      <div className="border border-foreground/15 p-5 relative">
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-foreground/20" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-foreground/20" />

        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-3.5 w-3.5 text-foreground/30" />
          <p className="text-[9px] tracking-widest text-foreground/40">// NTZS.WALLET</p>
          <div className="ml-auto flex items-center gap-1 text-[8px] text-green-400/60">
            <span className="w-1 h-1 bg-green-400/60 rounded-full animate-pulse" />
            BASE.MAINNET
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[8px] tracking-widest text-foreground/30 mb-1">BALANCE</p>
          {wallet?.balanceTzs === null ? (
            <p className="text-2xl font-black text-foreground/30">UNAVAILABLE</p>
          ) : wallet?.balanceTzs !== undefined ? (
            <p className="text-2xl font-black text-green-400/80">
              {formatPrice(wallet.balanceTzs ?? 0)}
              <span className="text-[10px] text-foreground/30 ml-2 font-normal">nTZS</span>
            </p>
          ) : (
            <div className="h-8 w-40 bg-foreground/10 animate-pulse" />
          )}
          {wallet?.balanceUsdc != null && (
            <p className="text-[9px] text-foreground/30 mt-0.5">USDC {wallet.balanceUsdc.toFixed(2)}</p>
          )}
        </div>

        {wallet?.walletAddress && (
          <div className="flex items-center gap-2 pt-3 border-t border-foreground/10">
            <p className="text-[8px] text-foreground/25 tracking-widest">ADDR</p>
            <span className="text-[9px] text-foreground/40 flex-1 font-mono">
              {wallet.walletAddress.slice(0, 8)}...{wallet.walletAddress.slice(-6)}
            </span>
            <button onClick={copyAddress} className="text-foreground/25 hover:text-foreground transition-colors">
              <Copy className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {action === "idle" && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => openAction("deposit")}
            className="flex items-center justify-center gap-2 py-3 border border-foreground/20 text-[10px] tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/40 hover:bg-foreground/5 transition-colors">
            <ArrowDownToLine className="h-3.5 w-3.5" /> DEPOSIT
          </button>
          <button onClick={() => openAction("withdraw")}
            className="flex items-center justify-center gap-2 py-3 border border-foreground/20 text-[10px] tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/40 hover:bg-foreground/5 transition-colors">
            <ArrowUpFromLine className="h-3.5 w-3.5" /> WITHDRAW
          </button>
        </div>
      )}

      {/* Deposit flow */}
      {action === "deposit" && depositStage === "form" && (
        <form onSubmit={handleDeposit} className="border border-foreground/15 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="h-3 w-3 text-foreground/30" />
            <p className="text-[9px] tracking-widest text-foreground/40">// DEPOSIT.VIA.MOBILE.MONEY</p>
            <button type="button" onClick={() => setAction("idle")} className="ml-auto text-[8px] text-foreground/30 hover:text-foreground">CANCEL</button>
          </div>
          <div>
            <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">PHONE.NUMBER</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 712 345 678" required
              className="w-full bg-transparent border border-foreground/15 px-3 py-2 text-[10px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors" />
          </div>
          <div>
            <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">AMOUNT (TZS)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000" min={500} required
              className="w-full bg-transparent border border-foreground/15 px-3 py-2 text-[10px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors" />
            <p className="text-[8px] text-foreground/20 mt-1">MIN. TSh 500</p>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background text-[10px] tracking-widest font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50">
            {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> INITIATING...</> : <><Smartphone className="h-3.5 w-3.5" /> SEND.PROMPT</>}
          </button>
        </form>
      )}

      {action === "deposit" && depositStage === "pending" && (
        <div className="border border-foreground/15 p-6 text-center space-y-3">
          <div className="relative mx-auto w-8 h-8 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-yellow-400/20 animate-ping" />
            <Smartphone className="h-4 w-4 text-yellow-400/50" />
          </div>
          <p className="text-[9px] tracking-widest text-foreground/50">AWAITING.PAYMENT</p>
          <p className="text-sm font-bold">CHECK.YOUR.PHONE</p>
          <p className="text-[10px] text-foreground/40">
            APPROVE THE PROMPT ON <span className="text-foreground">{phone}</span>
          </p>
          <p className="text-[8px] text-yellow-400/50 flex items-center justify-center gap-1">
            <span className="w-1 h-1 bg-yellow-400/50 rounded-full animate-pulse" />
            Auto-updating when confirmed
          </p>
          <button
            onClick={() => { setDepositStage("done"); setAction("idle"); fetchWallet(); fetchHistory() }}
            className="flex items-center justify-center gap-1.5 mx-auto text-[9px] text-foreground/40 hover:text-foreground transition-colors"
          >
            <CheckCircle2 className="h-3 w-3" /> I&apos;VE APPROVED — REFRESH
          </button>
        </div>
      )}

      {/* Withdraw flow */}
      {action === "withdraw" && !withdrawResult && (
        <form onSubmit={handleWithdraw} className="border border-foreground/15 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ArrowUpFromLine className="h-3 w-3 text-foreground/30" />
            <p className="text-[9px] tracking-widest text-foreground/40">// WITHDRAW.TO.MOBILE.MONEY</p>
            <button type="button" onClick={() => setAction("idle")} className="ml-auto text-[8px] text-foreground/30 hover:text-foreground">CANCEL</button>
          </div>
          <div>
            <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">PHONE.NUMBER</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 712 345 678" required
              className="w-full bg-transparent border border-foreground/15 px-3 py-2 text-[10px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors" />
          </div>
          <div>
            <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">AMOUNT (TZS)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" min={5000} required
              className="w-full bg-transparent border border-foreground/15 px-3 py-2 text-[10px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors" />
            <p className="text-[8px] text-foreground/20 mt-1">MIN. TSh 5,000 · AMOUNTS ≥ TSh 1,000,000 REQUIRE APPROVAL</p>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background text-[10px] tracking-widest font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50">
            {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> PROCESSING...</> : <><ArrowUpFromLine className="h-3.5 w-3.5" /> WITHDRAW.FUNDS</>}
          </button>
        </form>
      )}

      {action === "withdraw" && withdrawResult && (
        <div className={`border p-5 text-center space-y-2 ${withdrawResult.status === "burned" ? "border-green-400/20" : "border-purple-400/20"}`}>
          <CheckCircle2 className={`h-6 w-6 mx-auto ${withdrawResult.status === "burned" ? "text-green-400/70" : "text-purple-400/70"}`} />
          <p className="text-[9px] tracking-widest text-foreground/50">
            {withdrawResult.status === "burned" ? "WITHDRAWAL.PROCESSED" : "WITHDRAWAL.REQUESTED"}
          </p>
          <p className="text-[10px] text-foreground/40">{withdrawResult.message}</p>
          <button onClick={() => setAction("idle")} className="text-[8px] text-foreground/30 hover:text-foreground mt-1 transition-colors">CLOSE</button>
        </div>
      )}

      {/* Transaction history */}
      <div className="border border-foreground/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
          <p className="text-[9px] tracking-widest text-foreground/40">// TRANSACTION.HISTORY</p>
          {loadingHistory && <Loader2 className="h-3 w-3 animate-spin text-foreground/30" />}
        </div>

        {!loadingHistory && history.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Clock className="h-5 w-5 text-foreground/15 mx-auto mb-2" />
            <p className="text-[9px] text-foreground/25 tracking-widest">NO.TRANSACTIONS.YET</p>
          </div>
        ) : (
          <div className="divide-y divide-foreground/5">
            {history.map((tx) => {
              const cfg  = typeConfig[tx.type]
              const Icon = cfg.icon
              const isPending = tx.status === "pending"

              return (
                <div key={tx.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${isPending ? "bg-yellow-400/[0.02]" : ""}`}>
                  {/* Icon */}
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 relative">
                    {isPending && (
                      <span className="absolute inset-0 rounded-full border border-yellow-400/20 animate-ping" />
                    )}
                    <Icon className={`h-3.5 w-3.5 ${isPending ? "text-yellow-400/60" : cfg.color}`} />
                  </div>

                  {/* Description + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-foreground/70 truncate">
                      {tx.description ?? cfg.label}
                    </p>
                    <p className="text-[8px] text-foreground/25 mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      {tx.phoneNumber && ` · ${tx.phoneNumber}`}
                    </p>
                  </div>

                  {/* Amount + status */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-[11px] font-mono font-bold ${tx.type === "deposit" || tx.type === "incoming" ? "text-green-400/80" : "text-foreground/60"}`}>
                      {cfg.sign}{formatPrice(tx.amountTzs)}
                    </p>
                    <span className={`text-[7px] border px-1 py-0.5 tracking-widest ${statusColor[tx.status] ?? "text-foreground/30 border-foreground/15"}`}>
                      {statusLabel[tx.status] ?? tx.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
