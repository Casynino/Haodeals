"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCart } from "@/hooks/useCart"
import {
  ShieldCheck, Wallet, CheckCircle2,
  Loader2, AlertCircle, Tag, X, MapPin, Phone,
  Zap, Calendar, Info,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { HaoPlusBanner } from "@/components/HaoPlusBanner"

type Stage = "form" | "confirmed"
type DeliveryMethod = "bolt" | "free_weekend"

interface DiscountCode { id: string; code: string; percent: number; expiresAt: string }
interface SavedProfile { name?: string | null; phone?: string | null; address?: string | null }

const BOLT_FEE = 3500 // TSh

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

  // Promo code
  const [promoInput, setPromoInput]   = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [appliedCode, setAppliedCode] = useState<DiscountCode | null>(null)

  // Delivery
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("bolt")

  // Address form
  const [form, setForm] = useState({ fullName: "", phone: "", street: "", city: "" })
  const [saveAddress, setSaveAddress] = useState(false)
  const [hasSavedAddress, setHasSavedAddress] = useState(false)
  const [useSaved, setUseSaved] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  // Pre-fill from session name
  useEffect(() => {
    if (session?.user) {
      const u = session.user as { name?: string; email?: string }
      setForm((f) => ({ ...f, fullName: u.name ?? "" }))
    }
  }, [session])

  // Load saved profile address + phone
  useEffect(() => {
    if (!session?.user) { setProfileLoading(false); return }
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data: SavedProfile | null) => {
        if (data?.address || data?.phone) {
          setHasSavedAddress(true)
          if (data.address) {
            // address stored as "street, city" format
            const parts = data.address.split(",")
            const street = parts.slice(0, -1).join(",").trim()
            const city = parts[parts.length - 1]?.trim() ?? ""
            setForm((f) => ({
              ...f,
              phone:  data.phone ?? f.phone,
              street: street || data.address || "",
              city:   city || "",
            }))
          } else if (data.phone) {
            setForm((f) => ({ ...f, phone: data.phone ?? "" }))
          }
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [session])

  // Wallet balance
  useEffect(() => {
    if (session?.user) {
      fetch("/api/wallet").then(r => r.ok ? r.json() : null).then(d => {
        if (d) setWalletBalance(d.balanceTzs ?? 0)
      })
    }
  }, [session])

  const cartSubtotal  = total()
  const discountAmt   = appliedCode ? Math.round(cartSubtotal * appliedCode.percent / 100) : 0
  const deliveryFee   = deliveryMethod === "bolt" ? BOLT_FEE : 0
  const finalTotal    = cartSubtotal - discountAmt + deliveryFee

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

    const fullAddress = `${form.street.trim()}, ${form.city.trim()}`

    // Save address to profile if requested
    if (saveAddress && form.street && form.city) {
      fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: fullAddress, phone: form.phone || null }),
      }).catch(() => {})
    }

    // Include delivery method as metadata in address string
    const deliveryLabel = deliveryMethod === "bolt" ? " [BOLT]" : " [FREE_WEEKEND]"
    const addressWithDelivery = fullAddress + deliveryLabel

    const res = await fetch("/api/checkout/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: addressWithDelivery,
        items: items.map((i) => ({ productId: i.productId ?? i.id, quantity: i.quantity })),
        discountCodeId: appliedCode?.id ?? null,
        deliveryFee,
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

  /* ── Order confirmed ── */
  if (stage === "confirmed") {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-6 text-center font-mono max-w-sm">
        <div className="relative">
          <div className="w-20 h-20 border border-green-400/30 flex items-center justify-center bg-green-400/5">
            <CheckCircle2 className="h-9 w-9 text-green-400/70" />
          </div>
          <div className="absolute inset-0 border border-green-400/15 scale-125 animate-ping opacity-30" />
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-black tracking-widest">Order Confirmed!</h1>
          <p className="text-[10px] text-foreground/45 leading-relaxed">
            Great news! We have received your payment and your order is confirmed.
            We&apos;ll start packaging it right away.
          </p>
        </div>
        {trackingId && (
          <div className="w-full border border-white/10 px-4 py-3 text-center">
            <p className="text-[8px] tracking-widest text-foreground/30 mb-1">YOUR TRACKING NUMBER</p>
            <p className="text-base font-black tracking-widest" style={{ color: "#ee0000" }}>{trackingId}</p>
          </div>
        )}
        <p className="text-[9px] text-foreground/35">We&apos;ll email you updates at every stage of your delivery.</p>
        <div className="flex gap-3 w-full">
          <Link href={`/orders/${orderId}`} className="flex-1 py-2.5 bg-foreground text-background text-[10px] tracking-widest font-bold text-center hover:bg-foreground/90 transition-colors">
            Track Order
          </Link>
          <Link href="/products" className="flex-1 py-2.5 border border-foreground/20 text-foreground/55 text-[10px] tracking-widest text-center hover:text-foreground hover:border-foreground/40 transition-colors">
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

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Delivery address */}
            <div className="border border-foreground/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-foreground/55" />
                  <p className="text-xs tracking-widest text-foreground/65 font-medium">DELIVERY ADDRESS</p>
                </div>
                {hasSavedAddress && (
                  <button
                    type="button"
                    onClick={() => setUseSaved((v) => !v)}
                    className="text-[8px] tracking-widest text-foreground/40 hover:text-foreground/70 transition-colors border border-white/12 px-2 py-1"
                  >
                    {useSaved ? "EDIT ADDRESS" : "USE SAVED"}
                  </button>
                )}
              </div>

              {profileLoading ? (
                <div className="flex items-center gap-2 text-[9px] text-foreground/30">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading saved address...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "fullName", label: "Full Name",      placeholder: "John Doe",           colSpan: "col-span-2" },
                    { name: "phone",    label: "Phone Number",   placeholder: "+255 712 345 678",    colSpan: "col-span-2", type: "tel" },
                    { name: "street",   label: "Street Address", placeholder: "123 Kariakoo Street", colSpan: "col-span-2" },
                    { name: "city",     label: "City / Region",  placeholder: "Dar es Salaam",       colSpan: "col-span-2" },
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
                        readOnly={useSaved && hasSavedAddress && field.name !== "fullName" && field.name !== "phone"}
                        className={`w-full bg-transparent border px-3 py-2.5 text-xs text-foreground/85 placeholder:text-foreground/30 focus:outline-none transition-colors ${
                          useSaved && hasSavedAddress && field.name !== "fullName"
                            ? "border-foreground/10 text-foreground/50 bg-foreground/[0.02] cursor-default"
                            : "border-foreground/18 focus:border-foreground/45"
                        }`}
                      />
                    </div>
                  ))}

                  {/* Save checkbox */}
                  {(!hasSavedAddress || !useSaved) && (
                    <div className="col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="save-address"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="w-3 h-3 accent-foreground"
                      />
                      <label htmlFor="save-address" className="text-[9px] tracking-widest text-foreground/45 cursor-pointer">
                        Save this address for future orders
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Delivery method */}
            <div className="border border-foreground/10 p-5 space-y-3">
              <p className="text-xs tracking-widest text-foreground/65 font-medium">DELIVERY METHOD</p>

              {/* Bolt option */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("bolt")}
                className={`w-full flex items-start gap-3 p-3 border transition-all text-left ${
                  deliveryMethod === "bolt"
                    ? "border-foreground/40 bg-foreground/[0.04]"
                    : "border-white/12 hover:border-white/25"
                }`}
              >
                <div className={`w-4 h-4 border rounded-full mt-0.5 shrink-0 flex items-center justify-center ${deliveryMethod === "bolt" ? "border-foreground/60" : "border-white/25"}`}>
                  {deliveryMethod === "bolt" && <div className="w-2 h-2 rounded-full bg-foreground/70" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-yellow-400/70" />
                    <span className="text-xs font-medium text-foreground/80 tracking-wide">Bolt Delivery</span>
                    <span className="ml-auto text-[10px] text-green-400/80 font-mono font-bold">{formatPrice(BOLT_FEE)}</span>
                  </div>
                  <p className="text-[9px] text-foreground/45 mt-0.5">Fast delivery · Delivered same or next day</p>
                </div>
              </button>

              {/* Free weekend option */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("free_weekend")}
                className={`w-full flex items-start gap-3 p-3 border transition-all text-left ${
                  deliveryMethod === "free_weekend"
                    ? "border-green-400/30 bg-green-400/[0.03]"
                    : "border-white/12 hover:border-white/25"
                }`}
              >
                <div className={`w-4 h-4 border rounded-full mt-0.5 shrink-0 flex items-center justify-center ${deliveryMethod === "free_weekend" ? "border-green-400/60" : "border-white/25"}`}>
                  {deliveryMethod === "free_weekend" && <div className="w-2 h-2 rounded-full bg-green-400/70" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-green-400/65" />
                    <span className="text-xs font-medium text-foreground/80 tracking-wide">Free Weekend Delivery</span>
                    <span className="ml-auto text-[10px] text-green-400/80 font-mono font-bold">FREE</span>
                  </div>
                  <p className="text-[9px] text-foreground/45 mt-0.5">Delivered every Saturday or Sunday · Dar es Salaam only</p>
                </div>
              </button>

              {/* Info box */}
              {deliveryMethod === "free_weekend" && (
                <div className="flex items-start gap-2 p-3 border border-green-400/20 bg-green-400/[0.03]">
                  <Info className="h-3.5 w-3.5 text-green-400/60 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-foreground/50 leading-relaxed">
                    Free weekend delivery is available for <strong className="text-foreground/70">Dar es Salaam</strong> customers only.
                    Orders placed before Friday midnight will be delivered on Saturday or Sunday.
                    Delivery may take longer compared to Bolt.
                  </p>
                </div>
              )}

              {/* HAO+ delivery teaser */}
              {deliveryMethod === "bolt" && (
                <div className="flex items-center gap-2 px-3 py-2 border border-yellow-400/15 bg-yellow-400/[0.02]">
                  <span className="text-[8px] font-bold text-yellow-400/70">HAO+</span>
                  <span className="text-[9px] text-foreground/40">members get free Bolt delivery on every order</span>
                  <span className="ml-auto text-[8px] text-yellow-400/50 border border-yellow-400/20 px-1.5 py-0.5">SOON</span>
                </div>
              )}
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
                    <p className="text-[8px] text-green-400/50 mt-0.5">{appliedCode.percent}% off — saving {formatPrice(discountAmt)}</p>
                  </div>
                  <button type="button" onClick={() => setAppliedCode(null)} className="text-foreground/30 hover:text-foreground/60 transition-colors">
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

            {/* Wallet payment */}
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

            {/* HAO+ banner */}
            <HaoPlusBanner variant="checkout" />
          </div>

          {/* ── Right: Order summary (desktop) ── */}
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
                <div className="flex justify-between">
                  <span className="flex items-center gap-1 text-foreground/40">
                    {deliveryMethod === "bolt"
                      ? <><Zap className="h-2.5 w-2.5 text-yellow-400/60" /> Bolt Delivery</>
                      : <><Calendar className="h-2.5 w-2.5 text-green-400/60" /> Free Delivery</>}
                  </span>
                  <span className={deliveryFee === 0 ? "text-green-400/70" : "text-foreground/60"}>
                    {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-foreground/10 pt-2">
                  <span className="text-foreground/55 font-bold">Total</span>
                  <span className="text-green-400/80 font-mono font-bold">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#ee0000] text-white text-[10px] tracking-widest font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
                  : <><Wallet className="h-3.5 w-3.5" /> Pay {formatPrice(finalTotal)}</>}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[8px] text-foreground/25">
                <ShieldCheck className="h-2.5 w-2.5" /> Secure checkout
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ── Mobile sticky bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-foreground/15 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[8px] tracking-widest text-foreground/30">TOTAL</p>
            <p className="text-green-400/80 font-mono text-sm font-bold">{formatPrice(finalTotal)}</p>
            {deliveryMethod === "free_weekend" && (
              <p className="text-[8px] text-green-400/55">Free delivery included</p>
            )}
            {appliedCode && (
              <p className="text-[8px] text-green-400/55">Saved {formatPrice(discountAmt)}</p>
            )}
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#ee0000] text-white text-[10px] tracking-widest font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
              : <><Zap className="h-3.5 w-3.5" /> Pay {formatPrice(finalTotal)}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
