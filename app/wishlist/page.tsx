"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus, Heart, Target, TrendingUp, Wallet,
  Loader2, ChevronRight, Star, MoreHorizontal, Trash2, X,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

/* ── Types ───────────────────────────────────────────────────────────────── */
interface WishlistSummary {
  id: string; name: string; description: string | null
  emoji: string; color: string; targetAmount: number | null
  savedAmount: number; status: string; isDefault: boolean
  createdAt: string; totalCost: number; progressPct: number
  items: Array<{ product: { id: string; name: string; price: number; images: string[] } }>
}

/* ── Color map ───────────────────────────────────────────────────────────── */
const COLORS: Record<string, { bar: string; text: string; ring: string; bg: string; border: string }> = {
  violet:  { bar: "bg-violet-500",  text: "text-violet-400",  ring: "#a78bfa", bg: "bg-violet-500/10",  border: "border-violet-500/25" },
  rose:    { bar: "bg-rose-500",    text: "text-rose-400",    ring: "#fb7185", bg: "bg-rose-500/10",    border: "border-rose-500/25"   },
  amber:   { bar: "bg-amber-500",   text: "text-amber-400",   ring: "#fbbf24", bg: "bg-amber-500/10",   border: "border-amber-500/25"  },
  emerald: { bar: "bg-emerald-500", text: "text-emerald-400", ring: "#34d399", bg: "bg-emerald-500/10", border: "border-emerald-500/25"},
  blue:    { bar: "bg-blue-500",    text: "text-blue-400",    ring: "#60a5fa", bg: "bg-blue-500/10",    border: "border-blue-500/25"   },
  orange:  { bar: "bg-orange-500",  text: "text-orange-400",  ring: "#fb923c", bg: "bg-orange-500/10",  border: "border-orange-500/25" },
}
const C = (color: string) => COLORS[color] ?? COLORS.violet

/* ── Progress ring ───────────────────────────────────────────────────────── */
function ProgressRing({ pct, size = 72, stroke = 6, color = "#a78bfa" }: {
  pct: number; size?: number; stroke?: number; color?: string
}) {
  const r     = (size - stroke) / 2
  const circ  = 2 * Math.PI * r
  const dash  = (Math.max(0, Math.min(100, pct)) / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} strokeOpacity="0.85" />
      <text x="50%" y="50%" textAnchor="middle" dy="0.38em"
        fontSize={size * 0.215} fill="white" fontWeight="700" fontFamily="monospace">
        {Math.round(pct)}%
      </text>
    </svg>
  )
}

/* ── New goal modal ──────────────────────────────────────────────────────── */
const EMOJIS  = ["✨","🎯","🏆","💎","🚀","🎁","❤️","⚡","🌟","🎶","👟","💻","📱","🏠","✈️"]
const PALETTE = ["violet","rose","amber","emerald","blue","orange"]

function NewGoalModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName]   = useState("")
  const [emoji, setEmoji] = useState("🎯")
  const [color, setColor] = useState("violet")
  const [target, setTarget] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji, color, targetAmount: target || null }),
    })
    if (res.ok) {
      toast.success("Goal created!", { className: "font-mono text-xs" })
      onCreated()
      onClose()
    } else {
      toast.error("Failed to create goal")
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-background border border-white/15 rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground/80">New Goal</h2>
          <button onClick={onClose} className="text-foreground/30 hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        {/* Emoji picker */}
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setEmoji(e)}
              className={`w-8 h-8 rounded-lg text-lg transition-all ${emoji === e ? "bg-white/15 scale-110" : "hover:bg-white/8"}`}>
              {e}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[9px] font-mono tracking-widest text-foreground/40 block mb-1.5">GOAL NAME</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New iPhone, Birthday List…" required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-violet-500/40 transition-all" />
          </div>

          {/* Color picker */}
          <div>
            <label className="text-[9px] font-mono tracking-widest text-foreground/40 block mb-1.5">COLOR</label>
            <div className="flex gap-2">
              {PALETTE.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${C(c).bar} ${color === c ? "ring-2 ring-white/40 scale-110" : "opacity-50 hover:opacity-80"}`} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] font-mono tracking-widest text-foreground/40 block mb-1.5">SAVINGS TARGET (optional)</label>
            <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 50000"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-violet-500/40 transition-all" />
            <p className="text-[9px] font-mono text-foreground/22 mt-1">Leave blank to use total product cost as target</p>
          </div>

          <button type="submit" disabled={saving || !name.trim()}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Create Goal</>}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════════════════════ */
export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [lists,   setLists]   = useState<WishlistSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  const fetchLists = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/wishlist")
      if (res.ok) setLists(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login?callbackUrl=/wishlist"); return }
    if (status === "authenticated") fetchLists()
  }, [status, fetchLists, router])

  async function deleteList(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Products won't be affected.`)) return
    const res = await fetch(`/api/wishlist/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Goal deleted"); fetchLists() }
    else { const d = await res.json(); toast.error(d.error ?? "Failed") }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-violet-400/50" />
      </div>
    )
  }

  const goals    = lists.filter((l) => !l.isDefault)
  const savedList = lists.find((l) => l.isDefault)

  // Summary stats across all goals
  const totalCost   = goals.reduce((s, l) => s + l.totalCost, 0)
  const totalSaved  = goals.reduce((s, l) => s + l.savedAmount, 0)
  const totalTarget = goals.reduce((s, l) => s + (l.targetAmount ?? l.totalCost), 0)
  const overallPct  = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0
  const userName    = (session?.user as { name?: string | null })?.name?.split(" ")[0] ?? "you"

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-lg space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-foreground/35 font-mono">Hello, {userName}</p>
            <h1 className="text-xl font-bold text-foreground tracking-tight">My Goals</h1>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all active:scale-95">
            <Plus className="h-3.5 w-3.5" /> New Goal
          </button>
        </div>

        {/* ── Summary hero card ── */}
        {goals.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-violet-900/50 to-indigo-900/40 border border-violet-500/20 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[9px] font-mono tracking-[0.2em] text-violet-300/60 uppercase">Total Goal Progress</p>
                <p className="text-2xl font-black text-white tracking-tight">{formatPrice(totalSaved)}</p>
                <p className="text-xs text-foreground/40">of {formatPrice(totalTarget)} across {goals.length} goal{goals.length !== 1 ? "s" : ""}</p>
                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full transition-all"
                    style={{ width: `${overallPct}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-foreground/30 mt-1">
                  <span>Saved</span><span>{formatPrice(Math.max(0, totalTarget - totalSaved))} remaining</span>
                </div>
              </div>
              <ProgressRing pct={overallPct} size={80} stroke={7} color="#a78bfa" />
            </div>

            {/* 3 stat chips */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "Total Value", val: formatPrice(totalCost),                   icon: Target  },
                { label: "Saved",       val: formatPrice(totalSaved),                  icon: Wallet  },
                { label: "Remaining",   val: formatPrice(Math.max(0, totalCost - totalSaved)), icon: TrendingUp },
              ].map(({ label, val, icon: Icon }) => (
                <div key={label} className="rounded-xl bg-white/[0.04] border border-white/8 p-2.5 text-center">
                  <Icon className="h-3 w-3 text-violet-400/60 mx-auto mb-1" />
                  <p className="text-[10px] font-bold text-foreground/80 font-mono">{val}</p>
                  <p className="text-[8px] text-foreground/30 font-mono mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Goal cards ── */}
        {goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center space-y-3">
            <div className="text-4xl">🎯</div>
            <p className="text-sm text-foreground/50">No goals yet</p>
            <p className="text-xs text-foreground/28">Create a goal to track your savings toward specific products</p>
            <button onClick={() => setShowNew(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/25 text-violet-400 text-xs font-mono">
              <Plus className="h-3.5 w-3.5" /> Create your first goal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] font-mono tracking-widest text-foreground/35 uppercase">MY GOALS</p>
            {goals.map((goal) => {
              const c = C(goal.color)
              const base = goal.targetAmount ?? goal.totalCost
              return (
                <Link key={goal.id} href={`/wishlist/${goal.id}`}
                  className="block rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all active:scale-[0.99] overflow-hidden">
                  {/* Color accent top bar */}
                  <div className={`h-[3px] w-full ${c.bar} opacity-70`} />
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Emoji + progress ring */}
                      <div className="relative flex-shrink-0">
                        <ProgressRing pct={goal.progressPct} size={54} stroke={5} color={c.ring} />
                        <span className="absolute inset-0 flex items-center justify-center text-xl pointer-events-none opacity-0">
                          {goal.emoji}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-lg">{goal.emoji}</span>
                          <p className="text-sm font-semibold text-foreground/85 truncate">{goal.name}</p>
                          {goal.status === "completed" && (
                            <span className="text-[8px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              DONE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-foreground/40 font-mono">
                          {goal.items.length} item{goal.items.length !== 1 ? "s" : ""} · {formatPrice(goal.totalCost)}
                        </p>
                        {/* Progress bar */}
                        <div className="mt-2 h-1 bg-white/6 rounded-full overflow-hidden">
                          <div className={`h-full ${c.bar} rounded-full transition-all`}
                            style={{ width: `${goal.progressPct}%` }} />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-[9px] font-mono font-semibold ${c.text}`}>
                            {formatPrice(goal.savedAmount)} saved
                          </span>
                          {base > 0 && (
                            <span className="text-[9px] font-mono text-foreground/28">
                              {formatPrice(Math.max(0, base - goal.savedAmount))} left
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <ChevronRight className="h-4 w-4 text-foreground/20" />
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteList(goal.id, goal.name) }}
                          className="text-foreground/18 hover:text-rose-400/70 transition-colors p-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Product thumbnails */}
                    {goal.items.length > 0 && (
                      <div className="flex gap-1.5 mt-3">
                        {goal.items.slice(0, 5).map((item) => (
                          <div key={item.product.id} className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 overflow-hidden flex-shrink-0">
                            {item.product.images?.[0] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.product.images[0]} alt="" className="w-full h-full object-cover opacity-70" />
                            )}
                          </div>
                        ))}
                        {goal.items.length > 5 && (
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-[8px] font-mono text-foreground/35">
                            +{goal.items.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Saved Items quick card ── */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono tracking-widest text-foreground/35 uppercase">Saved Items</p>
          <Link href={savedList ? `/wishlist/${savedList.id}` : "/products"}
            className="flex items-center gap-3.5 rounded-2xl border border-rose-500/15 bg-rose-500/[0.04] hover:bg-rose-500/[0.07] transition-all p-4 active:scale-[0.99]">
            <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center flex-shrink-0">
              <Heart className="h-5 w-5 text-rose-400 fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground/80">Saved Items</p>
              <p className="text-xs text-foreground/38">
                {savedList ? `${savedList.items.length} product${savedList.items.length !== 1 ? "s" : ""} liked` : "Heart products to save them here"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-foreground/20 flex-shrink-0" />
          </Link>
        </div>

        {/* ── Browse CTA ── */}
        <Link href="/products"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/8 text-foreground/40 hover:text-foreground/70 hover:border-white/15 transition-all text-sm font-mono">
          <Star className="h-4 w-4" /> Browse Products to Add
        </Link>

        <div className="h-4" />
      </div>

      {showNew && <NewGoalModal onClose={() => setShowNew(false)} onCreated={fetchLists} />}
    </div>
  )
}
