"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCart } from "@/hooks/useCart"
import { ShieldCheck, Truck, Wallet, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"

type Stage = "form" | "confirmed"

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, total, clearCart } = useCart()
  const [stage, setStage] = useState<Stage>("form")
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
  })

  useEffect(() => {
    if (session?.user) {
      const u = session.user as { name?: string; email?: string }
      setForm((f) => ({ ...f, fullName: u.name ?? "", email: u.email ?? "" }))
    }
  }, [session])

  // Fetch wallet balance for display
  useEffect(() => {
    if (session?.user) {
      fetch("/api/wallet").then(r => r.ok ? r.json() : null).then(d => {
        if (d) setWalletBalance(d.balanceTzs ?? 0)
      })
    }
  }, [session])

  const cartTotal = total()
  const shipping = cartTotal >= 50000 ? 0 : 2000
  const finalTotal = cartTotal + shipping

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session) {
      toast.error("SIGN.IN.REQUIRED")
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
      }),
    })

    const data = await res.json()

    if (res.ok) {
      clearCart()
      setOrderId(data.orderId)
      setStage("confirmed")
    } else if (data.code === "insufficient_balance") {
      setBalanceError(data.error)
    } else {
      toast.error(data.error ?? "PAYMENT.FAILED // RETRY", { className: "font-mono text-xs" })
    }
    setLoading(false)
  }


  if (stage === "confirmed") {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-6 text-center font-mono">
        <div className="border border-green-400/30 p-8 relative max-w-sm w-full">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-green-400/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-green-400/40" />
          <CheckCircle2 className="h-8 w-8 text-green-400/70 mx-auto mb-3" />
          <p className="text-[9px] tracking-widest text-green-400/70 mb-2">PAYMENT.CONFIRMED</p>
          <h1 className="text-xl font-black tracking-widest mb-2">ORDER.COMPLETE</h1>
          <p className="text-[10px] text-foreground/40">
            YOUR PAYMENT WAS RECEIVED. DELIVERY IN 3–5 DAYS.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/orders" className="px-4 py-2 text-[10px] tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-colors">
            VIEW.ORDERS
          </Link>
          <Link href="/products" className="px-4 py-2 text-[10px] tracking-widest border border-foreground/20 text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-colors">
            CONTINUE.SHOPPING
          </Link>
        </div>
      </div>
    )
  }


  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center font-mono">
        <p className="text-[11px] tracking-widest text-foreground/40 mb-4">CART.EMPTY</p>
        <Link href="/products" className="px-4 py-2 text-[10px] tracking-widest border border-foreground/20 text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-colors">
          BROWSE.DEALS
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8 max-w-6xl font-mono">
      <div className="flex items-center gap-3 mb-6 border-b border-foreground/10 pb-4">
        <span className="text-foreground/30 text-[10px]">//</span>
        <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">CHECKOUT.PROTOCOL</h1>
      </div>

      <form id="checkout-form" onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Shipping + Payment */}
          <div className="lg:col-span-2 space-y-4">
            {/* Shipping */}
            <div className="border border-foreground/10 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="h-3 w-3 text-foreground/30" />
                <p className="text-[9px] tracking-widest text-foreground/40">// SHIPPING.INFORMATION</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "fullName",  label: "FULL.NAME",      placeholder: "John Doe",         colSpan: "col-span-2" },
                  { name: "email",     label: "EMAIL.ADDRESS",  placeholder: "user@domain.com",  type: "email", colSpan: "col-span-2" },
                  { name: "address",   label: "STREET.ADDRESS", placeholder: "123 Main St",      colSpan: "col-span-2" },
                  { name: "city",      label: "CITY / REGION",  placeholder: "Dar es Salaam",    colSpan: "col-span-2" },
                ].map((field) => (
                  <div key={field.name} className={field.colSpan}>
                    <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">{field.label}</label>
                    <input
                      type={field.type ?? "text"}
                      name={field.name}
                      value={form[field.name as keyof typeof form]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required
                      className="w-full bg-transparent border border-foreground/15 px-3 py-2 text-[10px] tracking-wide text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Wallet Payment */}
            <div className="border border-foreground/10 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-3 w-3 text-foreground/30" />
                <p className="text-[9px] tracking-widest text-foreground/40">// NTZS.WALLET.PAYMENT</p>
                <span className="ml-auto flex items-center gap-1 text-[8px] text-green-400/60">
                  <span className="w-1 h-1 bg-green-400/60 rounded-full animate-pulse" />
                  POWERED BY nTZS
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border border-foreground/10 px-3">
                <span className="text-[8px] tracking-widest text-foreground/30">WALLET.BALANCE</span>
                <span className={`text-[11px] font-mono font-bold ${walletBalance !== null && walletBalance >= finalTotal ? "text-green-400/80" : "text-red-400/70"}`}>
                  {walletBalance !== null ? formatPrice(walletBalance) : "—"}
                </span>
              </div>

              {balanceError && (
                <div className="flex items-start gap-2 p-3 border border-red-400/20 bg-red-400/5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-400/70 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[9px] text-red-400/80">{balanceError}</p>
                    <Link href="/wallet" className="text-[8px] text-foreground/50 hover:text-foreground underline underline-offset-2 transition-colors">
                      TOP UP WALLET →
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[8px] text-foreground/20">
                <ShieldCheck className="h-2.5 w-2.5" />
                INSTANT ON-CHAIN TRANSFER · BASE BLOCKCHAIN
              </div>
            </div>
          </div>

          {/* Right: Order Summary — desktop */}
          <div className="hidden lg:block">
            <div className="border border-foreground/10 p-5 space-y-4 sticky top-24">
              <p className="text-[9px] tracking-widest text-foreground/40">// ORDER.SUMMARY</p>

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
                      <p className="text-[9px] text-foreground/60 truncate uppercase">{item.name}</p>
                      <p className="text-[10px] text-green-400/80">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-foreground/10 pt-3 space-y-2 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-foreground/40 tracking-widest">SUBTOTAL</span>
                  <span className="text-foreground/60">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/40 tracking-widest">SHIPPING</span>
                  {shipping === 0
                    ? <span className="text-green-400/70">FREE</span>
                    : <span className="text-foreground/60">{formatPrice(shipping)}</span>}
                </div>
              </div>

              <div className="border-t border-foreground/10 pt-3 flex justify-between items-center">
                <span className="text-[9px] tracking-widest text-foreground/40">TOTAL</span>
                <span className="text-green-400/80 font-mono">{formatPrice(finalTotal)}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background text-[10px] tracking-widest font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> PROCESSING...</>
                  : <><Wallet className="h-3.5 w-3.5" /> PAY.FROM.WALLET</>}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Mobile sticky submit bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-foreground/15 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[8px] tracking-widest text-foreground/30">TOTAL</p>
            <p className="text-green-400/80 font-mono text-sm font-bold">{formatPrice(finalTotal)}</p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-foreground text-background text-[10px] tracking-widest font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> PROCESSING...</>
              : <><Wallet className="h-3.5 w-3.5" /> PAY.FROM.WALLET</>}
          </button>
        </div>
      </div>
    </div>
  )
}
