"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Package, ShoppingCart, ChevronRight } from "lucide-react"
import type { Order } from "@/types"
import { formatPrice } from "@/lib/utils"

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  payment_confirmed:  { label: "Payment Confirmed",     color: "text-blue-400/70 border-blue-400/30",    dot: "bg-blue-400/60" },
  order_received:     { label: "Order Received",        color: "text-blue-400/70 border-blue-400/30",    dot: "bg-blue-400/60" },
  packaging:          { label: "Packaging",             color: "text-yellow-400/70 border-yellow-400/30", dot: "bg-yellow-400/60" },
  ready_for_delivery: { label: "Ready to Ship",         color: "text-yellow-400/70 border-yellow-400/30", dot: "bg-yellow-400/60" },
  in_transit:         { label: "In Transit",            color: "text-purple-400/70 border-purple-400/30", dot: "bg-purple-400/60" },
  out_for_delivery:   { label: "Out for Delivery",      color: "text-purple-400/70 border-purple-400/30", dot: "bg-purple-400/60" },
  delivered:          { label: "Delivered",             color: "text-green-400/70 border-green-400/30",  dot: "bg-green-400/60" },
  cancelled:          { label: "Cancelled",             color: "text-red-400/70 border-red-400/30",      dot: "bg-red-400/60" },
  refund_processing:  { label: "Refund Processing",     color: "text-orange-400/70 border-orange-400/30", dot: "bg-orange-400/60" },
  refunded:           { label: "Refunded",              color: "text-green-400/70 border-green-400/30",  dot: "bg-green-400/60" },
  // Legacy statuses
  pending:            { label: "Pending",               color: "text-yellow-400/70 border-yellow-400/30", dot: "bg-yellow-400/60" },
  confirmed:          { label: "Confirmed",             color: "text-blue-400/70 border-blue-400/30",    dot: "bg-blue-400/60" },
  shipped:            { label: "Shipped",               color: "text-purple-400/70 border-purple-400/30", dot: "bg-purple-400/60" },
  pending_payment:    { label: "Awaiting Payment",      color: "text-yellow-400/70 border-yellow-400/30", dot: "bg-yellow-400/60" },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <span className="text-foreground/30 text-[12px]"></span>
          <h1 className="text-[13px] tracking-[0.3em] text-foreground/70">MY ORDERS</h1>
        </div>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-white/10 p-5 h-28 bg-foreground/5" />
          ))}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-6 text-center">
        <div className="border border-white/10 p-8">
          <Package className="h-10 w-10 opacity-20" />
        </div>
        <div>
          <p className="text-[13px] tracking-widest text-foreground/50 mb-1">No orders yet</p>
          <p className="text-[11px] text-foreground/25">Your order history will appear here once you place an order.</p>
        </div>
        <Link
          href="/products"
          className="px-5 py-2.5 text-[12px] tracking-widest border border-white/20 text-foreground/60 hover:text-foreground hover:border-white/40 transition-colors flex items-center gap-2"
        >
          <ShoppingCart className="h-3 w-3" /> Browse deals
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/45 text-xs"></span>
          <h1 className="text-lg font-semibold tracking-[0.2em] text-foreground/90">MY ORDERS</h1>
          <span className="text-xs text-foreground/50">{orders.length} orders</span>
        </div>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const cfg = STATUS_CONFIG[order.status] ?? {
            label: order.status.replace(/_/g, " "),
            color: "text-foreground/50 border-white/20",
            dot: "bg-foreground/40",
          }

          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block border border-white/10 hover:border-white/25 transition-colors p-5 space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <p className="text-[12px] tracking-widest text-foreground/55 font-medium">
                    ORDER #{order.id.slice(0, 8)}
                    {order.trackingId && (
                      <span className="ml-2 text-foreground/40">· {order.trackingId}</span>
                    )}
                  </p>
                  <p className="text-xs text-foreground/55 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block w-1.5 h-1.5 ${cfg.dot}`} />
                    <span className={`text-[12px] tracking-wide border px-2 py-0.5 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-green-400/80 text-sm">{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {order.items.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="relative w-12 h-12 flex-shrink-0 overflow-hidden border border-white/10 bg-foreground/5"
                  >
                    <Image
                      src={item.product.images[0] ?? ""}
                      alt={item.product.name}
                      fill
                      className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    />
                  </div>
                ))}
                {order.items.length > 5 && (
                  <div className="w-12 h-12 flex-shrink-0 border border-white/10 bg-foreground/5 flex items-center justify-center text-[11px] text-foreground/30">
                    +{order.items.length - 5}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-foreground/50">
                <span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1 text-foreground/50 group-hover:text-foreground/70 transition-colors">
                  Track order <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
