"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft, Pencil, Trash2, Plus, X, Check,
  Loader2, ShoppingCart, ShoppingBag, ExternalLink, Zap,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useCart } from "@/hooks/useCart"
import { toast } from "sonner"

/* ── Types ───────────────────────────────────────────────────────────────── */
interface WishlistDetail {
  id: string; name: string; description: string | null
  emoji: string; color: string; targetAmount: number | null
  savedAmount: number; status: string; isDefault: boolean
  totalCost: number; progressPct: number
  items: Array<{
    id: string; addedAt: string
    product: {
      id: string; name: string; price: number; originalPrice: number | null
      images: string[]; stock: number; category: { name: string }
    }
  }>
}

/* ── Color map ───────────────────────────────────────────────────────────── */
const COLORS: Record<string, { bar: string; text: string; ring: string; bg: string; border: string; btn: string }> = {
  violet:  { bar: "bg-violet-500",  text: "text-violet-400",  ring: "#a78bfa", bg: "bg-violet-500/10",  border: "border-violet-500/25", btn: "bg-violet-600 hover:bg-violet-500" },
  rose:    { bar: "bg-rose-500",    text: "text-rose-400",    ring: "#fb7185", bg: "bg-rose-500/10",    border: "border-rose-500/25",   btn: "bg-rose-600 hover:bg-rose-500"    },
  amber:   { bar: "bg-amber-500",   text: "text-amber-400",   ring: "#fbbf24", bg: "bg-amber-500/10",   border: "border-amber-500/25",  btn: "bg-amber-600 hover:bg-amber-500"  },
  emerald: { bar: "bg-emerald-500", text: "text-emerald-400", ring: "#34d399", bg: "bg-emerald-500/10", border: "border-emerald-500/25",btn: "bg-emerald-600 hover:bg-emerald-500"},
  blue:    { bar: "bg-blue-500",    text: "text-blue-400",    ring: "#60a5fa", bg: "bg-blue-500/10",    border: "border-blue-500/25",   btn: "bg-blue-600 hover:bg-blue-500"    },
  orange:  { bar: "bg-orange-500",  text: "text-orange-400",  ring: "#fb923c", bg: "bg-orange-500/10",  border: "border-orange-500/25", btn: "bg-orange-600 hover:bg-orange-500"},
}
const C = (color: string) => COLORS[color] ?? COLORS.violet

/* ── Progress ring ───────────────────────────────────────────────────────── */
function ProgressRing({ pct, size = 100, stroke = 8, color = "#a78bfa", label }: {
  pct: number; size?: number; stroke?: number; color?: string; label?: string
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, pct)) / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} strokeOpacity="0.85" />
      <text x="50%" y="44%" textAnchor="middle" dy="0.35em"
        fontSize={size * 0.22} fill="white" fontWeight="800" fontFamily="monospace">
        {Math.round(pct)}%
      </text>
      {label && (
        <text x="50%" y="64%" textAnchor="middle" dy="0.35em"
          fontSize={size * 0.10} fill="rgba(255,255,255,0.35)" fontFamily="monospace">
          {label}
        </text>
      )}
    </svg>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   GOAL DETAIL PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addItem, setBuyNow } = useCart()

  const [goal,       setGoal]       = useState<WishlistDetail | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [editing,    setEditing]    = useState(false)
  const [editName,   setEditName]   = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  // Savings update
  const [showSave,   setShowSave]   = useState(false)
  const [newSaved,   setNewSaved]   = useState("")
  const [updatingSaved, setUpdatingSaved] = useState(false)

  const fetchGoal = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/wishlist/${id}`)
      if (res.ok) {
        const data = await res.json()
        setGoal(data)
        setEditName(data.name)
        setNewSaved(data.savedAmount.toString())
      } else {
        router.push("/wishlist")
      }
    } finally { setLoading(false) }
  }, [id, router])

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login?callbackUrl=/wishlist"); return }
    if (status === "authenticated") fetchGoal()
  }, [status, fetchGoal, router])

  async function saveEdit() {
    if (!editName.trim() || !goal) return
    setSavingEdit(true)
    const res = await fetch(`/api/wishlist/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    })
    if (res.ok) { await fetchGoal(); setEditing(false); toast.success("Updated") }
    setSavingEdit(false)
  }

  async function updateSaved() {
    if (!goal) return
    const amount = parseFloat(newSaved)
    if (isNaN(amount) || amount < 0) { toast.error("Invalid amount"); return }
    setUpdatingSaved(true)
    const res = await fetch(`/api/wishlist/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedAmount: amount }),
    })
    if (res.ok) {
      await fetchGoal()
      setShowSave(false)
      toast.success("Savings updated ✓", { className: "font-mono text-xs" })
    }
    setUpdatingSaved(false)
  }

  async function removeItem(productId: string) {
    if (!goal) return
    await fetch(`/api/wishlist/${goal.id}/items/${productId}`, { method: "DELETE" })
    fetchGoal()
    toast("Removed from goal", { className: "font-mono text-xs" })
  }

  async function markComplete() {
    if (!goal) return
    const nextStatus = goal.status === "completed" ? "active" : "completed"
    await fetch(`/api/wishlist/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
    fetchGoal()
    if (nextStatus === "completed") toast.success("Goal marked complete 🎉")
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-violet-400/50" />
      </div>
    )
  }
  if (!goal) return null

  const c    = C(goal.color)
  const base = goal.targetAmount ?? goal.totalCost
  const remaining = Math.max(0, base - goal.savedAmount)
  const pct  = goal.progressPct

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-lg space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 pt-2">
          <Link href="/wishlist" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-foreground/40 hover:text-foreground hover:border-white/25 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus
                  className="flex-1 bg-white/5 border border-white/15 rounded-lg px-2.5 py-1 text-sm text-foreground/85 focus:outline-none focus:border-violet-500/40 min-w-0"
                  onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false) }} />
                <button onClick={saveEdit} disabled={savingEdit} className="text-emerald-400 hover:text-emerald-300">
                  {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button onClick={() => setEditing(false)} className="text-foreground/30 hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xl">{goal.emoji}</span>
                <h1 className="text-lg font-bold text-foreground truncate">{goal.name}</h1>
                {!goal.isDefault && (
                  <button onClick={() => setEditing(true)} className="text-foreground/25 hover:text-foreground/60 flex-shrink-0">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Mark complete button */}
          {!goal.isDefault && (
            <button onClick={markComplete}
              className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-all ${
                goal.status === "completed"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                  : "border-white/10 text-foreground/30 hover:border-white/20"
              }`}>
              {goal.status === "completed" ? "✓ DONE" : "MARK DONE"}
            </button>
          )}
        </div>

        {/* ── Progress hero ── */}
        {!goal.isDefault && (
          <div className={`rounded-2xl border ${c.border} ${c.bg} p-5`}>
            <div className="flex items-center gap-5">
              <ProgressRing pct={pct} size={96} stroke={8} color={c.ring} label="complete" />
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Target",    val: formatPrice(base),          color: "text-foreground/65" },
                    { label: "Saved",     val: formatPrice(goal.savedAmount), color: c.text              },
                    { label: "Remaining", val: formatPrice(remaining),      color: "text-foreground/50" },
                    { label: "Products",  val: `${goal.items.length} items`, color: "text-foreground/50"},
                  ].map(({ label, val, color }) => (
                    <div key={label} className="rounded-xl bg-white/[0.04] border border-white/6 p-2.5">
                      <p className={`text-[13px] font-bold font-mono ${color}`}>{val}</p>
                      <p className="text-[10px] text-foreground/28 font-mono mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                {/* Add savings button */}
                <button onClick={() => setShowSave(!showSave)}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${c.btn} text-white`}>
                  + Update Savings
                </button>
              </div>
            </div>

            {/* Inline savings updater */}
            {showSave && (
              <div className="mt-4 pt-4 border-t border-white/8 flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-[11px] font-mono tracking-widest text-foreground/35 block mb-1">AMOUNT SAVED SO FAR (TZS)</label>
                  <input type="number" value={newSaved} onChange={(e) => setNewSaved(e.target.value)} min={0}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/80 focus:outline-none focus:border-violet-500/40 transition-all" />
                </div>
                <button onClick={updateSaved} disabled={updatingSaved}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5">
                  {updatingSaved ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Products section ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-mono tracking-widest text-foreground/35 uppercase">
              {goal.isDefault ? "Saved Products" : "Products in Goal"}
              <span className="ml-2 text-foreground/20">{goal.items.length}</span>
            </p>
            <Link href={`/products?wishlist=${goal.id}`}
              className="flex items-center gap-1 text-[11px] font-mono text-foreground/30 hover:text-foreground/60 transition-colors">
              <Plus className="h-3 w-3" /> Add products
            </Link>
          </div>

          {goal.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/8 py-12 text-center space-y-2">
              <ShoppingBag className="h-8 w-8 text-foreground/12 mx-auto" />
              <p className="text-sm text-foreground/30">No products yet</p>
              <Link href="/products" className="inline-flex items-center gap-1.5 text-xs text-violet-400/70 hover:text-violet-400 transition-colors font-mono mt-1">
                <Plus className="h-3 w-3" /> Browse & save products
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {goal.items.map((item) => {
                const imgs = item.product.images
                const img  = Array.isArray(imgs) ? imgs[0] : undefined
                return (
                  <div key={item.id} className="flex items-center gap-3.5 rounded-2xl border border-white/7 bg-white/[0.02] hover:bg-white/[0.035] transition-all p-3.5">
                    {/* Product image */}
                    <Link href={`/products/${item.product.id}`} className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/8 overflow-hidden">
                        {img ? (
                          <Image src={img} alt={item.product.name} width={56} height={56} className="w-full h-full object-cover opacity-80" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/15">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product.id}`}>
                        <p className="text-[13px] font-medium text-foreground/75 truncate hover:text-foreground transition-colors leading-tight">
                          {item.product.name}
                        </p>
                      </Link>
                      <p className="text-[11px] text-foreground/28 font-mono mt-0.5">{item.product.category.name}</p>
                      <p className="text-sm font-bold text-emerald-400 font-mono mt-1">{formatPrice(item.product.price)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => { addItem(item.product as any); toast.success("Added to bag") }}
                        disabled={item.product.stock === 0}
                        title="Add to Bag"
                        className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:border-white/20 transition-all disabled:opacity-30"
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        title="Remove from goal"
                        className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-foreground/25 hover:text-rose-400/70 hover:border-rose-500/20 transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Total row ── */}
        {goal.items.length > 0 && (
          <div className={`rounded-2xl border ${c.border} ${c.bg} px-4 py-3 flex items-center justify-between`}>
            <div>
              <p className="text-[11px] font-mono text-foreground/35 uppercase tracking-widest">Total Cost</p>
              <p className="text-base font-black text-white font-mono">{formatPrice(goal.totalCost)}</p>
            </div>
            <Link href="/checkout"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl ${c.btn} text-white text-xs font-semibold transition-all active:scale-95`}>
              <Zap className="h-3.5 w-3.5" /> Checkout All
            </Link>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  )
}
