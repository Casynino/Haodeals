"use client"

import { useEffect, useState } from "react"
import { Search, Package, X } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface Order {
  id: string
  total: number
  status: string
  address: string
  createdAt: string
  user: { name?: string | null; email: string }
  items: { id: string; quantity: number; price: number; product: { name: string } }[]
}

const statusConfig: Record<string, string> = {
  pending:   "text-yellow-400/70 border-yellow-400/30",
  confirmed: "text-blue-400/70 border-blue-400/30",
  shipped:   "text-purple-400/70 border-purple-400/30",
  delivered: "text-green-400/70 border-green-400/30",
  cancelled: "text-red-400/70 border-red-400/30",
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin/all-orders")
      .then((r) => r.json())
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = orders.filter(
    (o) =>
      o.user.email.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.user.name ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/30 text-[10px]">//</span>
          <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">ALL.ORDERS</h1>
          <span className="text-[9px] text-foreground/30">[{orders.length}.TOTAL]</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/25" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH BY EMAIL OR ORDER.ID..."
          className="w-full pl-8 pr-8 py-2 bg-transparent border border-white/15 text-[10px] tracking-widest text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-foreground/5 border border-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-white/10">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-[10px] tracking-widest text-foreground/30">NO.ORDERS.FOUND</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <div key={order.id} className="border border-white/10 hover:border-white/20 transition-colors p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-foreground/70 uppercase tracking-wide truncate">
                    {order.user.name ?? order.user.email}
                  </p>
                  <p className="text-[8px] text-foreground/25 mt-0.5 truncate">
                    #{order.id.slice(0, 8).toUpperCase()} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[8px] tracking-widest border px-1.5 py-0.5 ${statusConfig[order.status] ?? "text-foreground/40 border-white/15"}`}>
                    {order.status.toUpperCase()}
                  </span>
                  <span className="text-green-400/70 text-sm font-mono">{formatPrice(order.total)}</span>
                </div>
              </div>
              <div className="text-[9px] text-foreground/25 space-y-0.5">
                <p className="truncate">{order.address}</p>
                <p>
                  {order.items.length} ITEM{order.items.length !== 1 ? "S" : ""}:{" "}
                  <span className="text-foreground/40">
                    {order.items.map((i) => `${i.product.name.toUpperCase().slice(0, 20)} ×${i.quantity}`).join(" / ")}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
