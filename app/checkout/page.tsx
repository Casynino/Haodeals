"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCart } from "@/hooks/useCart"
import {
  ShieldCheck, Wallet, CheckCircle2,
  Loader2, AlertCircle, Tag, X, MapPin,
  Zap, Calendar, Truck, Plus, Pencil, Trash2, ChevronLeft,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { HaoPlusBanner } from "@/components/HaoPlusBanner"

type Stage = "form" | "confirmed"
type DeliveryMethod = "free_weekend" | "express"

interface DiscountCode { id: string; code: string; percent: number; expiresAt: string }
interface SavedAddress {
  id: string; label: string | null; fullName: string
  phone: string | null; street: string; city: string; isDefault: boolean
}
type AddressMode = "view" | "list" | "form"

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, total, clearCart, buyNowItem, clearBuyNow } = useCart()

  // If arriving via "Buy Now", use just that item; otherwise use the full cart
  const checkoutItems = buyNowItem ? [buyNowItem] : items
  const isBuyNow = buyNowItem !== null

  // Clear buyNow if the user navigates away without completing the order
  const clearedRef = useRef(false)
  useEffect(() => {
    clearedRef.current = false
    return () => { if (!clearedRef.current) clearBuyNow() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("free_weekend")
  const [transportMethod, setTransportMethod] = useState<string | null>(null)

  // Addresses
  const [addresses, setAddresses]             = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [addressMode, setAddressMode]         = useState<AddressMode>("view")
  const [editingAddress, setEditingAddress]   = useState<SavedAddress | null>(null)
  const [addrForm, setAddrForm]               = useState({ fullName: "", phone: "", street: "", city: "", label: "" })
  const [savingAddr, setSavingAddr]           = useState(false)
  const [addressesLoading, setAddressesLoading] = useState(true)

  // Load saved addresses
  useEffect(() => {
    if (!session?.user) { setAddressesLoading(false); return }
    fetch("/api/addresses")
      .then((r) => r.ok ? r.json() : [])
      .then((data: SavedAddress[]) => {
        setAddresses(data)
        const def = data.find((a) => a.isDefault) ?? data[0]
        if (def) setSelectedAddressId(def.id)
      })
      .catch(() => {})
      .finally(() => setAddressesLoading(false))
  }, [session])

  // Wallet balance
  useEffect(() => {
    if (session?.user) {
      fetch("/api/wallet").then(r => r.ok ? r.json() : null).then(d => {
        if (d) setWalletBalance(d.balanceTzs ?? 0)
      })
    }
  }, [session])

  const cartSubtotal = checkoutItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discountAmt  = appliedCode ? Math.round(cartSubtotal * appliedCode.percent / 100) : 0
  const finalTotal   = cartSubtotal - discountAmt
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null

  // ── Address helpers ──────────────────────────────────────────────────────

  function openAddForm() {
    const u = session?.user as { name?: string } | undefined
    setAddrForm({ fullName: u?.name ?? "", phone: "", street: "", city: "", label: "" })
    setEditingAddress(null)
    setAddressMode("form")
  }

  function openEditForm(addr: SavedAddress) {
    setAddrForm({ fullName: addr.fullName, phone: addr.phone ?? "", street: addr.street, city: addr.city, label: addr.label ?? "" })
    setEditingAddress(addr)
    setAddressMode("form")
  }

  async function handleSaveAddress() {
    const { fullName, phone, street, city, label } = addrForm
    if (!fullName.trim() || !street.trim() || !city.trim()) {
      toast.error("Name, street, and city are required")
      return
    }
    setSavingAddr(true)
    try {
      const payload = {
        fullName: fullName.trim(), phone: phone.trim() || null,
        street: street.trim(), city: city.trim(), label: label.trim() || null,
      }
      if (editingAddress) {
        const res = await fetch(`/api/addresses/${editingAddress.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated: SavedAddress = await res.json()
          setAddresses((prev) => prev.map((a) => a.id === updated.id ? updated : a))
          setSelectedAddressId(updated.id)
          setAddressMode("view"); setEditingAddress(null)
          toast.success("Address updated")
        }
      } else {
        const res = await fetch("/api/addresses", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const newAddr: SavedAddress = await res.json()
          setAddresses((prev) => [...prev, newAddr])
          setSelectedAddressId(newAddr.id)
          setAddressMode("view")
          toast.success("Address saved")
        }
      }
    } catch {
      toast.error("Could not save address")
    } finally {
      setSavingAddr(false)
    }
  }

  async function handleDeleteAddress(id: string) {
    try {
      await fetch(`/api/addresses/${id}`, { method: "DELETE" })
      const remaining = addresses.filter((a) => a.id !== id)
      setAddresses(remaining)
      if (selectedAddressId === id) {
        const next = remaining.find((a) => a.isDefault) ?? remaining[0]
        setSelectedAddressId(next?.id ?? null)
      }
    } catch {
      toast.error("Could not delete address")
    }
  }

  // ────────────────────────────────────────────────────────────────────────

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

    if (!selectedAddress) {
      toast.error("Please add a delivery address to continue")
      setLoading(false)
      return
    }
    const fullAddress = `${selectedAddress.street}, ${selectedAddress.city}`

    // Tag delivery method (+ chosen transport) in address so admin can see it
    const transportTag = transportMethod ? `:${transportMethod.toUpperCase().replace(/\s+/g, "_")}` : ""
    const deliveryLabel = deliveryMethod === "express" ? ` [EXPRESS${transportTag}]` : " [FREE_WEEKEND]"
    const addressWithDelivery = fullAddress + deliveryLabel

    const res = await fetch("/api/checkout/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: addressWithDelivery,
        items: checkoutItems.map((i) => ({ productId: i.productId ?? i.id, quantity: i.quantity })),
        discountCodeId: appliedCode?.id ?? null,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      clearedRef.current = true   // don't auto-clear buyNow on unmount
      if (isBuyNow) clearBuyNow()
      else clearCart()
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
          <p className="text-[12px] text-foreground/45 leading-relaxed">
            Great news! We have received your payment and your order is confirmed.
            We&apos;ll start packaging it right away.
          </p>
        </div>
        {trackingId && (
          <div className="w-full border border-white/10 px-4 py-3 text-center">
            <p className="text-[10px] tracking-widest text-foreground/30 mb-1">YOUR TRACKING NUMBER</p>
            <p className="text-base font-black tracking-widest" style={{ color: "#ee0000" }}>{trackingId}</p>
          </div>
        )}
        <p className="text-[11px] text-foreground/35">We&apos;ll email you updates at every stage of your delivery.</p>
        <div className="flex gap-3 w-full">
          <Link href={`/orders/${orderId}`} className="flex-1 py-2.5 bg-foreground text-background text-[12px] tracking-widest font-bold text-center hover:bg-foreground/90 transition-colors">
            Track Order
          </Link>
          <Link href="/products" className="flex-1 py-2.5 border border-foreground/20 text-foreground/55 text-[12px] tracking-widest text-center hover:text-foreground hover:border-foreground/40 transition-colors">
            Keep Shopping
          </Link>
        </div>
      </div>
    )
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center font-mono">
        <p className="text-[13px] tracking-widest text-foreground/40 mb-4">Your cart is empty</p>
        <Link href="/products" className="px-4 py-2 text-[12px] tracking-widest border border-foreground/20 text-foreground/55 hover:text-foreground hover:border-foreground/40 transition-colors">
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
        {isBuyNow && (
          <span className="ml-2 flex items-center gap-1.5 px-2 py-0.5 border border-[#ee0000]/40 bg-[#ee0000]/[0.07] text-[#ee0000]/80 text-[10px] tracking-widest font-bold">
            <Zap className="h-2.5 w-2.5" /> EXPRESS CHECKOUT
          </span>
        )}
      </div>

      <form id="checkout-form" onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* ── Delivery address ── */}
            {addressMode === "view" && (
              addressesLoading ? (
                <div className="border border-foreground/10 p-5 flex items-center gap-2 text-[11px] text-foreground/30">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading addresses...
                </div>
              ) : selectedAddress ? (
                /* Selected address card */
                <div className="border border-foreground/10 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-foreground/55" />
                      <p className="text-xs tracking-widest text-foreground/65 font-medium">DELIVERY ADDRESS</p>
                    </div>
                    <button type="button" onClick={() => setAddressMode("list")}
                      className="text-[11px] tracking-widest border border-white/15 px-2 py-1 text-foreground/40 hover:text-foreground hover:border-white/35 transition-colors">
                      CHANGE
                    </button>
                  </div>

                  <div className="border border-green-400/20 bg-green-400/[0.025] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground/85">{selectedAddress.fullName}</p>
                        <p className="text-[12px] text-foreground/55">{selectedAddress.street}</p>
                        <p className="text-[12px] text-foreground/55">{selectedAddress.city}</p>
                        {selectedAddress.phone && (
                          <p className="text-[11px] text-foreground/38 mt-0.5">{selectedAddress.phone}</p>
                        )}
                      </div>
                      {selectedAddress.label && (
                        <span className="text-[10px] tracking-widest border border-white/15 px-1.5 py-0.5 text-foreground/38 shrink-0">
                          {selectedAddress.label.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button type="button" onClick={openAddForm}
                    className="flex items-center gap-1.5 text-[11px] text-foreground/30 hover:text-foreground/55 transition-colors">
                    <Plus className="h-3 w-3" /> Add another address
                  </button>
                </div>
              ) : (
                /* No address — prompt to add */
                <div className="border border-dashed border-foreground/15 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-foreground/35" />
                    <p className="text-xs tracking-widest text-foreground/50 font-medium">DELIVERY ADDRESS</p>
                  </div>
                  <p className="text-[12px] text-foreground/30">No delivery address saved yet.</p>
                  <button type="button" onClick={openAddForm}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-white/20 hover:border-white/35 text-[12px] tracking-widest text-foreground/50 hover:text-foreground/75 transition-colors">
                    <Plus className="h-3 w-3" /> Add Delivery Address
                  </button>
                </div>
              )
            )}

            {/* Address list */}
            {addressMode === "list" && (
              <div className="border border-foreground/10 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-foreground/55" />
                    <p className="text-xs tracking-widest text-foreground/65 font-medium">SAVED ADDRESSES</p>
                  </div>
                  <button type="button" onClick={() => setAddressMode("view")}
                    className="text-[11px] text-foreground/35 hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <div key={addr.id}
                      className={`border p-3 transition-all ${selectedAddressId === addr.id ? "border-green-400/25 bg-green-400/[0.025]" : "border-white/10 hover:border-white/20"}`}>
                      <div className="flex items-start gap-3">
                        <button type="button"
                          onClick={() => { setSelectedAddressId(addr.id); setAddressMode("view") }}
                          className="mt-0.5 shrink-0">
                          <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${selectedAddressId === addr.id ? "border-green-400/60" : "border-white/25"}`}>
                            {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-green-400/70" />}
                          </div>
                        </button>
                        <button type="button" onClick={() => { setSelectedAddressId(addr.id); setAddressMode("view") }}
                          className="flex-1 min-w-0 text-left">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium text-foreground/80">{addr.fullName}</p>
                              <p className="text-[11px] text-foreground/45">{addr.street}, {addr.city}</p>
                              {addr.phone && <p className="text-[11px] text-foreground/30">{addr.phone}</p>}
                            </div>
                            {addr.label && (
                              <span className="text-[10px] tracking-widest border border-white/12 px-1.5 py-0.5 text-foreground/32 shrink-0">
                                {addr.label.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </button>
                        <div className="flex gap-0.5 shrink-0">
                          <button type="button" onClick={() => openEditForm(addr)}
                            className="p-1.5 text-foreground/28 hover:text-foreground/60 transition-colors">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button type="button" onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1.5 text-foreground/28 hover:text-red-400/65 transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={openAddForm}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-white/15 hover:border-white/28 text-[12px] text-foreground/38 hover:text-foreground/55 transition-colors">
                  <Plus className="h-3 w-3" /> Add New Address
                </button>
              </div>
            )}

            {/* Add / Edit address form */}
            {addressMode === "form" && (
              <div className="border border-foreground/10 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <button type="button"
                    onClick={() => { setAddressMode(addresses.length > 0 ? "list" : "view"); setEditingAddress(null) }}
                    className="text-foreground/40 hover:text-foreground transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <p className="text-xs tracking-widest text-foreground/65 font-medium">
                    {editingAddress ? "EDIT ADDRESS" : "NEW ADDRESS"}
                  </p>
                </div>

                <div className="space-y-3">
                  {([
                    { key: "fullName", label: "Full Name",       placeholder: "John Doe",           type: "text" },
                    { key: "phone",    label: "Phone Number",    placeholder: "+255 712 345 678",    type: "tel"  },
                    { key: "street",   label: "Street / Area",   placeholder: "Mbezi Beach",         type: "text" },
                    { key: "city",     label: "City / Region",   placeholder: "Dar es Salaam",       type: "text" },
                  ] as const).map((field) => (
                    <div key={field.key}>
                      <label className="text-[12px] tracking-widest text-foreground/50 block mb-1.5">{field.label}</label>
                      <input
                        type={field.type}
                        value={addrForm[field.key]}
                        onChange={(e) => setAddrForm((f) => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full bg-transparent border border-foreground/15 px-3 py-2.5 text-xs text-foreground/85 placeholder:text-foreground/25 focus:outline-none focus:border-foreground/40 transition-colors"
                      />
                    </div>
                  ))}

                  <div>
                    <p className="text-[12px] tracking-widest text-foreground/50 mb-2">Label (optional)</p>
                    <div className="flex gap-1.5">
                      {["Home", "Work", "Other"].map((l) => (
                        <button key={l} type="button"
                          onClick={() => setAddrForm((f) => ({ ...f, label: f.label === l ? "" : l }))}
                          className={`px-2.5 py-1 rounded-full text-[11px] border transition-all ${
                            addrForm.label === l
                              ? "border-foreground/45 bg-foreground/10 text-foreground/80"
                              : "border-white/15 text-foreground/38 hover:border-white/28"
                          }`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="button"
                    onClick={() => { setAddressMode(addresses.length > 0 ? "list" : "view"); setEditingAddress(null) }}
                    className="flex-1 py-2.5 text-[12px] tracking-widest border border-white/15 text-foreground/40 hover:text-foreground hover:border-white/30 transition-colors">
                    Cancel
                  </button>
                  <button type="button" onClick={handleSaveAddress} disabled={savingAddr}
                    className="flex-1 py-2.5 text-[12px] tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {savingAddr ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</> : "Save Address"}
                  </button>
                </div>
              </div>
            )}

            {/* Delivery method */}
            <div className="border border-foreground/10 p-5 space-y-3">
              <p className="text-xs tracking-widest text-foreground/65 font-medium">DELIVERY METHOD</p>

              {/* Option 1 — Free Weekend Delivery */}
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
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground/85 tracking-wide">Free Weekend Delivery</span>
                    <span className="text-[12px] font-bold text-green-400/85 font-mono">FREE</span>
                  </div>
                  <p className="text-[11px] text-foreground/40 mt-1">
                    📦 Saturday &amp; Sunday only (Dar es Salaam customers only)
                  </p>
                </div>
              </button>

              {/* Option 2 — Express Delivery */}
              <button
                type="button"
                onClick={() => setDeliveryMethod("express")}
                className={`w-full flex items-start gap-3 p-3 border transition-all text-left ${
                  deliveryMethod === "express"
                    ? "border-amber-400/25 bg-amber-400/[0.025]"
                    : "border-white/12 hover:border-white/25"
                }`}
              >
                <div className={`w-4 h-4 border rounded-full mt-0.5 shrink-0 flex items-center justify-center ${deliveryMethod === "express" ? "border-amber-400/55" : "border-white/25"}`}>
                  {deliveryMethod === "express" && <div className="w-2 h-2 rounded-full bg-amber-400/70" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground/85">Express Delivery</span>
                    <span className="text-[10px] font-bold tracking-widest text-amber-400/90 border border-amber-400/35 bg-amber-400/[0.08] rounded-full px-2 py-0.5">
                      PAID BY CUSTOMER
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground/40 mt-1">
                    You arrange delivery directly with the provider. You cover the cost.
                  </p>
                </div>
              </button>

              {/* Transport chips — visible when Express is selected */}
              {deliveryMethod === "express" && (
                <div className="pl-7 space-y-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { emoji: "🚕", label: "Bolt" },
                      { emoji: "🏍️", label: "Boda Boda" },
                      { emoji: "🚌", label: "Bus" },
                      { emoji: "✈️", label: "Air" },
                      { emoji: "🚤", label: "Boat" },
                    ].map(({ emoji, label }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setTransportMethod((t) => (t === label ? null : label))}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wide border transition-all ${
                          transportMethod === label
                            ? "border-amber-400/50 bg-amber-400/[0.1] text-amber-400/90"
                            : "border-white/15 text-foreground/45 hover:border-white/30 hover:text-foreground/65"
                        }`}
                      >
                        <span className="text-[13px] leading-none">{emoji}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-foreground/28 tracking-wide">
                    Delivery arranged based on your selected transport method.
                  </p>
                </div>
              )}

              {/* HAO+ teaser */}
              <div className="flex items-center gap-2 px-3 py-2 border border-yellow-400/15 bg-yellow-400/[0.02]">
                <span className="text-[10px] font-bold text-yellow-400/70">HAO+</span>
                <span className="text-[11px] text-foreground/40">members get priority fast delivery on every order</span>
                <span className="ml-auto text-[10px] text-yellow-400/50 border border-yellow-400/20 px-1.5 py-0.5">SOON</span>
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
                    <p className="text-[12px] font-bold text-green-400/80 font-mono tracking-wider">{appliedCode.code}</p>
                    <p className="text-[10px] text-green-400/50 mt-0.5">{appliedCode.percent}% off — saving {formatPrice(discountAmt)}</p>
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
                    className="flex-1 bg-transparent border border-foreground/15 px-3 py-2 text-[12px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors uppercase"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                  />
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="px-4 border border-foreground/20 text-[11px] text-foreground/55 hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-40"
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
                <p className="text-[11px] tracking-widest text-foreground/40">NTZS WALLET PAYMENT</p>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-green-400/60">
                  <span className="w-1 h-1 bg-green-400/60 rounded-full animate-pulse" />
                  POWERED BY nTZS
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border border-foreground/10 px-3">
                <span className="text-[12px] tracking-widest text-foreground/55">WALLET BALANCE</span>
                <span className={`text-sm font-mono font-bold ${walletBalance !== null && walletBalance >= finalTotal ? "text-green-400" : "text-red-400/80"}`}>
                  {walletBalance !== null ? formatPrice(walletBalance) : "—"}
                </span>
              </div>
              {balanceError && (
                <div className="flex items-start gap-2 p-3 border border-red-400/20 bg-red-400/5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-400/70 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[11px] text-red-400/80">{balanceError}</p>
                    <Link href="/wallet" className="text-[10px] text-foreground/50 hover:text-foreground underline underline-offset-2 transition-colors">
                      Top up wallet →
                    </Link>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[10px] text-foreground/20">
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
                {checkoutItems.map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <div className="relative w-12 h-12 overflow-hidden bg-foreground/5 border border-foreground/10 flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover opacity-70" />
                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-foreground text-background text-[10px]">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-foreground/60 truncate">{item.name}</p>
                      <p className="text-[12px] text-green-400/80">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-foreground/10 pt-3 space-y-2 text-[12px]">
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
                    {deliveryMethod === "free_weekend"
                      ? <><Calendar className="h-2.5 w-2.5 text-green-400/60" /> Weekend Delivery</>
                      : <><Truck className="h-2.5 w-2.5 text-foreground/40" /> Express {transportMethod ? `· ${transportMethod}` : "Delivery"}</>}
                  </span>
                  <span className={deliveryMethod === "free_weekend" ? "text-green-400/70" : "text-foreground/40"}>
                    {deliveryMethod === "free_weekend" ? "FREE" : "Paid by customer"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-foreground/10 pt-2">
                  <span className="text-foreground/55 font-bold">Total</span>
                  <span className="text-green-400/80 font-mono font-bold">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedAddressId}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#ee0000] text-white text-[12px] tracking-widest font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
                  : <><Wallet className="h-3.5 w-3.5" /> Pay {formatPrice(finalTotal)}</>}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-foreground/25">
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
            <p className="text-[10px] tracking-widest text-foreground/30">TOTAL</p>
            <p className="text-green-400/80 font-mono text-sm font-bold">{formatPrice(finalTotal)}</p>
            {deliveryMethod === "free_weekend"
              ? <p className="text-[10px] text-green-400/55">Free weekend delivery</p>
              : <p className="text-[10px] text-foreground/30">Express delivery — paid by customer</p>
            }
            {appliedCode && (
              <p className="text-[10px] text-green-400/55">Saved {formatPrice(discountAmt)}</p>
            )}
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={loading || !selectedAddressId}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#ee0000] text-white text-[12px] tracking-widest font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
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
