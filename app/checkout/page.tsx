"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCart } from "@/hooks/useCart"
import { ShieldCheck, Truck, Lock } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, total, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    fullName: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    address: "",
    city: "",
    zipCode: "",
    country: "US",
    cardNumber: "",
    expiry: "",
    cvv: "",
  })

  const cartTotal = total()
  const shipping = cartTotal >= 100000 ? 0 : 5000
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
    const address = `${form.address}, ${form.city}, ${form.zipCode}, ${form.country}`
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      }),
    })

    if (res.ok) {
      clearCart()
      setSuccess(true)
    } else {
      toast.error("ORDER.FAILED // RETRY", { className: "font-mono text-xs" })
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-6 text-center font-mono">
        <div className="border border-green-400/30 p-8 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-green-400/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-green-400/40" />
          <div className="w-1.5 h-1.5 bg-green-400/70 rounded-full mx-auto mb-3 animate-pulse" />
          <p className="text-[9px] tracking-widest text-green-400/70 mb-2">ORDER.CONFIRMED</p>
          <h1 className="text-xl font-black tracking-widest mb-2">TRANSACTION.COMPLETE</h1>
          <p className="text-[10px] text-foreground/40">
            YOUR.ORDER.HAS.BEEN.PROCESSED. DELIVERY IN 3-5.DAYS.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/orders" className="px-4 py-2 text-[10px] tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-colors">
            VIEW.ORDERS
          </Link>
          <Link href="/products" className="px-4 py-2 text-[10px] tracking-widest border border-white/20 text-foreground/60 hover:text-foreground hover:border-white/40 transition-colors">
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
        <Link href="/products" className="px-4 py-2 text-[10px] tracking-widest border border-white/20 text-foreground/60 hover:text-foreground hover:border-white/40 transition-colors">
          BROWSE.DEALS
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8 max-w-6xl font-mono">
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <span className="text-foreground/30 text-[10px]">//</span>
        <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">CHECKOUT.PROTOCOL</h1>
      </div>

      <form id="checkout-form" onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Shipping + Payment */}
          <div className="lg:col-span-2 space-y-4">
            {/* Shipping */}
            <div className="border border-white/10 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="h-3 w-3 text-foreground/30" />
                <p className="text-[9px] tracking-widest text-foreground/40">// SHIPPING.INFORMATION</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "fullName", label: "FULL.NAME", placeholder: "John Doe", colSpan: "col-span-2" },
                  { name: "email", label: "EMAIL.ADDRESS", placeholder: "user@domain.com", type: "email", colSpan: "col-span-2" },
                  { name: "address", label: "STREET.ADDRESS", placeholder: "123 Main St", colSpan: "col-span-2" },
                  { name: "city", label: "CITY", placeholder: "New York", colSpan: "" },
                  { name: "zipCode", label: "ZIP.CODE", placeholder: "10001", colSpan: "" },
                ].map((field) => (
                  <div key={field.name} className={field.colSpan || ""}>
                    <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">{field.label}</label>
                    <input
                      type={field.type ?? "text"}
                      name={field.name}
                      value={form[field.name as keyof typeof form]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required
                      className="w-full bg-transparent border border-white/15 px-3 py-2 text-[10px] tracking-wide text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="border border-white/10 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-foreground/30" />
                <p className="text-[9px] tracking-widest text-foreground/40">// PAYMENT.DETAILS</p>
                <span className="ml-auto text-[8px] text-foreground/20">DEMO.MODE</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">CARD.NUMBER</label>
                  <input
                    name="cardNumber"
                    value={form.cardNumber}
                    onChange={handleChange}
                    placeholder="4242 4242 4242 4242"
                    required
                    className="w-full bg-transparent border border-white/15 px-3 py-2 text-[10px] tracking-wide text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">EXPIRY</label>
                    <input
                      name="expiry"
                      value={form.expiry}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      required
                      className="w-full bg-transparent border border-white/15 px-3 py-2 text-[10px] tracking-wide text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">CVV</label>
                    <input
                      name="cvv"
                      value={form.cvv}
                      onChange={handleChange}
                      placeholder="123"
                      required
                      className="w-full bg-transparent border border-white/15 px-3 py-2 text-[10px] tracking-wide text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[8px] text-foreground/20">
                <Lock className="h-2.5 w-2.5" />
                PAYMENT.DATA.ENCRYPTED.AES-256
              </div>
            </div>
          </div>

          {/* Right: Order Summary — desktop */}
          <div className="hidden lg:block">
            <div className="border border-white/10 p-5 space-y-4 sticky top-24">
              <p className="text-[9px] tracking-widest text-foreground/40">// ORDER.SUMMARY</p>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <div className="relative w-12 h-12 overflow-hidden bg-foreground/5 border border-white/10 flex-shrink-0">
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

              <div className="border-t border-white/10 pt-3 space-y-2 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-foreground/40 tracking-widest">SUBTOTAL</span>
                  <span className="text-foreground/60">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/40 tracking-widest">SHIPPING</span>
                  {shipping === 0
                    ? <span className="text-green-400/70">FREE</span>
                    : <span className="text-foreground/60">{formatPrice(shipping)}</span>
                  }
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-[9px] tracking-widest text-foreground/40">TOTAL</span>
                <span className="text-green-400/80 font-mono">{formatPrice(finalTotal)}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background text-[10px] tracking-widest font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {loading ? "PROCESSING..." : "PLACE.ORDER"}
              </button>

              <p className="text-[8px] text-foreground/20 text-center tracking-wide">
                DEMO.MODE // NO.REAL.PAYMENT.PROCESSED
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Mobile sticky submit bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-white/15 px-4 py-3">
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
            <ShieldCheck className="h-3.5 w-3.5" />
            {loading ? "PROCESSING..." : "PLACE.ORDER"}
          </button>
        </div>
      </div>
    </div>
  )
}
