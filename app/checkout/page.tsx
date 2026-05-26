"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCart } from "@/hooks/useCart"
import {
  ShieldCheck, Truck, Wallet, CheckCircle2,
  Loader2, AlertCircle, Tag, X,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"

type Stage = "form" | "confirmed"

interface DiscountCode { id: string; code: string; percent: number; expiresAt: string }

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, total, clearCart } = useCart()

  const [stage, setStage]               = useState<Stage>("form")
  const [loading, setLoading]           = useState(false)
  const [orderId, setOrderId]           = useState<string | null>(null)
  const [trackingId, setTrackingId]     = useState<string | null>(null)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)

  // Promo code state
  const [promoInput, setPromoInput]       = useState("")
  const [promoLoading, setPromoLoading]   = useState(false)
  const [appliedCode, setAppliedCode]     = useState<DiscountCode | null>(null)

  const [form, setForm] = useState({ fullName: "", email: "", address: "", city: "" })

  useEffect(() => {
    if (session?.user) {
      const u = session.user as { name?: string; email?: string }
      setForm((f) => ({ ...f, fullName: u.name ?? "", email: u.email ?? "" }))
    }
  }, [session])

  useEffect(() => {
    if (session?.user) {
      fetch("/api/wallet").then(r => r.ok ? r.json() : null).then(d => {
        if (d) setWalletBalance(d.balanceTzs ?? 0)
      })
    }
  }, [session])

  const cartSubtotal = total()
  const discountAmt  = appliedCode ? Math.round(cartSubtotal * appliedCode.percent / 100) : 0
  const finalTotal   = cartSubtotal - discountAmt

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function applyPromo() {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    try {
      const res = await fetch(`/api/discounts?code=${encodeURIComponent(promoInput.trim().toUpperCase())}`)
      if (res.ok) {
        const data: DiscountCode = await res.json()
        setAppliedCode(data)
        toast.success(`${data.percent}% discount applied!`)
        setPromoInput("")
      } else {
        toast.error("Invalid or expired promo code")
      }
    } catch {
      toast.error("Could not validate code")
    } finally {
      setPromoLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session) {
      toast.error("Please sign in to continue")
      router.push("/login?callbackUrl=/checkout")
      return
    }
    setLoading(true)
    setBalanceError(null)

    const address = `${form.address}, ${form.city}`
    const res = await fetch("/api/checkout/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        items: items.map((i) => ({ productId: i.productId ?? i.id, quantity: i.quantity })),
        discountCodeId: appliedCode?.id ?? null,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      clearCart()
      setOrderId(data.orderId)
      setTrackingId(data.trackingId)
      setStage("confirmed")
    } else if (data.code === "insufficient_balance") {
      setBalanceError(data.error)
    } else {
      toast.error(data.error ?? "Payment failed. Please try again.")
    }
    setLoading(false)
  }

  /* ── Order confirmed screen ── */
  if (stage === "confirmed") {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-6 text-center font-mono max-w-sm">
        {/* Success icon */}
        <div className="relative">
          <div className="w-20 h-20 border border-green-400/30 flex items-center justify-center bg-green-400/5">
            <CheckCircle2 className="h-9 w-9 text-green-400/70" />
          </div>
          {/* Glow rings */}
          <div className="absolute inset-0 border border-green-400/15 scale-125 animate-ping opacity-30" />
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-black tracking-widest">Order Confirmed!</h1>
          <p className="text-[10px] text-foreground/45 leading-relaxed">
            Great news! We have received your payment and your order is confirmed.
            We'll start packaging it right away.
          </p>
        </div>

        {trackingId && (
          <div className="w-full border border-white/10 px-4 py-3 text-center">
            <p className="text-[8px] tracking-widest text-foreground/30 mb-1">YOUR TRACKING NUMBER</p>
            <p className="text-base font-black tracking-widest" style={{ color: "#ee0000" }}>
              {trackingId}
            </p>
          </div>
        )}

        <p className="text-[9px] text-foreground/35">
          We'll email you updates at every stage of your delivery.
        </p>

        <div className="flex gap-3 w-full">
          <Link
            href={`/orders/${orderId}`}
            className="flex-1 py-2.5 bg-foreground text-background text-[10px] tracking-widest font-bold text-center hover:bg-foreground/90 transition-colors"
          >
            Track Order
          </Link>
          <Link
            href="/products"
            className="flex-1 py-2.5 border border-foreground/20 text-foreground/55 text-[10px] tracking-widest text-center hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            Keep Shopping
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center font-mono">
        <p className="text-[11px] tracking-widest text-foreground/40 mb-4">Your cart is empty</p>
        <Link href="/products" className="px-4 py-2 text-[10px] tracking-widest border border-foreground/20 text-foreground/55 hover:text-foreground hover:border-foreground/40 transition-colors">
          Browse deals
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8 max-w-6xl font-mono">
      <div className="flex items-center gap-3 mb-6 border-b border-foreground/10 pb-4">
        <span className="text-foreground/45 text-xs">//</span>
        <h1 className="text-lg font-semibold tracking-[0.2em] text-foreground/90">CHECKOUT</h1>
      </div>

      <form id="checkout-form" onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Shipping + Payment */}
          <div className="lg:col-span-2 space-y-4">
            {/* Shipping */}
            <div className="border border-foreground/10 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-foreground/55" />
                <p className="text-xs tracking-widest text-foreground/65 font-medium">DELIVERY INFORMATION</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "fullName", label: "Full Name",      placeholder: "John Doe",       colSpan: "col-span-2" },
                  { name: "email",    label: "Email Address",  placeholder: "you@email.com",  type: "email", colSpan: "col-span-2" },
                  { name: "address",  label: "Street Address", placeholder: "123 Main Street", colSpan: "col-span-2" },
                  { name: "city",     label: "City / Region",  placeholder: "Dar es Salaam",  colSpan: "col-span-2" },
                ].map((field) => (
                  <div key={field.name} className={field.colSpan}>
                    <label className="text-[10px] tracking-widest text-foreground/55 block mb-1.5">{field.label}</label>
                    <input
                      type={field.type ?? "text"}
                      name={field.name}
                      value={form[field.name as keyof typeof form]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required
                      className="w-full bg-transparent border border-foreground/18 px-3 py-2.5 text-xs text-foreground/85 placeholder:text-foreground/30 focus:outline-none focus:border-foreground/45 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Promo code */}
            <div className="border border-foreground/10 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-foreground/55" />
                <p className="text-xs tracking-widest text-foreground/65 font-medium">PROMO CODE</p>
              </div>
              {appliedCode ? (
                <div className="flex items-center justify-between border border-green-400/25 bg-green-400/[0.04] px-3 py-2">
                  <div>
                    <p className="text-[10px] font-bold text-green-400/80 font-mono tracking-wider">{appliedCode.code}</p>
                    <p className="text-[8px] text-green-400/50 mt-0.5">{appliedCode.percent}% off applied — saving {formatPrice(discountAmt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAppliedCode(null)}
                    className="text-foreground/30 hover:text-foreground/60 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter promo code"
                    className="flex-1 bg-transparent border border-foreground/15 px-3 py-2 text-[10px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors uppercase"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                  />
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="px-4 border border-foreground/20 text-[9px] text-foreground/55 hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-40"
                  >
                    {promoLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                  </button>
                </div>
              )}
            </div>

            {/* Wallet Payment */}
            <div className="border border-foreground/10 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-3 w-3 text-foreground/30" />
                <p className="text-[9px] tracking-widest text-foreground/40">NTZS WALLET PAYMENT</p>
                <span className="ml-auto flex items-center gap-1 text-[8px] text-green-400/60">
                  <span className="w-1 h-1 bg-green-400/60 rounded-full animate-pulse" />
                  POWERED BY nTZS
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border border-foreground/10 px-3">
                <span className="text-[10px] tracking-widest text-foreground/55">WALLET BALANCE</span>
                <span className={`text-sm font-mono font-bold ${walletBalance !== null && walletBalance >= finalTotal ? "text-green-400" : "text-red-400/80"}`}>
                  {walletBalance !== null ? formatPrice(walletBalance) : "—"}
                </span>
              </div>
              {balanceError && (
                <div className="flex items-start gap-2 p-3 border border-red-400/20 bg-red-400/5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-400/70 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[9px] text-red-400/80">{balanceError}</p>
                    <Link href="/wallet" className="text-[8px] text-foreground/50 hover:text-foreground underline underline-offset-2 transition-colors">
                      Top up wallet →
                    </Link>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[8px] text-foreground/20">
                <ShieldCheck className="h-2.5 w-2.5" />
                Instant on-chain transfer · Base Blockchain
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="hidden lg:block">
            <div className="border border-foreground/10 p-5 space-y-4 sticky top-24">
              <p className="text-xs tracking-widest text-foreground/65 font-semibold">ORDER SUMMARY</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <div className="relative w-12 h-12 overflow-hidden bg-foreground/5 border border-foreground/10 flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover opacity-70" />
                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-foreground text-background text-[8px]">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-foreground/60 truncate">{item.name}</p>
                      <p className="text-[10px] text-green-400/80">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-foreground/10 pt-3 space-y-2 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-foreground/40">Subtotal</span>
                  <span className="text-foreground/60">{formatPrice(cartSubtotal)}</span>
                </div>
                {appliedCode && (
                  <div className="flex justify-between">
                    <span className="text-green-400/60">Discount ({appliedCode.percent}%)</span>
                    <span className="text-green-400/70">−{formatPrice(discountAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-foreground/10 pt-2">
                  <span className="text-foreground/55 font-bold">Total</span>
                  <span className="text-green-400/80 font-mono font-bold">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background text-[10px] tracking-widest font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
                  : <><Wallet className="h-3.5 w-3.5" /> Pay {formatPrice(finalTotal)}</>}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-foreground/15 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[8px] tracking-widest text-foreground/30">TOTAL</p>
            <p className="text-green-400/80 font-mono text-sm font-bold">{formatPrice(finalTotal)}</p>
            {appliedCode && (
              <p className="text-[8px] text-green-400/55">You save {formatPrice(discountAmt)}</p>
            )}
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-foreground text-background text-[10px] tracking-widest font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
              : <><Wallet className="h-3.5 w-3.5" /> Pay now</>}
          </button>
        </div>
      </div>
    </div>
  )
}
