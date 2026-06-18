"use client"

import { useEffect, useState } from "react"
import { Users, Search, TrendingUp, UserPlus, ShoppingBag, X } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface Customer {
  id: string; name: string | null; email: string; phone: string | null
  createdAt: string; totalSpent: number; orderCount: number
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState("")

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => { setCustomers(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return !q || (c.name ?? "").toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  })

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0)
  const active       = customers.filter((c) => c.orderCount > 0).length
  const newThisMonth = customers.filter((c) => {
    const d = new Date(c.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="px-4 lg:px-6 py-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-400/60" />
          <h1 className="text-base font-semibold tracking-[0.2em] text-foreground/85">CUSTOMERS</h1>
        </div>
        <span className="text-[11px] font-mono text-foreground/30">{customers.length} registered</span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Customers", val: customers.length, icon: Users,     color: "text-violet-400",  bg: "bg-violet-500/10" },
          { label: "Active Buyers",   val: active,           icon: ShoppingBag, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "New This Month",  val: newThisMonth,     icon: UserPlus,  color: "text-blue-400",    bg: "bg-blue-500/10" },
        ].map(({ label, val, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-xl font-black text-foreground/85">{val}</p>
            <p className="text-[10px] text-foreground/28 font-mono tracking-widest mt-0.5">{label.toUpperCase()}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/22" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers…"
          className="w-full pl-8 pr-8 py-2 bg-white/4 border border-white/10 rounded-xl text-[12px] text-foreground/65 placeholder:text-foreground/20 focus:outline-none focus:border-white/25 transition-colors" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/28 hover:text-foreground"><X className="h-3 w-3" /></button>}
      </div>

      {/* Customer table */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-white/8 text-[10px] tracking-widest text-foreground/22 uppercase">
          <span className="col-span-4">Customer</span>
          <span className="col-span-2 text-right">Orders</span>
          <span className="col-span-3 text-right">Total Spent</span>
          <span className="col-span-3 text-right">Joined</span>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="h-10 bg-white/4 animate-pulse rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-8 w-8 mx-auto mb-2 text-foreground/10" />
            <p className="text-[11px] text-foreground/25 font-mono">{search ? "No customers match your search" : "No customers yet"}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.045]">
            {filtered.map((c, i) => (
              <div key={c.id} className="grid grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-violet-400">
                    {i < 3 ? ["🥇","🥈","🥉"][i] : (c.name?.[0]?.toUpperCase() ?? "?")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-foreground/70 truncate">{c.name || "—"}</p>
                    <p className="text-[10px] text-foreground/28 font-mono truncate">{c.email}</p>
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <span className={`text-[12px] font-mono ${c.orderCount > 0 ? "text-foreground/60" : "text-foreground/22"}`}>
                    {c.orderCount}
                  </span>
                </div>
                <div className="col-span-3 text-right">
                  <span className={`text-[12px] font-mono font-bold ${c.totalSpent > 0 ? "text-emerald-400" : "text-foreground/22"}`}>
                    {formatPrice(c.totalSpent)}
                  </span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-[11px] text-foreground/28 font-mono">
                    {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revenue insight */}
      {totalRevenue > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03]">
          <TrendingUp className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <p className="text-[12px] text-foreground/55">
            Top {Math.min(active, 5)} customers generated <span className="text-emerald-400 font-mono font-bold">
              {formatPrice(customers.slice(0, 5).reduce((s, c) => s + c.totalSpent, 0))}
            </span> in revenue
          </p>
        </div>
      )}
      <div className="h-4" />
    </div>
  )
}
