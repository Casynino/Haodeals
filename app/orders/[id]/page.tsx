"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, MapPin, Copy, Check } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import OrderTracker from "@/components/ui/order-tracker"
import type { Order } from "@/types"

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((data) => { if (data) setOrder(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  function copyTracking() {
    const text = order?.trackingId ?? order?.id ?? ""
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl font-mono">
        <div className="h-6 w-32 bg-foreground/5 mb-8 animate-pulse" />
        <div className="border border-white/10 h-96 animate-pulse bg-foreground/5" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="container mx-auto px-4 py-24 text-center font-mono">
        <p className="text-[10px] tracking-widest text-foreground/30 mb-4">ORDER NOT FOUND</p>
        <Link href="/orders" className="text-[9px] text-foreground/40 hover:text-foreground underline underline-offset-4">
          Back to orders
        </Link>
      </div>
    )
  }

  const shortId = order.id.slice(0, 8).toUpperCase()

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl font-mono">
      {/* Back nav */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-[9px] tracking-widest text-foreground/40 hover:text-foreground/70 transition-colors mb-6"
      >
        <ArrowLeft className="h-3 w-3" /> MY ORDERS
      </Link>

      {/* Page header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">ORDER #{shortId}</h1>
          <p className="text-[9px] text-foreground/30 mt-0.5">
            Placed {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-green-400/80 text-lg font-mono font-bold">{formatPrice(order.total)}</p>
          <p className="text-[8px] text-foreground/30 mt-0.5">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Tracking card */}
        <div className="border border-white/10 overflow-hidden relative bg-foreground/[0.02]">
          {/* Glowing top edge */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(238,0,0,0.6), transparent)" }}
          />
          <OrderTracker
            status={order.status}
            trackingId={order.trackingId}
            trackingEvents={order.trackingEvents ?? []}
            createdAt={order.createdAt}
            orderId={order.id}
          />
        </div>

        {/* Copy tracking ID */}
        {order.trackingId && (
          <button
            onClick={copyTracking}
            className="w-full flex items-center justify-between px-4 py-3 border border-white/10 hover:border-white/25 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-[8px] tracking-widest text-foreground/30">TRACKING ID</span>
              <span className="text-[10px] text-foreground/60 font-mono">{order.trackingId}</span>
            </div>
            {copied
              ? <Check className="h-3 w-3 text-green-400" />
              : <Copy className="h-3 w-3 text-foreground/25 group-hover:text-foreground/50 transition-colors" />
            }
          </button>
        )}

        {/* Order items */}
        <div className="border border-white/10">
          <div className="px-5 py-3 border-b border-white/10">
            <p className="text-[8px] tracking-[0.3em] text-foreground/30">ORDER ITEMS</p>
          </div>
          <div className="divide-y divide-white/5">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                <Link href={`/products/${item.productId}`} className="relative w-12 h-12 flex-shrink-0 overflow-hidden border border-white/10 hover:border-white/30 transition-colors bg-foreground/5">
                  <Image
                    src={item.product.images[0] ?? ""}
                    alt={item.product.name}
                    fill
                    className="object-cover opacity-70 hover:opacity-100 transition-opacity"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-foreground/70 truncate">{item.product.name}</p>
                  <p className="text-[8px] text-foreground/30 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <p className="text-[11px] text-green-400/70 font-mono flex-shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-foreground/[0.02]">
            <span className="text-[8px] tracking-widest text-foreground/30">TOTAL</span>
            <span className="text-sm text-green-400/80 font-mono font-bold">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Delivery address */}
        <div className="border border-white/10 px-5 py-4">
          <p className="text-[8px] tracking-[0.3em] text-foreground/30 mb-2">DELIVERY ADDRESS</p>
          <div className="flex items-start gap-2">
            <MapPin className="h-3 w-3 text-foreground/25 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-foreground/60 leading-relaxed">{order.address}</p>
          </div>
        </div>

        {/* Browse more */}
        {order.status !== "delivered" && (
          <Link
            href="/products"
            className="block text-center py-3 border border-white/10 hover:border-white/25 text-[9px] tracking-widest text-foreground/40 hover:text-foreground/70 transition-colors"
          >
            BROWSE MORE DEALS
          </Link>
        )}
      </div>
    </div>
  )
}
