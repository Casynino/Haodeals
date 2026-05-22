"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Package, ShoppingCart } from "lucide-react"
import type { Order } from "@/types"

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: "PENDING",   color: "text-yellow-400/70 border-yellow-400/30" },
  confirmed: { label: "CONFIRMED", color: "text-blue-400/70 border-blue-400/30" },
  shipped:   { label: "SHIPPED",   color: "text-purple-400/70 border-purple-400/30" },
  delivered: { label: "DELIVERED", color: "text-green-400/70 border-green-400/30" },
  cancelled: { label: "CANCELLED", color: "text-red-400/70 border-red-400/30" },
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
      <div className="container mx-auto px-4 py-8 max-w-3xl font-mono">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <span className="text-foreground/30 text-[10px]">//</span>
          <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">ORDER.HISTORY</h1>
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
      <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-6 text-center font-mono">
        <div className="border border-white/10 p-8">
          <Package className="h-10 w-10 opacity-20" />
        </div>
        <p className="text-[11px] tracking-widest text-foreground/40">NO.ORDERS.FOUND</p>
        <p className="text-[9px] text-foreground/20">YOU HAVE NOT PLACED ANY ORDERS YET</p>
        <Link href="/products" className="px-4 py-2 text-[10px] tracking-widest border border-white/20 text-foreground/60 hover:text-foreground hover:border-white/40 transition-colors flex items-center gap-2">
          <ShoppingCart className="h-3 w-3" /> BROWSE.DEALS
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl font-mono">
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/30 text-[10px]">//</span>
          <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">ORDER.HISTORY</h1>
          <span className="text-[9px] text-foreground/30">[{orders.length}.ORDERS]</span>
        </div>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const status = statusConfig[order.status] ?? { label: order.status.toUpperCase(), color: "text-foreground/50 border-white/20" }
          return (
            <div key={order.id} className="border border-white/10 hover:border-white/20 transition-colors p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <p className="text-[8px] tracking-widest text-foreground/30">
                    ORDER #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-[9px] text-foreground/40">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-[8px] tracking-widest border px-2 py-0.5 ${status.color}`}>
                    {status.label}
                  </span>
                  <span className="text-green-400/80 text-sm font-mono">${order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {order.items.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.productId}`}
                    className="relative w-14 h-14 flex-shrink-0 overflow-hidden border border-white/10 hover:border-white/30 transition-colors bg-foreground/5"
                  >
                    <Image
                      src={item.product.images[0] ?? ""}
                      alt={item.product.name}
                      fill
                      className="object-cover opacity-70"
                    />
                  </Link>
                ))}
                {order.items.length > 5 && (
                  <div className="w-14 h-14 flex-shrink-0 border border-white/10 bg-foreground/5 flex items-center justify-center text-[9px] text-foreground/30">
                    +{order.items.length - 5}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[9px] text-foreground/30">
                <span>{order.items.length} ITEM{order.items.length !== 1 ? "S" : ""}</span>
                <span className="truncate max-w-xs text-right">{order.address}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
