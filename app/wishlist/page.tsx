"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Heart, Plus, ShoppingCart, Zap, Loader2,
  X, Sparkles, ShoppingBag,
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
interface WList  { id: string; name: string; isDefault: boolean; items: WItem[]; totalCost: number }

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function parseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[]
  try { return JSON.parse(raw as string) } catch { return [] }
}

function discount(p: WProduct) {
  return p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : null
}

/* ── Rotating recommendation headlines ──────────────────────────────────── */
const HEADLINES = [
  { title: "You might also love",        emoji: "❤️" },
  { title: "Picked just for you",        emoji: "✨" },
  { title: "Things you'll vibe with",    emoji: "🔥" },
  { title: "Your next favourites",       emoji: "💫" },
  { title: "We think you'd love these",  emoji: "🛍️" },
]

/* ── Skeleton loaders ────────────────────────────────────────────────────── */
function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1,2,3,4].map((i) => (
        <div key={i} className="rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden animate-pulse">
          <div className="aspect-square bg-white/5" />
          <div className="p-3 space-y-2">
            <div className="h-2 bg-white/8 rounded w-1/2" />
            <div className="h-3 bg-white/6 rounded w-full" />
            <div className="h-4 bg-white/8 rounded w-2/5" />
            <div className="h-7 bg-white/5 rounded mt-1" />
          </div>
        </div>
      ))}
    </div>
  )
}

function CarouselSkeleton() {
  return (
    <div className="flex gap-3 px-4">
      {[1,2,3,4,5].map((i) => (
        <div key={i} className="flex-shrink-0 w-40 rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden animate-pulse">
          <div className="w-full h-40 bg-white/5" />
          <div className="p-3 space-y-1.5">
            <div className="h-2 bg-white/8 rounded w-2/3" />
            <div className="h-3 bg-white/6 rounded w-full" />
            <div className="h-4 bg-white/8 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Saved product card ──────────────────────────────────────────────────── */
function SavedCard({ item, listId, onRemove }: {
  item: WItem; listId: string; onRemove: () => void
}) {
  const { addItem, setBuyNow } = useCart()
  const router = useRouter()
  const imgs = parseImages(item.product.images)
  const img  = imgs[0] ?? null
  const oos  = (item.product.stock ?? 0) === 0
  const disc = discount(item.product)

  async function remove(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    await fetch(`/api/wishlist/${listId}/items/${item.product.id}`, { method: "DELETE" })
    toast("Removed from wishlist", { className: "font-mono text-xs" })
    onRemove()
  }

  return (
    <div className="group relative rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/20 hover:shadow-lg hover:shadow-black/20 transition-all duration-200">
      {/* Remove */}
      <button onClick={remove}
        className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white/40 hover:text-rose-400 hover:border-rose-500/40 transition-all active:scale-90">
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Discount */}
      {disc && (
        <div className="absolute top-2 left-2 z-10 bg-[#ee0000] text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md">
          -{disc}%
        </div>
      )}

      {/* Image + info → navigates */}
      <Link href={`/products/${item.product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-white/5">
          {img
            ? <Image src={img} alt={item.product.name} width={240} height={240}
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-300" />
            : <div className="w-full h-full flex items-center justify-center"><Heart className="h-8 w-8 text-foreground/10" /></div>
          }
          {oos && (
            <div className="absolute inset-0 bg-background/75 flex items-center justify-center">
              <span className="text-[8px] font-mono text-foreground/50 border border-white/20 px-2 py-0.5 rounded-md">OUT OF STOCK</span>
            </div>
          )}
        </div>
        <div className="p-3 space-y-1">
          <p className="text-[8px] text-foreground/28 font-mono uppercase tracking-widest truncate">{item.product.category?.name ?? ""}</p>
          <p className="text-[11px] font-medium text-foreground/80 line-clamp-2 leading-snug group-hover:text-foreground transition-colors">{item.product.name}</p>
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-sm font-bold text-emerald-400 font-mono">{formatPrice(item.product.price)}</span>
            {item.product.originalPrice && (
              <span className="text-[9px] text-foreground/28 line-through font-mono">{formatPrice(item.product.originalPrice)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="px-3 pb-3 flex gap-1.5">
        <button disabled={oos}
          onClick={(e) => { e.preventDefault(); setBuyNow(item.product as any); router.push("/checkout") }}
          className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#ee0000] hover:bg-red-700 text-white text-[8px] font-mono font-bold tracking-widest rounded-xl transition-all active:scale-95 disabled:opacity-40">
          <Zap className="h-2.5 w-2.5" /> BUY NOW
        </button>
        <button disabled={oos}
          onClick={(e) => { e.preventDefault(); addItem(item.product as any); toast.success("Added to bag", { className: "font-mono text-xs" }) }}
          className="px-3 py-2 border border-white/15 text-foreground/45 hover:text-foreground/75 hover:border-white/28 rounded-xl transition-all active:scale-95 disabled:opacity-40">
          <ShoppingCart className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ── Recommendation card (carousel) ─────────────────────────────────────── */
function RecoCard({ product }: { product: WProduct }) {
  const { addItem } = useCart()
  const imgs = parseImages(product.images)
  const img  = imgs[0] ?? null
  const disc = discount(product)

  return (
    <div className="group flex-shrink-0 w-40 rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden hover:border-white/22 hover:shadow-lg hover:shadow-black/25 transition-all duration-200">
      {disc && (
        <div className="absolute top-2 left-2 z-10 bg-[#ee0000] text-white text-[7px] font-mono font-bold px-1.5 py-0.5 rounded-md">
          -{disc}%
        </div>
      )}
      <Link href={`/products/${product.id}`} className="block relative">
        <div className="w-full h-40 overflow-hidden bg-white/5 relative">
          {img
            ? <Image src={img} alt={product.name} fill
                className="object-cover opacity-85 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-300" />
            : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-foreground/10" /></div>
          }
          {(product.stock ?? 0) === 0 && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="text-[7px] font-mono text-foreground/40 border border-white/15 px-1.5 py-0.5 rounded">OUT OF STOCK</span>
            </div>
          )}
        </div>
        <div className="p-2.5 space-y-0.5">
          <p className="text-[7px] text-foreground/28 font-mono uppercase tracking-widest truncate">{product.category?.name ?? ""}</p>
          <p className="text-[10px] font-medium text-foreground/78 line-clamp-2 leading-snug group-hover:text-foreground transition-colors">{product.name}</p>
          <div className="flex items-baseline gap-1 pt-0.5">
            <span className="text-[11px] font-bold text-emerald-400 font-mono">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-[8px] text-foreground/25 line-through font-mono">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-2.5 pb-2.5">
        <button
          disabled={(product.stock ?? 0) === 0}
          onClick={(e) => { e.preventDefault(); addItem(product as any); toast.success("Added to bag", { className: "font-mono text-xs" }) }}
          className="w-full flex items-center justify-center gap-1 py-1.5 border border-white/12 text-foreground/38 hover:text-foreground/68 hover:border-white/22 rounded-xl text-[8px] font-mono transition-all active:scale-95 disabled:opacity-30">
          <Plus className="h-2.5 w-2.5" /> Add to Bag
        </button>
      </div>
    </div>
  )
}

/* ── Animated infinite carousel ─────────────────────────────────────────── */
function RecoCarousel({ products }: { products: WProduct[] }) {
  const [paused, setPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function pauseFor(ms: number) {
    setPaused(true)
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => setPaused(false), ms)
  }

  if (products.length === 0) return null

  // Double the array so the CSS loop is seamless
  const doubled = [...products, ...products]

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        /* Fade edges */
        maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX
        setPaused(true)
      }}
      onTouchEnd={() => pauseFor(3000)} // Resume 3s after touch ends
    >
      <div
        ref={trackRef}
        className={`flex gap-3 ${paused ? "carousel-track paused" : "carousel-track"}`}
        style={{ width: "max-content" }}
      >
        {doubled.map((p, i) => (
          <RecoCard key={`${p.id}-${i}`} product={p} />
        ))}
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

  const [list,     setList]     = useState<WList | null>(null)
  const [recos,    setRecos]    = useState<WProduct[]>([])
  const [loading,  setLoading]  = useState(true)
  const [recoLoad, setRecoLoad] = useState(true)

  // Pick a headline based on saved-item count (changes as you save more)
  const headlineIdx = (list?.items.length ?? 0) % HEADLINES.length
  const headline = HEADLINES[headlineIdx]

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/wishlist")
      if (res.ok) {
        const all: WList[] = await res.json()
        setList(all.find((l) => l.isDefault) ?? null)
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
    if (status === "authenticated") { fetchList(); fetchRecos() }
  }, [status, fetchList, fetchRecos, router])

  const handleRemove = useCallback(() => {
    fetchList()
    fetchRecos()
  }, [fetchList, fetchRecos])

  if (status === "loading" || (loading && !list)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-rose-400/50" />
      </div>
    )
  }

  const items = list?.items ?? []
  const firstName = (session?.user as { name?: string | null })?.name?.split(" ")[0] ?? "you"

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="container mx-auto px-4 pt-6 max-w-lg space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-foreground/32 font-mono">Hello, {firstName}</p>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              My Wishlist
              {items.length > 0 && (
                <span className="ml-2 text-sm font-normal text-foreground/30">· {items.length} saved</span>
              )}
            </h1>
          </div>
          <Link href="/products"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/18 text-rose-400 text-xs font-mono hover:bg-rose-500/16 transition-all active:scale-95">
            <Plus className="h-3.5 w-3.5" /> Add
          </Link>
        </div>

        {/* ── Saved products ── */}
        {loading ? (
          <GridSkeleton />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/12 flex items-center justify-center mx-auto">
              <Heart className="h-6 w-6 text-rose-400/55" />
            </div>
            <p className="text-sm font-semibold text-foreground/45">Nothing saved yet</p>
            <p className="text-xs text-foreground/25">Tap ❤ on any product to save it here</p>
            <Link href="/products"
              className="inline-flex items-center gap-2 mt-1 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/18 text-rose-400 text-xs font-mono hover:bg-rose-500/15 transition-all">
              <Plus className="h-3.5 w-3.5" /> Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Summary pill */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-rose-500/[0.05] border border-rose-500/10">
              <Heart className="h-3.5 w-3.5 text-rose-400 fill-current flex-shrink-0" />
              <p className="text-xs text-foreground/50 flex-1 min-w-0">
                <span className="font-semibold text-foreground/75">{items.length} product{items.length !== 1 ? "s" : ""}</span>
                {" "}saved{list?.totalCost ? <> · total <span className="text-emerald-400 font-mono font-semibold">{formatPrice(list.totalCost)}</span></> : ""}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => (
                <SavedCard key={item.id} item={item} listId={list!.id} onRemove={handleRemove} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          RECOMMENDATION CAROUSEL (full-bleed)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="mt-8 space-y-4">
        {/* Section header */}
        <div className="container mx-auto px-4 max-w-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/80">
                {headline.title} {headline.emoji}
              </p>
              <p className="text-[9px] text-foreground/28 font-mono">
                {items.length > 0 ? "Curated from your saved items · auto-scrolling" : "Featured picks for you · auto-scrolling"}
              </p>
            </div>
          </div>
          <span className="text-[8px] font-mono text-foreground/20 border border-white/8 px-2 py-0.5 rounded-full">
            Hover to pause
          </span>
        </div>

        {/* Carousel — full-bleed, no padding */}
        {recoLoad ? (
          <CarouselSkeleton />
        ) : recos.length === 0 ? (
          <div className="container mx-auto px-4 max-w-lg">
            <div className="rounded-2xl border border-dashed border-white/8 py-8 text-center">
              <p className="text-xs text-foreground/28 font-mono">Save products to unlock personalised picks ✨</p>
            </div>
          </div>
        ) : (
          <RecoCarousel products={recos} />
        )}
      </div>
    </div>
  )
}
