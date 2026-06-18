"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, MapPin, Copy, Check, RefreshCw } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import OrderTracker from "@/components/ui/order-tracker"
import type { Order } from "@/types"

const POLL_INTERVAL = 30_000 // 30s auto-refresh

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchOrder = useCallback(async () => {
    try {
      const r = await fetch(`/api/orders/${id}`, { cache: "no-store" })
      if (r.status === 404) { setNotFound(true); return }
      const data = await r.json()
      setOrder(data)
      setLastRefresh(new Date())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [id])

  // Initial load
  useEffect(() => { fetchOrder() }, [fetchOrder])

  // Auto-refresh every 30s (shows packaging after 5 min, in_transit / delivered when admin updates)
  useEffect(() => {
    const timer = setInterval(fetchOrder, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [fetchOrder])

  function copyTracking() {
    navigator.clipboard.writeText(order?.trackingId ?? order?.id ?? "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl font-mono">
        <div className="h-4 w-24 bg-foreground/5 mb-8 animate-pulse" />
        <div className="border border-white/10 h-96 animate-pulse bg-foreground/5" />
      </div>
    )
  }

  /* ── Not found ── */
  if (notFound || !order) {
    return (
      <div className="container mx-auto px-4 py-24 text-center font-mono">
        <p className="text-[12px] tracking-widest text-foreground/30 mb-4">Order not found</p>
        <Link href="/orders" className="text-[11px] text-foreground/40 hover:text-foreground underline underline-offset-4">
          Back to my orders
        </Link>
      </div>
    )
  }

  const shortId = order.id.slice(0, 8).toUpperCase()
  const isDelivered = order.status === "delivered"

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl font-mono">
      {/* Back */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-[11px] tracking-widest text-foreground/35 hover:text-foreground/65 transition-colors mb-5"
      >
        <ArrowLeft className="h-3 w-3" /> MY ORDERS
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-5 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-[13px] tracking-[0.25em] text-foreground/65">ORDER #{shortId}</h1>
          <p className="text-[11px] text-foreground/30 mt-0.5">
            Placed {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-green-400/80 text-lg font-mono font-bold">{formatPrice(order.total)}</p>
          <button
            onClick={fetchOrder}
            className="flex items-center gap-1 text-[10px] text-foreground/25 hover:text-foreground/50 transition-colors"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            {lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Tracker card */}
        <div className="border border-white/10 overflow-hidden relative bg-foreground/[0.015]">
          {/* Top glow stripe */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(238,0,0,0.5), transparent)" }}
          />
          <OrderTracker
            status={order.status}
            trackingId={order.trackingId}
            trackingEvents={order.trackingEvents ?? []}
            createdAt={order.createdAt}
            orderId={order.id}
          />
        </div>

        {/* Copy tracking number */}
        {order.trackingId && (
          <button
            onClick={copyTracking}
            className="w-full flex items-center justify-between px-4 py-3 border border-white/10 hover:border-white/22 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-widest text-foreground/25">TRACKING ID</span>
              <span className="text-[12px] text-foreground/55 font-mono">{order.trackingId}</span>
            </div>
            {copied
              ? <Check className="h-3 w-3 text-green-400" />
              : <Copy className="h-3 w-3 text-foreground/22 group-hover:text-foreground/45 transition-colors" />
            }
          </button>
        )}

        {/* Items */}
        <div className="border border-white/10">
          <div className="px-5 py-3 border-b border-white/8">
            <p className="text-[10px] tracking-[0.3em] text-foreground/30">
              YOUR ITEMS · {order.items.length} {order.items.length === 1 ? "ITEM" : "ITEMS"}
            </p>
          </div>
          <div className="divide-y divide-white/5">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                <Link href={`/products/${item.productId}`} className="relative w-11 h-11 flex-shrink-0 overflow-hidden border border-white/10 hover:border-white/28 transition-colors bg-foreground/5">
                  <Image
                    src={item.product.images[0] ?? ""}
                    alt={item.product.name}
                    fill className="object-cover opacity-65 hover:opacity-90 transition-opacity"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground/65 truncate">{item.product.name}</p>
                  <p className="text-[10px] text-foreground/28 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <p className="text-[13px] text-green-400/65 font-mono flex-shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/8 bg-foreground/[0.02]">
            <span className="text-[10px] tracking-widest text-foreground/28">TOTAL</span>
            <span className="text-sm text-green-400/75 font-mono font-bold">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Delivery address */}
        <div className="border border-white/10 px-5 py-4">
          <p className="text-[10px] tracking-[0.3em] text-foreground/28 mb-2">DELIVERY ADDRESS</p>
          <div className="flex items-start gap-2">
            <MapPin className="h-3 w-3 text-foreground/22 mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-foreground/55 leading-relaxed">{order.address}</p>
          </div>
        </div>

        {/* Post-delivery CTA */}
        {isDelivered ? (
          <div className="border border-green-400/20 bg-green-400/[0.03] px-5 py-4 text-center">
            <p className="text-[12px] text-green-400/70 mb-3">
              We hope you love your order! Check your email for a special discount code.
            </p>
            <Link
              href="/products"
              className="inline-block px-5 py-2 bg-[#ee0000] text-white text-[11px] tracking-widest font-bold hover:bg-red-700 transition-colors"
            >
              Shop Again →
            </Link>
          </div>
        ) : (
          <Link
            href="/products"
            className="block text-center py-3 border border-white/10 hover:border-white/22 text-[11px] tracking-widest text-foreground/35 hover:text-foreground/60 transition-colors"
          >
            Browse more deals
          </Link>
        )}
      </div>
    </div>
  )
}
