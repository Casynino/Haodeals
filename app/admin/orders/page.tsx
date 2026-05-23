"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Search, Package, X, Phone, MapPin, ChevronDown, ChevronUp,
  Loader2, Check, AlertTriangle, RefreshCw,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface TrackingEvent {
  id: string
  status: string
  message: string
  createdAt: string
}

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

/* ── Status config ─────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: "payment_confirmed",  label: "Payment Confirmed",     color: "text-blue-400" },
  { value: "order_received",     label: "Order Received",        color: "text-blue-400" },
  { value: "packaging",          label: "Packaging in Progress", color: "text-yellow-400" },
  { value: "ready_for_delivery", label: "Ready for Delivery",    color: "text-yellow-400" },
  { value: "in_transit",         label: "In Transit",            color: "text-purple-400" },
  { value: "out_for_delivery",   label: "Out for Delivery",      color: "text-purple-400" },
  { value: "delivered",          label: "Delivered",             color: "text-green-400" },
  { value: "cancelled",          label: "Cancelled",             color: "text-red-400" },
  { value: "refund_processing",  label: "Refund Processing",     color: "text-orange-400" },
  { value: "refunded",           label: "Refunded",              color: "text-green-400" },
]

const STATUS_COLOR: Record<string, string> = {
  payment_confirmed:  "text-blue-400/70 border-blue-400/30",
  order_received:     "text-blue-400/70 border-blue-400/30",
  packaging:          "text-yellow-400/70 border-yellow-400/30",
  ready_for_delivery: "text-yellow-400/70 border-yellow-400/30",
  in_transit:         "text-purple-400/70 border-purple-400/30",
  out_for_delivery:   "text-purple-400/70 border-purple-400/30",
  delivered:          "text-green-400/70 border-green-400/30",
  cancelled:          "text-red-400/70 border-red-400/30",
  refund_processing:  "text-orange-400/70 border-orange-400/30",
  refunded:           "text-green-400/70 border-green-400/30",
  // Legacy
  pending:            "text-yellow-400/70 border-yellow-400/30",
  confirmed:          "text-blue-400/70 border-blue-400/30",
  shipped:            "text-purple-400/70 border-purple-400/30",
}

function statusLabel(s: string) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label
    ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/* ── Status updater sub-component ─────────────────────── */
function StatusUpdater({ order, onUpdated }: { order: Order; onUpdated: (updated: Order) => void }) {
  const [newStatus, setNewStatus] = useState(order.status)
  const [message, setMessage]     = useState("")
  const [saving, setSaving]       = useState(false)

  async function handleUpdate() {
    if (newStatus === order.status && !message.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, message: message.trim() || undefined }),
      })
      if (!res.ok) throw new Error("Failed to update")
      const updated = await res.json()
      onUpdated(updated)
      setMessage("")
      toast.success(`Order updated to "${statusLabel(newStatus)}"`)
    } catch {
      toast.error("Failed to update order status")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 border border-white/10 bg-foreground/[0.02] p-4">
      <p className="text-[8px] tracking-[0.3em] text-foreground/30">UPDATE STATUS</p>

      {/* Status selector */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setNewStatus(opt.value)}
            className={`px-2 py-1.5 text-[8px] tracking-wide border transition-all leading-tight text-left ${
              newStatus === opt.value
                ? `border-white/40 bg-white/5 ${opt.color}`
                : "border-white/10 text-foreground/30 hover:border-white/25 hover:text-foreground/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Optional custom message */}
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Custom message (optional — leave blank for default)"
        className="w-full px-3 py-2 bg-transparent border border-white/10 text-[10px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/30 transition-colors"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={handleUpdate}
          disabled={saving || (newStatus === order.status && !message.trim())}
          className="flex items-center gap-2 px-4 py-2 bg-[#ee0000] text-white text-[9px] tracking-widest font-bold disabled:opacity-40 hover:bg-red-700 transition-colors"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          {saving ? "Saving..." : "Update Status"}
        </button>
        <button
          onClick={() => { setNewStatus(order.status); setMessage("") }}
          className="px-3 py-2 border border-white/10 text-[9px] text-foreground/40 hover:text-foreground/70 hover:border-white/25 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────── */
export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [filter, setFilter]   = useState<string>("all")
  const [expanded, setExpanded] = useState<string | null>(null)

  const loadOrders = useCallback(() => {
    fetch("/api/admin/all-orders")
      .then((r) => r.json())
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  function handleOrderUpdated(updated: Order) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)))
  }

  // Filter options
  const filterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled/Refund" },
  ]

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.user.email.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.user.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.trackingId ?? "").toLowerCase().includes(search.toLowerCase())

    const matchesFilter =
      filter === "all" ? true
      : filter === "active" ? !["delivered", "cancelled", "refunded"].includes(o.status)
      : filter === "delivered" ? o.status === "delivered"
      : filter === "cancelled" ? ["cancelled", "refund_processing", "refunded"].includes(o.status)
      : true

    return matchesSearch && matchesFilter
  })

  // Stats
  const stats = {
    total:     orders.length,
    active:    orders.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    issues:    orders.filter((o) => ["cancelled", "refund_processing", "refunded"].includes(o.status)).length,
  }

  return (
    <div className="container mx-auto px-4 py-8 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/30 text-[10px]">//</span>
          <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">ORDER MANAGEMENT</h1>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-1.5 text-[9px] text-foreground/30 hover:text-foreground/60 transition-colors"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {[
          { label: "Total Orders", value: stats.total, color: "text-foreground/70" },
          { label: "Active",       value: stats.active, color: "text-yellow-400/70" },
          { label: "Delivered",    value: stats.delivered, color: "text-green-400/70" },
          { label: "Issues",       value: stats.issues, color: "text-red-400/70" },
        ].map((s) => (
          <div key={s.label} className="border border-white/10 px-4 py-3">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[8px] tracking-widest text-foreground/30 mt-0.5">{s.label.toUpperCase()}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/25" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, order or tracking ID..."
            className="w-full pl-8 pr-8 py-2 bg-transparent border border-white/15 text-[10px] tracking-widest text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-2 text-[9px] tracking-wider border transition-colors ${
                filter === f.value
                  ? "border-white/40 text-foreground/80 bg-white/5"
                  : "border-white/10 text-foreground/30 hover:border-white/25"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-foreground/5 border border-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-white/10">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-[10px] tracking-widest text-foreground/30">NO ORDERS FOUND</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <div key={order.id} className="border border-white/10 hover:border-white/20 transition-colors">
              {/* Header row */}
              <button
                className="w-full text-left p-4"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-foreground/70 uppercase tracking-wide truncate">
                      {order.user.name ?? order.user.email}
                    </p>
                    <p className="text-[8px] text-foreground/25 mt-0.5">
                      #{order.id.slice(0, 8).toUpperCase()}
                      {order.trackingId && <span className="ml-1.5 text-foreground/20">· {order.trackingId}</span>}
                      {" · "}{new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {["cancelled", "refund_processing"].includes(order.status) && (
                      <AlertTriangle className="h-3 w-3 text-orange-400/60" />
                    )}
                    <span className={`text-[8px] tracking-widest border px-1.5 py-0.5 ${STATUS_COLOR[order.status] ?? "text-foreground/40 border-white/15"}`}>
                      {statusLabel(order.status)}
                    </span>
                    <span className="text-green-400/70 text-sm font-mono">{formatPrice(order.total)}</span>
                    {expanded === order.id
                      ? <ChevronUp className="h-3 w-3 text-foreground/30" />
                      : <ChevronDown className="h-3 w-3 text-foreground/30" />}
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {expanded === order.id && (
                <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-4">
                  {/* Customer + address */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="text-[8px] tracking-widest text-foreground/30">CUSTOMER</p>
                      <p className="text-[10px] text-foreground/70">{order.user.name ?? "—"}</p>
                      <p className="text-[9px] text-foreground/40">{order.user.email}</p>
                      {order.user.phone && (
                        <p className="flex items-center gap-1 text-[9px] text-foreground/50">
                          <Phone className="h-2.5 w-2.5" /> {order.user.phone}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[8px] tracking-widest text-foreground/30">DELIVERY ADDRESS</p>
                      <p className="flex items-start gap-1 text-[9px] text-foreground/50 leading-relaxed">
                        <MapPin className="h-2.5 w-2.5 mt-0.5 shrink-0" /> {order.address}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-[8px] tracking-widest text-foreground/30 mb-2">ORDER ITEMS</p>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-[9px] border border-white/5 px-3 py-1.5">
                          <span className="text-foreground/60 uppercase tracking-wide">{item.product.name}</span>
                          <div className="flex items-center gap-3 text-foreground/40">
                            <span>×{item.quantity}</span>
                            <span className="text-green-400/60">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tracking history */}
                  {order.trackingEvents.length > 0 && (
                    <div>
                      <p className="text-[8px] tracking-widest text-foreground/30 mb-2">TRACKING HISTORY</p>
                      <div className="space-y-1.5">
                        {[...order.trackingEvents].reverse().map((event) => (
                          <div key={event.id} className="flex items-start gap-3 text-[9px]">
                            <span className="text-foreground/20 flex-shrink-0 w-28 leading-tight">
                              {new Date(event.createdAt).toLocaleDateString("en-US", {
                                month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                            <div>
                              <span className={`font-bold ${STATUS_COLOR[event.status]?.split(" ")[0] ?? "text-foreground/50"}`}>
                                {statusLabel(event.status)}
                              </span>
                              <span className="text-foreground/40 ml-2">{event.message}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status updater */}
                  <StatusUpdater order={order} onUpdated={handleOrderUpdated} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
