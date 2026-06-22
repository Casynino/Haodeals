"use client"

import Image from "next/image"
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Package,
  Truck,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react"
import { useState } from "react"
import { formatPrice } from "@/lib/utils"
import type { ConversationOrder } from "@/types"

// ─── Status config ──────────────────────────────────────────────────────────

interface StatusMeta {
  label: string
  dot: string      // tailwind bg-* class for the timeline dot
  badge: string    // tailwind classes for the status badge
  Icon: React.ElementType
}

const STATUS_META: Record<string, StatusMeta> = {
  payment_confirmed: {
    label: "Payment Confirmed",
    dot: "bg-yellow-400",
    badge: "text-yellow-400 border-yellow-400/30 bg-yellow-400/[0.07]",
    Icon: CreditCard,
  },
  packaging: {
    label: "Packaging",
    dot: "bg-blue-400",
    badge: "text-blue-400 border-blue-400/30 bg-blue-400/[0.07]",
    Icon: Package,
  },
  in_transit: {
    label: "In Transit",
    dot: "bg-orange-400",
    badge: "text-orange-400 border-orange-400/30 bg-orange-400/[0.07]",
    Icon: Truck,
  },
  delivered: {
    label: "Delivered",
    dot: "bg-green-400",
    badge: "text-green-400 border-green-400/30 bg-green-400/[0.07]",
    Icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-red-400",
    badge: "text-red-400 border-red-400/30 bg-red-400/[0.07]",
    Icon: XCircle,
  },
  refund_processing: {
    label: "Refund Processing",
    dot: "bg-orange-400",
    badge: "text-orange-400 border-orange-400/30 bg-orange-400/[0.07]",
    Icon: RefreshCw,
  },
  refunded: {
    label: "Refunded",
    dot: "bg-green-400",
    badge: "text-green-400 border-green-400/30 bg-green-400/[0.07]",
    Icon: CheckCircle2,
  },
}

function getMeta(status: string): StatusMeta {
  return STATUS_META[status] ?? {
    label: status.replace(/_/g, " "),
    dot: "bg-foreground/30",
    badge: "text-foreground/50 border-white/15 bg-foreground/[0.04]",
    Icon: Clock,
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function OrderSummaryCard({ order }: { order: ConversationOrder }) {
  const [expanded, setExpanded] = useState(true)

  const ref = order.trackingId
    ? `Order #${order.trackingId}`
    : `Order #${order.id.slice(0, 8)}`

  const statusMeta = getMeta(order.status)
  const StatusIcon = statusMeta.Icon

  return (
    <div className="border border-white/12 bg-foreground/[0.015] mb-5 overflow-hidden">
      {/* ── Collapsible header ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/[0.04] transition-colors text-left"
      >
        <Package className="h-3.5 w-3.5 text-foreground/35 shrink-0" />

        <div className="flex-1 flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-[12px] tracking-[0.18em] text-foreground/65">{ref}</span>
          <span className={`text-[10px] tracking-widest border px-2 py-0.5 flex items-center gap-1 shrink-0 ${statusMeta.badge}`}>
            <StatusIcon className="h-2.5 w-2.5" />
            {statusMeta.label}
          </span>
        </div>

        <span className="text-green-400/75 text-[13px] font-bold shrink-0 mr-1">
          {formatPrice(order.total)}
        </span>

        {expanded
          ? <ChevronUp className="h-3.5 w-3.5 text-foreground/25 shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-foreground/25 shrink-0" />
        }
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="border-t border-white/8">

          {/* Products list */}
          <div className="divide-y divide-white/5">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                {/* Thumbnail */}
                <div className="relative w-11 h-11 shrink-0 border border-white/10 bg-foreground/5 overflow-hidden">
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      sizes="44px"
                      className="object-cover opacity-75"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-foreground/20" />
                    </div>
                  )}
                </div>

                {/* Name + qty */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground/75 leading-snug">{item.product.name}</p>
                  <p className="text-[10px] text-foreground/35 mt-0.5">
                    QTY: {item.quantity}
                    {item.quantity > 1 && (
                      <span className="text-foreground/25"> · {formatPrice(item.price)} each</span>
                    )}
                  </p>
                </div>

                {/* Line total */}
                <p className="text-[12px] text-green-400/65 font-medium shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* ── Invoice / totals ── */}
          <div className="border-t border-white/8 px-4 py-3 bg-foreground/[0.025]">
            <p className="text-[10px] tracking-[0.3em] text-foreground/25 mb-2">INVOICE SUMMARY</p>
            <div className="space-y-1 mb-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 text-[11px]">
                  <span className="text-foreground/40 leading-snug">
                    {item.product.name}
                    {item.quantity > 1 && <span className="text-foreground/25"> ×{item.quantity}</span>}
                  </span>
                  <span className="text-foreground/45 shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-white/8 pt-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-3 w-3 text-green-400/60" />
                <span className="text-[10px] text-green-400/60 tracking-wide">PAYMENT CONFIRMED</span>
              </div>
              <span className="text-sm text-green-400/80 font-bold">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {/* ── Delivery address ── */}
          <div className="border-t border-white/8 px-4 py-2.5 flex items-start gap-2">
            <MapPin className="h-3 w-3 text-foreground/25 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] tracking-[0.25em] text-foreground/25 mb-0.5">DELIVERY ADDRESS</p>
              <p className="text-[11px] text-foreground/55 leading-relaxed">{order.address}</p>
            </div>
          </div>

          {/* ── Tracking timeline ── */}
          {order.trackingEvents.length > 0 && (
            <div className="border-t border-white/8 px-4 py-3">
              <p className="text-[10px] tracking-[0.3em] text-foreground/25 mb-3">ORDER TIMELINE</p>
              <div className="space-y-0">
                {order.trackingEvents.map((evt, idx) => {
                  const isLast = idx === order.trackingEvents.length - 1
                  const evtMeta = getMeta(evt.status)
                  return (
                    <div key={evt.id} className="flex gap-3">
                      {/* Dot + line */}
                      <div className="flex flex-col items-center shrink-0 w-3">
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${isLast ? evtMeta.dot : "bg-foreground/15"}`} />
                        {!isLast && <div className="w-px flex-1 bg-white/6 min-h-[20px] mt-1" />}
                      </div>

                      {/* Content */}
                      <div className="pb-3 flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className={`text-[11px] tracking-wide font-medium ${isLast ? evtMeta.badge.split(" ")[0] : "text-foreground/40"}`}>
                            {evtMeta.label}
                          </span>
                          <span className="text-[10px] text-foreground/22">
                            {new Date(evt.createdAt).toLocaleDateString("en-US", {
                              month: "short", day: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground/40 leading-relaxed mt-0.5">
                          {evt.message}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Footer: placed date ── */}
          <div className="border-t border-white/6 px-4 py-2 flex items-center justify-between bg-foreground/[0.01]">
            <span className="text-[10px] tracking-[0.25em] text-foreground/20">ORDER PLACED</span>
            <span className="text-[10px] text-foreground/30">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
