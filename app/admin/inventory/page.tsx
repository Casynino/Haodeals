"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Boxes, AlertCircle, AlertTriangle, CheckCircle2, Search, X, RefreshCw } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface Product {
  id: string; name: string; price: number; stock: number; images: string
  category: { name: string }; _count: { orderItems: number }
}

type Filter = "all" | "out" | "critical" | "low" | "healthy"

const FILTER_TABS: { id: Filter; label: string; color: string }[] = [
  { id: "all",      label: "All",          color: "" },
  { id: "out",      label: "Out of Stock", color: "text-rose-400"   },
  { id: "critical", label: "Critical (≤3)", color: "text-rose-400"  },
  { id: "low",      label: "Low (4–10)",   color: "text-amber-400"  },
  { id: "healthy",  label: "Healthy",      color: "text-emerald-400" },
]

function stockLevel(s: number): Filter {
  if (s === 0) return "out"
  if (s <= 3)  return "critical"
  if (s <= 10) return "low"
  return "healthy"
}

const STOCK_BADGE: Record<string, string> = {
  out:      "bg-rose-500/12 text-rose-400 border-rose-500/20",
  critical: "bg-rose-500/10 text-rose-400 border-rose-500/15",
  low:      "bg-amber-500/10 text-amber-400 border-amber-500/15",
  healthy:  "bg-emerald-500/8 text-emerald-400 border-emerald-500/12",
}

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")
  const [filter,   setFilter]   = useState<Filter>("all")

  function load() {
    setLoading(true)
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => { setProducts(Array.isArray(d) ? d.sort((a: Product, b: Product) => a.stock - b.stock) : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = products.filter((p) => {
    const matchQ = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const level  = stockLevel(p.stock)
    const matchF = filter === "all" || level === filter
    return matchQ && matchF
  })

  const outCount      = products.filter((p) => p.stock === 0).length
  const criticalCount = products.filter((p) => p.stock > 0 && p.stock <= 3).length
  const lowCount      = products.filter((p) => p.stock > 3 && p.stock <= 10).length
  const healthyCount  = products.filter((p) => p.stock > 10).length

  return (
    <div className="px-4 lg:px-6 py-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-amber-400/60" />
          <h1 className="text-base font-semibold tracking-[0.2em] text-foreground/85">INVENTORY</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-[11px] text-foreground/28 hover:text-foreground/55 transition-colors">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
          <Link href="/admin/products" className="flex items-center gap-1.5 px-3 py-1.5 border border-foreground/12 text-[11px] tracking-widest text-foreground/40 hover:text-foreground/70 transition-colors">
            + Add Product
          </Link>
        </div>
      </div>

      {/* Stock overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Out of Stock",  val: outCount,      icon: AlertCircle,  cls: "bg-rose-500/10 text-rose-400",    border: "border-rose-500/15"   },
          { label: "Critical (≤3)", val: criticalCount, icon: AlertTriangle, cls: "bg-rose-500/8 text-rose-400",    border: "border-rose-500/12"   },
          { label: "Low (4–10)",    val: lowCount,      icon: AlertTriangle, cls: "bg-amber-500/8 text-amber-400",  border: "border-amber-500/12"  },
          { label: "Healthy",       val: healthyCount,  icon: CheckCircle2, cls: "bg-emerald-500/8 text-emerald-400", border: "border-emerald-500/12" },
        ].map(({ label, val, icon: Icon, cls, border }) => (
          <div key={label} className={`rounded-2xl border ${border} bg-foreground/[0.015] p-4`}>
            <div className={`w-7 h-7 rounded-xl ${cls} flex items-center justify-center mb-2`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <p className="text-xl font-black text-foreground/82">{val}</p>
            <p className="text-[10px] tracking-widest text-foreground/28 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 flex-wrap">
          {FILTER_TABS.map(({ id, label, color }) => (
            <button key={id} onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-full text-[10px] tracking-widest border transition-all
                ${filter === id ? "border-foreground/25 bg-foreground/6 text-foreground/75" : `border-foreground/8 ${color || "text-foreground/30"} hover:border-foreground/18`}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/22" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
            className="w-full pl-8 pr-8 py-2 bg-foreground/4 border border-foreground/10 rounded-xl text-[12px] text-foreground/65 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/25 transition-colors" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/28 hover:text-foreground"><X className="h-3 w-3" /></button>}
        </div>
      </div>

      {/* Products list */}
      <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-foreground/8 text-[10px] tracking-widest text-foreground/22 uppercase">
          <span className="col-span-5">Product</span>
          <span className="col-span-2 text-right">Price</span>
          <span className="col-span-2 text-right">Sold</span>
          <span className="col-span-3 text-right">Stock</span>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="h-12 bg-foreground/4 animate-pulse rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Boxes className="h-8 w-8 mx-auto mb-2 text-foreground/10" />
            <p className="text-[11px] text-foreground/25">No products found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((p) => {
              const imgs = (() => { try { return JSON.parse(p.images) } catch { return [] } })()
              const lvl  = stockLevel(p.stock)
              return (
                <div key={p.id} className="grid grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-foreground/[0.02] transition-colors">
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-foreground/5 border border-foreground/8 flex-shrink-0">
                      {imgs[0] && <Image src={imgs[0]} alt="" width={36} height={36} className="w-full h-full object-cover opacity-70" />}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/products/${p.id}`} className="text-[12px] font-medium text-foreground/68 hover:text-foreground transition-colors truncate block">{p.name}</Link>
                      <p className="text-[10px] text-foreground/25 truncate">{p.category.name}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-[12px] text-emerald-400/70">{formatPrice(p.price)}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-[12px] text-foreground/38">{p._count.orderItems}</span>
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STOCK_BADGE[lvl]}`}>
                      {p.stock === 0 ? "OUT" : `${p.stock} left`}
                    </span>
                    <Link href="/admin/products" className="text-[10px] text-foreground/22 hover:text-foreground/55 transition-colors hidden sm:inline">Edit</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="h-4" />
    </div>
  )
}
