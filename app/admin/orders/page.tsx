"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Search, Package, X, Phone, MapPin,
  ChevronDown, ChevronUp, Loader2, RefreshCw,
  Truck, CheckCircle2, AlertTriangle, XCircle,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { statusToDisplayStage, statusLabel } from "@/lib/order-labels"
import { toast } from "sonner"

interface TrackingEvent { id: string; status: string; message: string; createdAt: string }

interface Order {
  id: string
  trackingId?: string | null
  total: number
  status: string
  address: string
  createdAt: string
  user: { name?: string | null; email: string; phone?: string | null }
  items: { id: string; quantity: number; price: number; product: { name: string } }[]
  trackingEvents: TrackingEvent[]
}

/* ── Status badge ──────────────────────────────────────────────── */
const BADGE: Record<string, { color: string; dot: string }> = {
  payment_confirmed:  { color: "text-blue-400/70 border-blue-400/25",    dot: "bg-blue-400/60" },
  packaging:          { color: "text-yellow-400/70 border-yellow-400/25", dot: "bg-yellow-400/60" },
  in_transit:         { color: "text-purple-400/70 border-purple-400/25", dot: "bg-purple-400/60" },
  delivered:          { color: "text-green-400/70 border-green-400/25",  dot: "bg-green-400/60" },
  cancelled:          { color: "text-red-400/70 border-red-400/25",      dot: "bg-red-400/60" },
  refund_processing:  { color: "text-orange-400/70 border-orange-400/25", dot: "bg-orange-400/60" },
  refunded:           { color: "text-green-400/70 border-green-400/25",  dot: "bg-green-400/60" },
}
const badge = (s: string) => BADGE[s] ?? { color: "text-foreground/40 border-foreground/15", dot: "bg-foreground/30" }

/* ── Stage mini-bar (for admin order view) ─────────────────────── */
function StageMini({ status }: { status: string }) {
  const stage = statusToDisplayStage(status)
  const isExc = stage === -1
  const stages = ["Payment", "Packaging", "Transit", "Delivered"]

  if (isExc) return null

  return (
    <div className="flex items-center gap-1 mt-2">
      {stages.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1">
          <div
            className="h-0.5 flex-1"
            style={{
              background: i < stage ? "rgba(34,197,94,0.5)"
                : i === stage ? "#ee0000"
                : "rgba(255,255,255,0.08)",
            }}
          />
          <div
            className="w-1.5 h-1.5 flex-shrink-0"
            style={{
              background: i < stage ? "rgba(34,197,94,0.6)"
                : i === stage ? "#ee0000"
                : "rgba(255,255,255,0.12)",
              boxShadow: i === stage ? "0 0 6px rgba(238,0,0,0.5)" : "none",
            }}
          />
        </div>
      ))}
    </div>
  )
}

/* ── Quick action panel ────────────────────────────────────────── */
function QuickAction({
  orderId,
  currentStatus,
  onUpdated,
}: {
  orderId: string
  currentStatus: string
  onUpdated: (updated: Order) => void
}) {
  const [saving, setSaving] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  async function advance(status: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      onUpdated(updated)
      toast.success(`Order updated — ${statusLabel(status)}`)
    } catch {
      toast.error("Failed to update order")
    } finally {
      setSaving(false)
      setShowCancel(false)
    }
  }

  const isDone = ["delivered", "cancelled", "refunded"].includes(currentStatus)

  return (
    <div className="mt-4 space-y-2.5">

      {/* ── STAGE 1: payment confirmed → admin approves for packing ── */}
      {currentStatus === "payment_confirmed" && (
        <div className="space-y-2">
          <div className="border border-yellow-400/20 bg-yellow-400/[0.03] px-3 py-2.5">
            <p className="text-[11px] font-bold text-yellow-400/70 tracking-wider mb-0.5">
              📋 New order — awaiting your review
            </p>
            <p className="text-[10px] text-foreground/40 leading-relaxed">
              Payment confirmed. Review the order below, then approve it for packing or issue a refund.
            </p>
          </div>
          <button
            onClick={() => advance("packaging")}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-400/10 border border-yellow-400/35 text-yellow-400/85 text-[12px] tracking-widest font-bold hover:bg-yellow-400/16 transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
            ✓ Approve &amp; Start Packaging
          </button>
        </div>
      )}

      {/* ── STAGE 2: packaging complete → dispatch ── */}
      {currentStatus === "packaging" && (
        <div className="space-y-2">
          <div className="border border-purple-400/20 bg-purple-400/[0.03] px-3 py-2.5">
            <p className="text-[11px] font-bold text-purple-400/70 tracking-wider mb-0.5">
              📦 Order is being packed
            </p>
            <p className="text-[10px] text-foreground/40 leading-relaxed">
              When packaging is complete and handed to the delivery driver, mark it as ready for delivery.
            </p>
          </div>
          <button
            onClick={() => advance("in_transit")}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-purple-400/10 border border-purple-400/35 text-purple-400/85 text-[12px] tracking-widest font-bold hover:bg-purple-400/16 transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
            🚚 Mark as Ready for Delivery
          </button>
        </div>
      )}

      {/* ── STAGE 3: in transit → delivered ── */}
      {currentStatus === "in_transit" && (
        <div className="space-y-2">
          <div className="border border-green-400/20 bg-green-400/[0.03] px-3 py-2.5">
            <p className="text-[11px] font-bold text-green-400/70 tracking-wider mb-0.5">
              🚚 Out for delivery
            </p>
            <p className="text-[10px] text-foreground/40 leading-relaxed">
              Once the customer has received the package, confirm delivery below.
            </p>
          </div>
          <button
            onClick={() => advance("delivered")}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-green-400/10 border border-green-400/35 text-green-400/85 text-[12px] tracking-widest font-bold hover:bg-green-400/16 transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            ✓ Mark as Delivered
          </button>
        </div>
      )}

      {/* ── Delivered confirmation ── */}
      {currentStatus === "delivered" && (
        <div className="border border-green-400/15 bg-green-400/[0.03] px-3 py-2.5">
          <p className="text-[11px] text-green-400/60 tracking-wider">
            ✓ Order delivered — promo code sent to customer
          </p>
        </div>
      )}

      {/* ── Cancel / Refund (available until delivered) ── */}
      {!isDone && (
        <div>
          {showCancel ? (
            <div className="border border-red-400/20 bg-red-400/[0.04] p-3 space-y-2">
              <p className="text-[10px] tracking-widest text-red-400/55 mb-1">
                This will notify the customer. Proceed?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => advance("cancelled")}
                  disabled={saving}
                  className="flex-1 py-1.5 border border-red-400/30 text-red-400/70 text-[11px] tracking-wider hover:bg-red-400/10 transition-colors disabled:opacity-40"
                >
                  Cancel Order
                </button>
                <button
                  onClick={() => advance("refund_processing")}
                  disabled={saving}
                  className="flex-1 py-1.5 border border-orange-400/30 text-orange-400/70 text-[11px] tracking-wider hover:bg-orange-400/10 transition-colors disabled:opacity-40"
                >
                  Issue Refund
                </button>
                <button
                  onClick={() => setShowCancel(false)}
                  className="px-3 border border-foreground/10 text-foreground/30 hover:text-foreground/50 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCancel(true)}
              className="flex items-center gap-1.5 text-[10px] text-foreground/22 hover:text-red-400/55 transition-colors"
            >
              <XCircle className="h-3 w-3" /> Cancel order / issue refund
            </button>
          )}
        </div>
      )}

      {currentStatus === "refund_processing" && (
        <button
          onClick={() => advance("refunded")}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2 border border-green-400/25 text-green-400/65 text-[11px] tracking-widest hover:bg-green-400/8 transition-colors disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
          Confirm Refund Complete
        </button>
      )}
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [filter, setFilter]   = useState("all")
  const [expanded, setExpanded] = useState<string | null>(null)

  const loadOrders = useCallback(() => {
    setLoading(true)
    fetch("/api/admin/all-orders")
      .then((r) => r.json())
      .then((d) => { setOrders(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  function handleUpdated(updated: Order) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)))
  }

  // Stats — payment_confirmed = new unreviewed orders (most urgent)
  const newOrders   = orders.filter((o) => o.status === "payment_confirmed").length
  const inPacking   = orders.filter((o) => o.status === "packaging").length
  const inTransit   = orders.filter((o) => o.status === "in_transit").length
  const delivered   = orders.filter((o) => o.status === "delivered").length
  const issues      = orders.filter((o) => ["cancelled", "refund_processing"].includes(o.status)).length

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    const matchQ = !q ||
      o.user.email.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      (o.user.name ?? "").toLowerCase().includes(q) ||
      (o.trackingId ?? "").toLowerCase().includes(q)

    const matchFilter =
      filter === "all"       ? true :
      filter === "new"       ? o.status === "payment_confirmed" :
      filter === "packing"   ? o.status === "packaging" :
      filter === "transit"   ? o.status === "in_transit" :
      filter === "delivered" ? o.status === "delivered" :
      filter === "issues"    ? ["cancelled", "refund_processing", "refunded"].includes(o.status) :
      true

    return matchQ && matchFilter
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 border-b border-foreground/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/25 text-[12px]">//</span>
          <h1 className="text-[13px] tracking-[0.3em] text-foreground/65">ORDER MONITOR</h1>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-1.5 text-[11px] text-foreground/30 hover:text-foreground/60 transition-colors"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
        {[
          { label: "New Orders",  value: newOrders,  color: "text-blue-400/80",   filter: "new",       badge: newOrders > 0 },
          { label: "Packaging",   value: inPacking,  color: "text-yellow-400/80", filter: "packing",   badge: false },
          { label: "In Transit",  value: inTransit,  color: "text-purple-400/80", filter: "transit",   badge: false },
          { label: "Delivered",   value: delivered,  color: "text-green-400/80",  filter: "delivered", badge: false },
          { label: "Issues",      value: issues,     color: "text-red-400/80",    filter: "issues",    badge: issues > 0 },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(filter === s.filter ? "all" : s.filter)}
            className={`relative border px-4 py-3 text-left transition-colors ${
              filter === s.filter ? "border-foreground/25 bg-foreground/4" : "border-foreground/10 hover:border-foreground/18"
            }`}
          >
            {s.badge && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-current rounded-full animate-ping opacity-70" style={{ color: s.color.replace("/80", "") }} />
            )}
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] tracking-widest text-foreground/28 mt-0.5">{s.label.toUpperCase()}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/22" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders, customers, tracking..."
          className="w-full pl-8 pr-8 py-2 bg-transparent border border-foreground/15 text-[12px] text-foreground/65 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/35 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/28 hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {[
          { v: "all",       l: `All (${orders.length})` },
          { v: "new",       l: `New Orders (${newOrders})` },
          { v: "packing",   l: `Packaging (${inPacking})` },
          { v: "transit",   l: `In Transit (${inTransit})` },
          { v: "delivered", l: `Delivered (${delivered})` },
          { v: "issues",    l: `Issues (${issues})` },
        ].map(({ v, l }) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-3 py-1.5 text-[10px] tracking-wider border transition-colors ${
              filter === v
                ? "border-foreground/35 text-foreground/75 bg-foreground/5"
                : "border-foreground/10 text-foreground/28 hover:border-foreground/22"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-foreground/5 border border-foreground/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-foreground/10">
          <Package className="h-8 w-8 mx-auto mb-3 opacity-15" />
          <p className="text-[12px] tracking-widest text-foreground/25">No orders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const b = badge(order.status)
            const isExp = expanded === order.id

            return (
              <div key={order.id} className={`border transition-colors ${isExp ? "border-foreground/20" : "border-foreground/10 hover:border-foreground/17"}`}>
                {/* Row */}
                <button
                  className="w-full text-left p-4"
                  onClick={() => setExpanded(isExp ? null : order.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-foreground/65 uppercase tracking-wide truncate">
                        {order.user.name ?? order.user.email}
                      </p>
                      <p className="text-[10px] text-foreground/22 mt-0.5">
                        #{order.id.slice(0, 8).toUpperCase()}
                        {order.trackingId && <span className="ml-1.5 text-foreground/15">· {order.trackingId}</span>}
                        {" · "}{new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      {/* Stage progress mini-bar */}
                      <StageMini status={order.status} />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                      {order.status === "payment_confirmed" && (
                        <span className="text-[10px] text-blue-400/70 border border-blue-400/25 px-1.5 py-0.5 animate-pulse">
                          NEW ORDER
                        </span>
                      )}
                      {order.status === "packaging" && (
                        <span className="text-[10px] text-yellow-400/70 border border-yellow-400/25 px-1.5 py-0.5">
                          READY TO SHIP
                        </span>
                      )}
                      {["cancelled", "refund_processing"].includes(order.status) && (
                        <AlertTriangle className="h-3 w-3 text-orange-400/60" />
                      )}
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 flex-shrink-0 ${b.dot}`} />
                        <span className={`text-[10px] tracking-widest border px-1.5 py-0.5 ${b.color}`}>
                          {statusLabel(order.status)}
                        </span>
                      </div>
                      <span className="text-green-400/65 text-sm">{formatPrice(order.total)}</span>
                      {isExp ? <ChevronUp className="h-3 w-3 text-foreground/25" /> : <ChevronDown className="h-3 w-3 text-foreground/25" />}
                    </div>
                  </div>
                </button>

                {/* Expanded */}
                {isExp && (
                  <div className="border-t border-foreground/10 px-4 pb-4 pt-3 space-y-4">
                    {/* Customer + address */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] tracking-widest text-foreground/25 mb-1.5">CUSTOMER</p>
                        <p className="text-[12px] text-foreground/65">{order.user.name ?? "—"}</p>
                        <p className="text-[11px] text-foreground/38">{order.user.email}</p>
                        {order.user.phone && (
                          <p className="flex items-center gap-1 text-[11px] text-foreground/45 mt-0.5">
                            <Phone className="h-2.5 w-2.5" /> {order.user.phone}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] tracking-widest text-foreground/25 mb-1.5">DELIVERY ADDRESS</p>
                        <p className="flex items-start gap-1 text-[11px] text-foreground/45 leading-relaxed">
                          <MapPin className="h-2.5 w-2.5 mt-0.5 shrink-0" /> {order.address}
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <p className="text-[10px] tracking-widest text-foreground/25 mb-2">ITEMS</p>
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-[11px] border border-foreground/5 px-3 py-1.5">
                            <span className="text-foreground/55 truncate max-w-[200px]">{item.product.name}</span>
                            <div className="flex items-center gap-3 text-foreground/35 flex-shrink-0">
                              <span>×{item.quantity}</span>
                              <span className="text-green-400/55">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tracking events */}
                    {order.trackingEvents.length > 0 && (
                      <div>
                        <p className="text-[10px] tracking-widest text-foreground/25 mb-2">TRACKING HISTORY</p>
                        <div className="space-y-1.5">
                          {[...order.trackingEvents].reverse().map((ev) => (
                            <div key={ev.id} className="flex gap-3 text-[11px]">
                              <span className="text-foreground/18 flex-shrink-0 w-28 leading-tight">
                                {new Date(ev.createdAt).toLocaleDateString("en-US", {
                                  month: "short", day: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </span>
                              <span className="text-foreground/45">{ev.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick actions */}
                    <QuickAction
                      orderId={order.id}
                      currentStatus={order.status}
                      onUpdated={handleUpdated}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
