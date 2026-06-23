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
import { flyToCart } from "@/lib/fx"
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
        <div key={i} className="rounded-2xl border border-foreground/6 bg-foreground/[0.02] overflow-hidden animate-pulse">
          <div className="aspect-square bg-foreground/5" />
          <div className="p-3 space-y-2">
            <div className="h-2 bg-foreground/8 rounded w-1/2" />
            <div className="h-3 bg-foreground/6 rounded w-full" />
            <div className="h-4 bg-foreground/8 rounded w-2/5" />
            <div className="h-7 bg-foreground/5 rounded mt-1" />
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
        <div key={i} className="flex-shrink-0 w-40 rounded-2xl border border-foreground/6 bg-foreground/[0.02] overflow-hidden animate-pulse">
          <div className="w-full h-40 bg-foreground/5" />
          <div className="p-3 space-y-1.5">
            <div className="h-2 bg-foreground/8 rounded w-2/3" />
            <div className="h-3 bg-foreground/6 rounded w-full" />
            <div className="h-4 bg-foreground/8 rounded w-1/2" />
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
    toast("Removed from wishlist", { className: " text-xs" })
    onRemove()
  }

  return (
    <div data-pcard className="group relative rounded-2xl glass overflow-hidden hover:-translate-y-1 hover:shadow-[0_18px_50px_-18px_rgba(0,0,0,0.4)] transition-all duration-200">
      {/* Remove */}
      <button onClick={remove}
        className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-background/70 backdrop-blur-sm border border-foreground/15 flex items-center justify-center text-foreground/45 hover:text-rose-500 hover:border-rose-500/40 transition-all active:scale-90">
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Discount */}
      {disc && (
        <div className="absolute top-2 left-2 z-10 bg-gold text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
          −{disc}%
        </div>
      )}

      {/* Image + info → navigates */}
      <Link href={`/products/${item.product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-foreground/5">
          {img
            ? <Image src={img} alt={item.product.name} width={240} height={240}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center"><Heart className="h-8 w-8 text-foreground/10" /></div>
          }
          {oos && (
            <div className="absolute inset-0 bg-background/75 backdrop-blur-sm flex items-center justify-center">
              <span className="text-[11px] text-foreground/60 glass rounded-full px-3 py-1">Out of stock</span>
            </div>
          )}
        </div>
        <div className="p-3 space-y-1">
          <p className="text-[13px] font-medium text-foreground/85 line-clamp-2 leading-snug group-hover:text-foreground transition-colors">{item.product.name}</p>
          <div className="flex items-baseline gap-1.5 pt-0.5 flex-wrap">
            <span className={`text-sm font-bold ${disc ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>{formatPrice(item.product.price)}</span>
            {disc && item.product.originalPrice && (
              <span className="text-[11px] text-foreground/35 line-through">{formatPrice(item.product.originalPrice)}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="px-3 pb-3 flex gap-1.5">
        <button disabled={oos}
          onClick={(e) => { e.preventDefault(); setBuyNow(item.product as any); router.push("/checkout") }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gold text-black text-[11px] font-semibold rounded-full transition-all active:scale-95 disabled:opacity-40">
          <Zap className="h-3 w-3" /> Buy Now
        </button>
        <button disabled={oos}
          onClick={(e) => {
            e.preventDefault()
            const ci = (e.currentTarget as HTMLElement).closest("[data-pcard]")?.querySelector("img") as HTMLImageElement | null
            flyToCart(ci?.currentSrc || ci?.src || "", (ci ?? (e.currentTarget as HTMLElement)).getBoundingClientRect())
            addItem(item.product as any)
          }}
          className="px-3 py-2 glass text-foreground/55 hover:text-foreground rounded-full transition-all active:scale-95 disabled:opacity-40">
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
    <div data-pcard className="group relative flex-shrink-0 w-40 rounded-2xl glass overflow-hidden hover:shadow-[0_18px_50px_-18px_rgba(0,0,0,0.4)] transition-all duration-200">
      {disc && (
        <div className="absolute top-2 left-2 z-10 bg-gold text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
          −{disc}%
        </div>
      )}
      <Link href={`/products/${product.id}`} className="block relative">
        <div className="w-full h-40 overflow-hidden bg-foreground/5 relative">
          {img
            ? <Image src={img} alt={product.name} fill
                className="object-cover group-hover:scale-[1.05] transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-foreground/10" /></div>
          }
          {(product.stock ?? 0) === 0 && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
              <span className="text-[10px] text-foreground/60 glass rounded-full px-2 py-0.5">Out of stock</span>
            </div>
          )}
        </div>
        <div className="p-2.5 space-y-1">
          <p className="text-[12px] font-medium text-foreground/85 line-clamp-2 leading-snug group-hover:text-foreground transition-colors">{product.name}</p>
          <div className="flex items-baseline gap-1 pt-0.5 flex-wrap">
            <span className={`text-[13px] font-bold ${disc ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>{formatPrice(product.price)}</span>
            {disc && product.originalPrice && (
              <span className="text-[10px] text-foreground/35 line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-2.5 pb-2.5">
        <button
          disabled={(product.stock ?? 0) === 0}
          onClick={(e) => {
            e.preventDefault()
            const ci = (e.currentTarget as HTMLElement).closest("[data-pcard]")?.querySelector("img") as HTMLImageElement | null
            flyToCart(ci?.currentSrc || ci?.src || "", (ci ?? (e.currentTarget as HTMLElement)).getBoundingClientRect())
            addItem(product as any)
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 glass text-foreground/60 hover:text-foreground rounded-full text-[11px] font-medium transition-all active:scale-95 disabled:opacity-30">
          <Plus className="h-3 w-3" /> Add to Bag
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
            <p className="text-xs text-foreground/32">Hello, {firstName}</p>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              My Wishlist
              {items.length > 0 && (
                <span className="ml-2 text-sm font-normal text-foreground/30">· {items.length} saved</span>
              )}
            </h1>
          </div>
          <Link href="/products"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/18 text-rose-400 text-xs hover:bg-rose-500/16 transition-all active:scale-95">
            <Plus className="h-3.5 w-3.5" /> Add
          </Link>
        </div>

        {/* ── Saved products ── */}
        {loading ? (
          <GridSkeleton />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-foreground/10 py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/12 flex items-center justify-center mx-auto">
              <Heart className="h-6 w-6 text-rose-400/55" />
            </div>
            <p className="text-sm font-semibold text-foreground/45">Nothing saved yet</p>
            <p className="text-xs text-foreground/25">Tap ❤ on any product to save it here</p>
            <Link href="/products"
              className="inline-flex items-center gap-2 mt-1 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/18 text-rose-400 text-xs hover:bg-rose-500/15 transition-all">
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
                {" "}saved{list?.totalCost ? <> · total <span className="text-emerald-400 font-semibold">{formatPrice(list.totalCost)}</span></> : ""}
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
              <p className="text-[12px] text-foreground/45">
                {items.length > 0 ? "Curated from your saved items" : "Featured picks for you"}
              </p>
            </div>
          </div>
        </div>

        {/* Carousel — full-bleed, no padding */}
        {recoLoad ? (
          <CarouselSkeleton />
        ) : recos.length === 0 ? (
          <div className="container mx-auto px-4 max-w-lg">
            <div className="rounded-2xl border border-dashed border-foreground/8 py-8 text-center">
              <p className="text-xs text-foreground/28">Save products to unlock personalised picks ✨</p>
            </div>
          </div>
        ) : (
          <RecoCarousel products={recos} />
        )}
      </div>
    </div>
  )
}
