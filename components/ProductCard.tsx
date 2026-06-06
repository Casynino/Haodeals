"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, Zap, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useCart } from "@/hooks/useCart"
import type { Product } from "@/types"
import { toast } from "sonner"
import { formatPrice, getEffectivePrice, isDealActive } from "@/lib/utils"
import { ProductTilt } from "@/components/ui/product-tilt"

// ssr:false prevents hydration mismatch — WishlistHeart uses client-only hooks
const WishlistHeart = dynamic(
  () => import("@/components/WishlistHeart").then((m) => ({ default: m.WishlistHeart })),
  { ssr: false, loading: () => null }
)

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const { addItem, setBuyNow } = useCart()
  const [buyingNow, setBuyingNow] = useState(false)

  // ── Force re-render when the deal timer expires ──────────────────────────
  // This ensures the card automatically stops showing the sale price the
  // moment the countdown hits zero — no stale UI.
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    if (!product.dealEndsAt) return
    const msLeft = new Date(product.dealEndsAt).getTime() - Date.now()
    if (msLeft <= 0) return                          // already expired
    const t = setTimeout(() => forceUpdate((n) => n + 1), msLeft + 100)
    return () => clearTimeout(t)
  }, [product.dealEndsAt])

  const images = Array.isArray(product.images)
    ? product.images
    : (JSON.parse(product.images as unknown as string) as string[])

  // ── Single source of truth for pricing ──────────────────────────────────
  const dealOn         = isDealActive(product)
  const effectivePrice = getEffectivePrice(product)   // what the customer actually pays
  const discount       = dealOn && product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  const avgRating =
    product.reviews?.length
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : null

  const outOfStock = product.stock === 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    // Override price with effective price so cart shows the correct amount
    addItem({ ...product, price: effectivePrice })
    toast.success(`Added: ${product.name.slice(0, 28)}`, {
      description: formatPrice(effectivePrice),
      className: "font-mono text-xs",
    })
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setBuyingNow(true)
    // Override price so the buy-now cart item reflects the correct effective price
    setBuyNow({ ...product, price: effectivePrice })
    router.push("/checkout")
  }

  return (
    <div className="group relative border border-white/15 hover:border-white/40 transition-all duration-200 bg-card overflow-hidden">

      {/* ── Wishlist heart — outside Link so it can never trigger navigation ── */}
      <div className="absolute top-2 right-2 z-30">
        <WishlistHeart productId={product.id} productName={product.name} />
      </div>

      {/* ── Image + Info → navigates to product detail ── */}
      <Link href={`/products/${product.id}`} className="block">
        <ProductTilt className="relative aspect-square overflow-hidden bg-foreground/5">
          <Image
            src={images[0] ?? "/placeholder.jpg"}
            alt={product.name}
            fill
            className="object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-500"
          />
          <div className="absolute inset-0 scanline-overlay pointer-events-none opacity-50" />

          {/* Discount badge — only shown when deal is still active */}
          {discount && (
            <div className="absolute top-0 left-0 bg-foreground text-background text-[10px] font-mono font-bold px-2 py-0.5 tracking-widest z-10">
              -{discount}%
            </div>
          )}

          {outOfStock && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10">
              <span className="text-[10px] font-mono tracking-widest text-foreground/70 border border-white/30 px-2 py-1">
                OUT OF STOCK
              </span>
            </div>
          )}

          {product.featured && (
            <div className="absolute top-0 right-0 bg-yellow-400/15 border-l border-b border-yellow-400/40 text-yellow-400/80 text-[10px] font-mono px-2 py-0.5 tracking-widest z-10">
              FEATURED
            </div>
          )}
        </ProductTilt>

        <div className="p-3 space-y-2 border-t border-white/8">
          <p className="text-[10px] text-foreground/50 tracking-widest uppercase">
            {product.category?.name}
          </p>
          <h3 className="text-xs text-foreground/85 line-clamp-2 leading-relaxed group-hover:text-foreground transition-colors tracking-wide">
            {product.name}
          </h3>
          {avgRating !== null && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className={`w-2 h-2 ${s <= Math.round(avgRating) ? "bg-yellow-400/75" : "bg-white/15"}`} />
                ))}
              </div>
              <span className="text-[10px] text-foreground/45">({product.reviews?.length})</span>
            </div>
          )}

          {/* Price — always shows effective price; crossed-out only while deal is live */}
          <div className="flex items-baseline gap-2 pt-1 border-t border-white/8">
            <span className="text-sm font-mono font-semibold text-green-400">
              {formatPrice(effectivePrice)}
            </span>
            {dealOn && product.originalPrice && (
              <span className="text-[10px] text-foreground/40 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* ── Action buttons — outside Link ── */}
      <div className="px-3 pb-3 flex gap-1.5 border-t border-white/5 pt-2">
        <button
          onClick={handleBuyNow}
          disabled={outOfStock || buyingNow}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#ee0000] text-white text-[9px] font-mono font-bold tracking-widest hover:bg-red-700 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {buyingNow
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <><Zap className="h-3 w-3" /> BUY NOW</>}
        </button>
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="flex items-center justify-center gap-1 px-3 py-2 border border-white/20 text-foreground/55 text-[9px] font-mono tracking-widest hover:border-white/40 hover:text-foreground/80 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title="Add to Bag"
        >
          <ShoppingCart className="h-3 w-3 flex-shrink-0" />
          <span className="hidden sm:inline">BAG</span>
        </button>
      </div>
    </div>
  )
}
