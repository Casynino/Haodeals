"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Heart, Plus, Trash2, ShoppingCart, Zap,
  Loader2, X, FolderPlus, ChevronRight, ArrowLeft,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useCart } from "@/hooks/useCart"
import { toast } from "sonner"

/* ── Types ───────────────────────────────────────────────────────────────── */
interface WishlistProduct {
  id: string; name: string; price: number; originalPrice: number | null
  images: string[]; stock: number; category: { name: string }
}
interface WishlistItem  { id: string; addedAt: string; product: WishlistProduct }
interface WishlistData  {
  id: string; name: string; emoji: string; color: string
  isDefault: boolean; items: WishlistItem[]; totalCost: number
}

const COLOR_BAR: Record<string, string> = {
  violet: "bg-violet-500", rose: "bg-rose-500", amber: "bg-amber-500",
  emerald: "bg-emerald-500", blue: "bg-blue-500", orange: "bg-orange-500",
}
const COLOR_TEXT: Record<string, string> = {
  violet: "text-violet-400", rose: "text-rose-400", amber: "text-amber-400",
  emerald: "text-emerald-400", blue: "text-blue-400", orange: "text-orange-400",
}

/* ── New list modal ──────────────────────────────────────────────────────── */
const EMOJIS  = ["📁","🎯","💎","🚀","🎁","❤️","⚡","🌟","👟","💻","📱","🏠","✈️","🛍️","🎶"]
const PALETTE = ["violet","rose","amber","emerald","blue","orange"]

function NewListModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("📁")
  const [color, setColor] = useState("violet")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji, color }),
    })
    if (res.ok) { toast.success("List created!"); onCreated(); onClose() }
    else toast.error("Failed to create list")
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="w-full max-w-sm bg-background border border-white/12 rounded-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground/80">New List</h2>
          <button onClick={onClose} className="text-foreground/30 hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => setEmoji(e)}
              className={`w-8 h-8 rounded-lg text-lg transition-all ${emoji === e ? "bg-white/15 scale-110" : "hover:bg-white/8"}`}>{e}</button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="List name…" required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/25 focus:outline-none focus:border-violet-500/40 transition-all" />
          <div className="flex gap-2">
            {PALETTE.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-all ${COLOR_BAR[c]} ${color === c ? "ring-2 ring-white/40 scale-110" : "opacity-50 hover:opacity-80"}`} />
            ))}
          </div>
          <button type="submit" disabled={saving || !name.trim()}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FolderPlus className="h-4 w-4" /> Create List</>}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Product card (inside wishlist) ─────────────────────────────────────── */
function WishlistProductCard({
  item, wishlistId, onRemove,
}: { item: WishlistItem; wishlistId: string; onRemove: () => void }) {
  const { addItem, setBuyNow } = useCart()
  const router = useRouter()
  const img = item.product.images?.[0]
  const outOfStock = item.product.stock === 0

  async function handleRemove(e: React.MouseEvent) {
    e.preventDefault()
    await fetch(`/api/wishlist/${wishlistId}/items/${item.product.id}`, { method: "DELETE" })
    toast("Removed from list", { className: "font-mono text-xs" })
    onRemove()
  }

  return (
    <div className="group relative rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/15 transition-all">

      {/* Remove button — always visible on mobile, hover on desktop */}
      <button
        onClick={handleRemove}
        className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/50 hover:text-rose-400 hover:border-rose-500/30 transition-all sm:opacity-0 sm:group-hover:opacity-100 opacity-100"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Clickable product area — entire image + info navigates to product */}
      <Link href={`/products/${item.product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-white/5">
          {img
            ? <Image src={img} alt={item.product.name} width={200} height={200}
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" />
            : <div className="w-full h-full flex items-center justify-center text-foreground/15"><Heart className="h-8 w-8" /></div>
          }
          {outOfStock && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="text-[9px] font-mono text-foreground/50 border border-white/20 px-2 py-0.5">OUT OF STOCK</span>
            </div>
          )}
        </div>

        <div className="p-3 space-y-1.5">
          <p className="text-[9px] text-foreground/35 font-mono uppercase tracking-widest">{item.product.category.name}</p>
          <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed group-hover:text-foreground transition-colors">{item.product.name}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-emerald-400 font-mono">{formatPrice(item.product.price)}</span>
            {item.product.originalPrice && (
              <span className="text-[9px] text-foreground/30 line-through font-mono">{formatPrice(item.product.originalPrice)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Action buttons — outside the Link so they don't navigate */}
      <div className="px-3 pb-3 flex gap-1.5">
        <button
          disabled={outOfStock}
          onClick={(e) => { e.preventDefault(); setBuyNow(item.product as any); router.push("/checkout") }}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#ee0000] hover:bg-red-700 text-white text-[9px] font-mono font-bold tracking-widest rounded-lg transition-all active:scale-95 disabled:opacity-40"
        >
          <Zap className="h-2.5 w-2.5" /> BUY NOW
        </button>
        <button
          disabled={outOfStock}
          onClick={(e) => { e.preventDefault(); addItem(item.product as any); toast.success("Added to bag", { className: "font-mono text-xs" }) }}
          className="px-2.5 py-1.5 border border-white/15 text-foreground/50 hover:text-foreground/80 hover:border-white/30 rounded-lg transition-all active:scale-95 disabled:opacity-40"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN WISHLIST PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [lists,   setLists]   = useState<WishlistData[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("all")

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

  async function deleteList(id: string) {
    if (!confirm("Delete this list? Products won't be affected.")) return
    const res = await fetch(`/api/wishlist/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("List deleted"); fetchLists() }
    else { const d = await res.json(); toast.error(d.error ?? "Failed") }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-rose-400/50" />
      </div>
    )
  }

  const user = session?.user as { name?: string | null } | undefined
  const firstName = user?.name?.split(" ")[0] ?? "you"

  // All items across all lists (deduplicated by product id) for "All" tab
  const defaultList = lists.find((l) => l.isDefault)
  const customLists = lists.filter((l) => !l.isDefault)
  const activeList  = activeTab === "all"
    ? defaultList
    : lists.find((l) => l.id === activeTab)

  const totalSaved = lists.reduce((s, l) => s + l.totalCost, 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-lg space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-foreground/35 font-mono">Saved items,</p>
            <h1 className="text-xl font-bold text-foreground tracking-tight">My Wishlist</h1>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/12 text-foreground/50 hover:text-foreground/80 hover:border-white/22 text-xs font-mono transition-all active:scale-95">
            <FolderPlus className="h-3.5 w-3.5" /> New List
          </button>
        </div>

        {/* ── Summary ── */}
        {(defaultList?.items.length ?? 0) > 0 && (
          <div className="flex items-center gap-4 px-4 py-3 rounded-2xl border border-white/8 bg-white/[0.02]">
            <div className="w-9 h-9 rounded-full bg-rose-500/15 flex items-center justify-center flex-shrink-0">
              <Heart className="h-4 w-4 text-rose-400 fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground/80">
                {defaultList?.items.length} saved product{(defaultList?.items.length ?? 0) !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-foreground/35 font-mono">Total value: {formatPrice(totalSaved)}</p>
            </div>
            <Link href="/products" className="text-[9px] font-mono text-foreground/30 hover:text-foreground/60 transition-colors flex items-center gap-1">
              Add more <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* ── Tabs: All + custom lists ── */}
        {customLists.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button onClick={() => setActiveTab("all")}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-mono border transition-all
                ${activeTab === "all" ? "bg-rose-500/15 border-rose-500/30 text-rose-400" : "border-white/10 text-foreground/40 hover:border-white/20"}`}>
              ❤️ Saved
            </button>
            {customLists.map((l) => (
              <button key={l.id} onClick={() => setActiveTab(l.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono border transition-all
                  ${activeTab === l.id ? `${COLOR_TEXT[l.color] ?? "text-violet-400"} border-current/30 bg-current/5` : "border-white/10 text-foreground/40 hover:border-white/20"}`}>
                <span>{l.emoji}</span> {l.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Products grid ── */}
        {activeList?.items.length === 0 || (!activeList && (defaultList?.items.length ?? 0) === 0) ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center space-y-3">
            <Heart className="h-10 w-10 text-foreground/10 mx-auto" />
            <p className="text-sm text-foreground/40">
              {activeTab === "all" ? "No saved products yet" : "This list is empty"}
            </p>
            <p className="text-xs text-foreground/22">Tap the ❤ on any product to save it here</p>
            <Link href="/products"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono hover:bg-rose-500/15 transition-all">
              <Plus className="h-3.5 w-3.5" /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(activeList ?? defaultList)?.items.map((item) => (
              <WishlistProductCard
                key={item.id}
                item={item}
                wishlistId={(activeList ?? defaultList)!.id}
                onRemove={fetchLists}
              />
            ))}
          </div>
        )}

        {/* ── Custom lists section (if on "All" tab) ── */}
        {activeTab === "all" && customLists.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono tracking-widest text-foreground/35 uppercase">My Lists</p>
              <button onClick={() => setShowNew(true)}
                className="text-[9px] font-mono text-foreground/30 hover:text-foreground/60 flex items-center gap-1 transition-colors">
                <Plus className="h-3 w-3" /> New
              </button>
            </div>
            {customLists.map((list) => (
              <div key={list.id} className="flex items-center gap-3.5 rounded-2xl border border-white/8 bg-white/[0.02] p-4 hover:border-white/14 transition-all">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${COLOR_BAR[list.color] ?? "bg-violet-500"} bg-opacity-20`}>
                  <span className="text-lg">{list.emoji}</span>
                </div>
                <button onClick={() => setActiveTab(list.id)} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-foreground/80">{list.name}</p>
                  <p className="text-[10px] text-foreground/35 font-mono">{list.items.length} product{list.items.length !== 1 ? "s" : ""} · {formatPrice(list.totalCost)}</p>
                </button>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <ChevronRight className="h-4 w-4 text-foreground/20" />
                  <button onClick={() => deleteList(list.id)} className="text-foreground/18 hover:text-rose-400/70 transition-colors p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state (no lists at all) ── */}
        {lists.length === 0 && !loading && (
          <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center space-y-3">
            <Heart className="h-10 w-10 text-foreground/10 mx-auto" />
            <p className="text-sm text-foreground/40">Your wishlist is empty</p>
            <p className="text-xs text-foreground/22">Tap the ❤ on any product to start saving</p>
            <Link href="/products"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
              <Plus className="h-3.5 w-3.5" /> Browse Products
            </Link>
          </div>
        )}

        <div className="h-6" />
      </div>

      {showNew && <NewListModal onClose={() => setShowNew(false)} onCreated={fetchLists} />}
    </div>
  )
}
