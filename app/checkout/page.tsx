"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCart } from "@/hooks/useCart"
import { ShieldCheck, Truck, Smartphone, CheckCircle2, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"

type Stage = "form" | "awaiting" | "confirmed"

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, total, clearCart } = useCart()
  const [stage, setStage] = useState<Stage>("form")
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    phoneNumber: "",
  })

  useEffect(() => {
    if (session?.user) {
      setForm((f) => ({
        ...f,
        fullName: session.user?.name ?? "",
        email: session.user?.email ?? "",
      }))
    }
  }, [session])

  const cartTotal = total()
  const shipping = cartTotal >= 100000 ? 0 : 5000
  const finalTotal = cartTotal + shipping

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Poll order status every 4 seconds while awaiting payment
  useEffect(() => {
    if (stage !== "awaiting" || !orderId) return

    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.ok) {
        const order = await res.json()
        if (order.status === "confirmed") {
          clearInterval(pollRef.current!)
          clearCart()
          setStage("confirmed")
        }
      }
    }, 4000)

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [stage, orderId, clearCart])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session) {
      toast.error("SIGN.IN.REQUIRED")
      router.push("/login?callbackUrl=/checkout")
      return
    }

    setLoading(true)
    const address = `${form.address}, ${form.city}`

    const res = await fetch("/api/checkout/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        phoneNumber: form.phoneNumber,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      }),
    })

    const data = await res.json()

    if (res.ok) {
      setOrderId(data.orderId)
      setStage("awaiting")
    } else {
      toast.error(data.error ?? "PAYMENT.FAILED // RETRY", { className: "font-mono text-xs" })
    }
    setLoading(false)
  }

  async function checkStatus() {
    if (!orderId) return
    const res = await fetch(`/api/orders/${orderId}`)
    if (res.ok) {
      const order = await res.json()
      if (order.status === "confirmed") {
        if (pollRef.current) clearInterval(pollRef.current)
        clearCart()
        setStage("confirmed")
      } else {
        toast("PAYMENT.PENDING // CHECK.YOUR.PHONE", { className: "font-mono text-xs" })
      }
    }
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

  if (stage === "awaiting") {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-6 text-center font-mono max-w-sm">
        <div className="border border-foreground/15 p-8 relative w-full">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-foreground/20" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-foreground/20" />

          <Smartphone className="h-8 w-8 text-foreground/40 mx-auto mb-4" />
          <p className="text-[9px] tracking-widest text-foreground/40 mb-2">AWAITING.PAYMENT</p>
          <h1 className="text-lg font-black tracking-widest mb-3">CHECK.YOUR.PHONE</h1>
          <p className="text-[10px] text-foreground/50 leading-relaxed mb-6">
            A MOBILE MONEY PROMPT HAS BEEN SENT TO <span className="text-foreground">{form.phoneNumber}</span>. APPROVE THE PAYMENT TO CONFIRM YOUR ORDER.
          </p>

          <div className="border-t border-foreground/10 pt-4 mb-6">
            <p className="text-[8px] text-foreground/30 tracking-widest mb-1">AMOUNT.DUE</p>
            <p className="text-xl font-mono text-green-400/80">{formatPrice(finalTotal)}</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6 text-[8px] text-foreground/30">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>WAITING FOR CONFIRMATION...</span>
          </div>

          <button
            onClick={checkStatus}
            className="w-full flex items-center justify-center gap-2 py-2 border border-foreground/20 text-[10px] tracking-widest text-foreground/50 hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> CHECK.STATUS
          </button>
        </div>
        <p className="text-[8px] text-foreground/25 tracking-widest">
          ORDER #{orderId?.slice(0, 8).toUpperCase()}
        </p>
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

            {/* Mobile Money Payment */}
            <div className="border border-foreground/10 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-3 w-3 text-foreground/30" />
                <p className="text-[9px] tracking-widest text-foreground/40">// MOBILE.MONEY.PAYMENT</p>
                <span className="ml-auto flex items-center gap-1 text-[8px] text-green-400/60">
                  <span className="w-1 h-1 bg-green-400/60 rounded-full animate-pulse" />
                  POWERED BY nTZS
                </span>
              </div>

              <div>
                <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">PHONE.NUMBER</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="+255 712 345 678"
                  required
                  className="w-full bg-transparent border border-foreground/15 px-3 py-2 text-[10px] tracking-wide text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
                />
                <p className="text-[8px] text-foreground/25 mt-1">
                  SUPPORTS M-PESA, AIRTEL.MONEY, TIGOPESA, HALOPESA AND MORE
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[8px] text-foreground/20">
                <ShieldCheck className="h-2.5 w-2.5" />
                PAYMENTS SECURED BY nTZS · BASE BLOCKCHAIN
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
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> INITIATING...</>
                  : <><Smartphone className="h-3.5 w-3.5" /> PAY.WITH.MOBILE.MONEY</>}
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
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> INITIATING...</>
              : <><Smartphone className="h-3.5 w-3.5" /> PAY.NOW</>}
          </button>
        </div>
      </div>
    </div>
  )
}
