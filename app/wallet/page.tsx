"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Wallet, Copy, RefreshCw, Smartphone, Loader2, CheckCircle2, ArrowDownToLine } from "lucide-react"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"

interface WalletData {
  ntzsUserId: string
  walletAddress: string | null
  balances: { ntzs: string; usdc: number } | null
}

type DepositStage = "idle" | "form" | "pending" | "done"

export default function WalletPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [depositStage, setDepositStage] = useState<DepositStage>("idle")
  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/wallet")
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      const u = session.user as { phone?: string | null }
      if (u.phone) setPhone(u.phone)
      fetchWallet()
    }
  }, [session])

  async function fetchWallet() {
    setLoading(true)
    try {
      const res = await fetch("/api/wallet")
      if (res.ok) setWallet(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt < 500) {
      toast.error("MINIMUM DEPOSIT IS TSh 500", { className: "font-mono text-xs" })
      return
    }
    setSubmitting(true)
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phone, amount: amt }),
    })
    if (res.ok) {
      setDepositStage("pending")
    } else {
      const d = await res.json()
      toast.error(d.error ?? "DEPOSIT FAILED", { className: "font-mono text-xs" })
    }
    setSubmitting(false)
  }

  function copyAddress() {
    if (wallet?.walletAddress) {
      navigator.clipboard.writeText(wallet.walletAddress)
      toast.success("ADDRESS COPIED", { className: "font-mono text-xs" })
    }
  }

  const ntzsBalance = wallet?.balances
    ? parseFloat(wallet.balances.ntzs) / 1e18
    : null

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center font-mono">
        <div className="flex items-center gap-2 text-foreground/30 text-[10px]">
          <Loader2 className="h-3 w-3 animate-spin" />
          LOADING.WALLET...
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-foreground/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/30 text-[10px]">//</span>
          <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">WALLET.TERMINAL</h1>
        </div>
        <button
          onClick={fetchWallet}
          className="flex items-center gap-1 text-[9px] text-foreground/30 hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-2.5 w-2.5" /> REFRESH
        </button>
      </div>

      {/* Balance card */}
      <div className="border border-foreground/15 p-6 mb-4 relative">
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

        {/* Balance */}
        <div className="mb-5">
          <p className="text-[8px] tracking-widest text-foreground/30 mb-1">NTZS.BALANCE</p>
          {wallet?.balances === null ? (
            <p className="text-2xl font-black text-foreground/30">UNAVAILABLE</p>
          ) : ntzsBalance !== null ? (
            <p className="text-2xl font-black text-green-400/80">
              {formatPrice(ntzsBalance)}
              <span className="text-[10px] text-foreground/30 ml-2 font-normal">nTZS</span>
            </p>
          ) : (
            <div className="h-8 w-40 bg-foreground/10 animate-pulse" />
          )}
          {wallet?.balances && (
            <p className="text-[9px] text-foreground/30 mt-1">
              USDC: {wallet.balances.usdc.toFixed(2)}
            </p>
          )}
        </div>

        {/* Wallet address */}
        {wallet?.walletAddress && (
          <div>
            <p className="text-[8px] tracking-widest text-foreground/30 mb-1">WALLET.ADDRESS</p>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-foreground/50 font-mono break-all">
                {wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)}
              </span>
              <button onClick={copyAddress} className="text-foreground/30 hover:text-foreground transition-colors flex-shrink-0">
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deposit section */}
      {depositStage === "idle" && (
        <button
          onClick={() => setDepositStage("form")}
          className="w-full flex items-center justify-center gap-2 py-3 border border-foreground/20 text-[10px] tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/40 hover:bg-foreground/5 transition-colors mb-4"
        >
          <ArrowDownToLine className="h-3.5 w-3.5" /> DEPOSIT.FUNDS
        </button>
      )}

      {depositStage === "form" && (
        <form onSubmit={handleDeposit} className="border border-foreground/15 p-5 space-y-4 mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-3 w-3 text-foreground/30" />
            <p className="text-[9px] tracking-widest text-foreground/40">// DEPOSIT.VIA.MOBILE.MONEY</p>
            <button
              type="button"
              onClick={() => setDepositStage("idle")}
              className="ml-auto text-[8px] text-foreground/30 hover:text-foreground transition-colors"
            >
              CANCEL
            </button>
          </div>

          <div>
            <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">PHONE.NUMBER</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+255 712 345 678"
              required
              className="w-full bg-transparent border border-foreground/15 px-3 py-2 text-[10px] tracking-wide text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
            />
          </div>

          <div>
            <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">AMOUNT (TZS)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              min={500}
              required
              className="w-full bg-transparent border border-foreground/15 px-3 py-2 text-[10px] tracking-wide text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
            />
            <p className="text-[8px] text-foreground/20 mt-1">MIN. TSh 500</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background text-[10px] tracking-widest font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {submitting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> INITIATING...</>
              : <><Smartphone className="h-3.5 w-3.5" /> SEND.PROMPT</>}
          </button>
        </form>
      )}

      {depositStage === "pending" && (
        <div className="border border-foreground/15 p-6 text-center space-y-3 mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-foreground/40 mx-auto" />
          <p className="text-[9px] tracking-widest text-foreground/50">AWAITING.PAYMENT</p>
          <p className="text-sm font-bold">CHECK.YOUR.PHONE</p>
          <p className="text-[10px] text-foreground/40">
            APPROVE THE PROMPT ON <span className="text-foreground">{phone}</span>
          </p>
          <button
            onClick={() => { setDepositStage("done"); fetchWallet() }}
            className="flex items-center justify-center gap-1.5 mx-auto text-[9px] text-foreground/40 hover:text-foreground transition-colors"
          >
            <CheckCircle2 className="h-3 w-3" /> I&apos;VE APPROVED — REFRESH BALANCE
          </button>
        </div>
      )}

      {depositStage === "done" && (
        <div className="border border-green-400/20 p-4 text-center mb-4">
          <p className="text-[9px] tracking-widest text-green-400/70">DEPOSIT.PROCESSED</p>
          <button
            onClick={() => setDepositStage("idle")}
            className="text-[8px] text-foreground/30 hover:text-foreground mt-1 transition-colors"
          >
            MAKE ANOTHER DEPOSIT
          </button>
        </div>
      )}

      {/* Info */}
      <div className="border border-foreground/10 p-4 space-y-2">
        <p className="text-[8px] tracking-widest text-foreground/30">// WALLET.INFO</p>
        <div className="space-y-1 text-[9px] text-foreground/40">
          <p>· nTZS is a digital shilling pegged 1:1 to TZS, running on Base blockchain</p>
          <p>· Deposit via M-Pesa, Airtel Money, Tigopesa, or Halopesa</p>
          <p>· Your wallet balance can be used at checkout instead of re-entering your phone</p>
        </div>
      </div>
    </div>
  )
}
