"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Heart, Plus, ShoppingCart, Zap, Loader2,
  X, Sparkles, TrendingUp,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useCart } from "@/hooks/useCart"
import { toast } from "sonner"

/* ── Types ───────────────────────────────────────────────────────────────── */
interface WProduct {
  id: string; name: string; price: number; originalPrice: number | null
  images: string[]; stock: number; category?: { name: string }
}
interface WItem { id: string; addedAt: string; product: WProduct }
interface WList  {
  id: string; name: string; isDefault: boolean
  items: WItem[]; totalCost: number
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function parseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[]
  try { return JSON.parse(raw as string) } catch { return [] }
}

/* ── Skeleton card ───────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden animate-pulse">
      <div className="aspect-square bg-white/5" />
      <div className="p-3 space-y-2">
        <div className="h-2 bg-white/8 rounded w-2/3" />
        <div className="h-3 bg-white/6 rounded w-full" />
        <div className="h-3 bg-white/6 rounded w-3/4" />
        <div className="h-5 bg-white/8 rounded w-1/2 mt-1" />
        <div className="h-7 bg-white/5 rounded mt-2" />
      </div>
    </div>
  )
}

/* ── Wishlist product card ───────────────────────────────────────────────── */
function WishlistCard({ item, listId, onRemove }: {
  item: WItem; listId: string; onRemove: () => void
}) {
  const { addItem, setBuyNow } = useCart()
  const router = useRouter()
  const imgs = parseImages(item.product.images)
  const img  = imgs[0] ?? null
  const oos  = (item.product.stock ?? 0) === 0
  const disc = item.product.originalPrice
    ? Math.round(((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100)
    : null

  async function remove(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    await fetch(`/api/wishlist/${listId}/items/${item.product.id}`, { method: "DELETE" })
    toast("Removed", { className: "font-mono text-xs" })
    onRemove()
  }

  return (
    <div className="group relative rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/18 transition-all">
      {/* Remove */}
      <button onClick={remove}
        className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/45 hover:text-rose-400 hover:border-rose-500/30 transition-all">
        <X className="h-3 w-3" />
      </button>

      {/* Discount badge */}
      {disc && (
        <div className="absolute top-2 left-2 z-10 bg-[#ee0000] text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded">
          -{disc}%
        </div>
      )}

      {/* Image + info → navigates to product */}
      <Link href={`/products/${item.product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-white/5">
          {img
            ? <Image src={img} alt={item.product.name} width={220} height={220}
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" />
            : <div className="w-full h-full flex items-center justify-center"><Heart className="h-8 w-8 text-foreground/10" /></div>
          }
          {oos && (
            <div className="absolute inset-0 bg-background/75 flex items-center justify-center">
              <span className="text-[8px] font-mono text-foreground/50 border border-white/20 px-2 py-0.5">OUT OF STOCK</span>
            </div>
          )}
        </div>

        <div className="p-3 space-y-1">
          <p className="text-[8px] text-foreground/30 font-mono uppercase tracking-widest truncate">
            {item.product.category?.name ?? ""}
          </p>
          <p className="text-[11px] text-foreground/80 line-clamp-2 leading-snug group-hover:text-foreground transition-colors font-medium">
            {item.product.name}
          </p>
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-sm font-bold text-emerald-400 font-mono">{formatPrice(item.product.price)}</span>
            {item.product.originalPrice && (
              <span className="text-[9px] text-foreground/28 line-through font-mono">{formatPrice(item.product.originalPrice)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Actions — outside Link */}
      <div className="px-3 pb-3 flex gap-1.5">
        <button disabled={oos}
          onClick={(e) => { e.preventDefault(); setBuyNow(item.product as any); router.push("/checkout") }}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#ee0000] hover:bg-red-700 text-white text-[8px] font-mono font-bold tracking-widest rounded-lg transition-all active:scale-95 disabled:opacity-40">
          <Zap className="h-2.5 w-2.5" /> BUY NOW
        </button>
        <button disabled={oos}
          onClick={(e) => { e.preventDefault(); addItem(item.product as any); toast.success("Added to bag", { className: "font-mono text-xs" }) }}
          className="px-2.5 py-1.5 border border-white/15 text-foreground/45 hover:text-foreground/75 hover:border-white/30 rounded-lg transition-all active:scale-95 disabled:opacity-40">
          <ShoppingCart className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ── Recommendation card ─────────────────────────────────────────────────── */
function RecoCard({ product }: { product: WProduct & { category?: { name: string } } }) {
  const { addItem } = useCart()
  const imgs = parseImages(product.images)
  const img  = imgs[0] ?? null
  const disc = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  return (
    <div className="group relative flex-shrink-0 w-36 rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/18 transition-all">
      {disc && (
        <div className="absolute top-2 left-2 z-10 bg-[#ee0000] text-white text-[7px] font-mono font-bold px-1.5 py-0.5 rounded">
          -{disc}%
        </div>
      )}
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative w-full h-36 overflow-hidden bg-white/5">
          {img
            ? <Image src={img} alt={product.name} fill
                className="object-cover opacity-85 group-hover:opacity-100 transition-opacity" />
            : <div className="w-full h-full flex items-center justify-center"><TrendingUp className="h-6 w-6 text-foreground/10" /></div>
          }
        </div>
        <div className="p-2.5 space-y-0.5">
          <p className="text-[8px] text-foreground/28 font-mono truncate">{product.category?.name ?? ""}</p>
          <p className="text-[10px] text-foreground/75 line-clamp-2 leading-snug font-medium group-hover:text-foreground transition-colors">{product.name}</p>
          <p className="text-[11px] font-bold text-emerald-400 font-mono pt-0.5">{formatPrice(product.price)}</p>
        </div>
      </Link>
      <div className="px-2.5 pb-2.5">
        <button
          onClick={(e) => { e.preventDefault(); addItem(product as any); toast.success("Added to bag", { className: "font-mono text-xs" }) }}
          disabled={(product.stock ?? 0) === 0}
          className="w-full flex items-center justify-center gap-1 py-1.5 border border-white/12 text-foreground/40 hover:text-foreground/70 hover:border-white/25 rounded-xl text-[8px] font-mono transition-all active:scale-95 disabled:opacity-30">
          <Plus className="h-2.5 w-2.5" /> Add to Bag
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [list,      setList]      = useState<WList | null>(null)
  const [recos,     setRecos]     = useState<WProduct[]>([])
  const [loading,   setLoading]   = useState(true)
  const [recoLoad,  setRecoLoad]  = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/wishlist")
      if (res.ok) {
        const all: WList[] = await res.json()
        const def = all.find((l) => l.isDefault) ?? null
        setList(def)
      }
    } finally { setLoading(false) }
  }, [])

  const fetchRecos = useCallback(async () => {
    setRecoLoad(true)
    try {
      const res = await fetch("/api/wishlist/recommendations")
      if (res.ok) setRecos(await res.json())
    } finally { setRecoLoad(false) }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login?callbackUrl=/wishlist"); return }
    if (status === "authenticated") { fetchAll(); fetchRecos() }
  }, [status, fetchAll, fetchRecos, router])

  // After removing an item, refresh recommendations too (tastes may shift)
  const handleRemove = useCallback(() => { fetchAll(); fetchRecos() }, [fetchAll, fetchRecos])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-rose-400/50" />
      </div>
    )
  }

  const items = list?.items ?? []
  const user  = session?.user as { name?: string | null } | undefined
  const name  = user?.name?.split(" ")[0] ?? "you"

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-foreground/35 font-mono">Hello, {name}</p>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              My Wishlist
              {items.length > 0 && (
                <span className="text-sm font-normal text-foreground/35">({items.length})</span>
              )}
            </h1>
          </div>
          <Link href="/products"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono hover:bg-rose-500/15 transition-all active:scale-95">
            <Plus className="h-3.5 w-3.5" /> Add Products
          </Link>
        </div>

        {/* ── Saved products grid ── */}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/15 flex items-center justify-center mx-auto">
              <Heart className="h-6 w-6 text-rose-400/60" />
            </div>
            <p className="text-sm font-semibold text-foreground/50">Nothing saved yet</p>
            <p className="text-xs text-foreground/28">Tap the ❤ on any product to save it here</p>
            <Link href="/products"
              className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono hover:bg-rose-500/15 transition-all">
              <Plus className="h-3.5 w-3.5" /> Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-rose-500/[0.05] border border-rose-500/12">
              <Heart className="h-4 w-4 text-rose-400 fill-current flex-shrink-0" />
              <p className="text-xs text-foreground/55 flex-1">
                <span className="font-semibold text-foreground/80">{items.length} product{items.length !== 1 ? "s" : ""}</span>
                {" "}saved · total value{" "}
                <span className="text-emerald-400 font-mono font-semibold">{formatPrice(list?.totalCost ?? 0)}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => (
                <WishlistCard key={item.id} item={item} listId={list!.id} onRemove={handleRemove} />
              ))}
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
            AI RECOMMENDATIONS
        ═══════════════════════════════════════════════════════════════ */}
        <div className="space-y-3 pt-2">
          {/* Section header */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/75">Recommended for You</p>
              <p className="text-[9px] text-foreground/30 font-mono">
                {items.length > 0
                  ? "Based on your saved products & taste"
                  : "Popular & featured products"}
              </p>
            </div>
          </div>

          {/* Horizontal scroll row */}
          {recoLoad ? (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {[1,2,3,4].map((i) => (
                <div key={i} className="flex-shrink-0 w-36 rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden animate-pulse">
                  <div className="w-full h-36 bg-white/5" />
                  <div className="p-2.5 space-y-1.5">
                    <div className="h-2 bg-white/8 rounded w-2/3" />
                    <div className="h-3 bg-white/6 rounded w-full" />
                    <div className="h-4 bg-white/8 rounded w-1/2" />
                    <div className="h-6 bg-white/5 rounded mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : recos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/8 py-8 text-center">
              <p className="text-xs text-foreground/30 font-mono">Save some products to unlock personalised picks</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar">
              {recos.map((p) => <RecoCard key={p.id} product={p} />)}
            </div>
          )}
        </div>

        <div className="h-6" />
      </div>
    </div>
  )
}
