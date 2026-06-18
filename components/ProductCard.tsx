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

const WishlistHeart = dynamic(
  () => import("@/components/WishlistHeart").then((m) => ({ default: m.WishlistHeart })),
  { ssr: false, loading: () => null }
)

interface ProductCardProps { product: Product }

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const { addItem, setBuyNow } = useCart()
  const [buyingNow, setBuyingNow] = useState(false)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!product.dealEndsAt) return
    const ms = new Date(product.dealEndsAt).getTime() - Date.now()
    if (ms <= 0) return
    const t = setTimeout(() => forceUpdate((n) => n + 1), ms + 100)
    return () => clearTimeout(t)
  }, [product.dealEndsAt])

  const images = Array.isArray(product.images)
    ? product.images
    : (JSON.parse(product.images as unknown as string) as string[])

  const dealOn         = isDealActive(product)
  const effectivePrice = getEffectivePrice(product)
  const discount       = dealOn && product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null
  const avgRating = product.reviews?.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : null
  const outOfStock = product.stock === 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    addItem({ ...product, price: effectivePrice })
    toast.success(`Added: ${product.name.slice(0, 28)}`, {
      description: formatPrice(effectivePrice), className: "font-mono text-xs",
    })
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setBuyingNow(true)
    setBuyNow({ ...product, price: effectivePrice })
    router.push("/checkout")
  }

  return (
    <div className="group relative border border-foreground/[0.08] hover:border-foreground/20 transition-all duration-200 bg-card overflow-hidden shadow-sm hover:shadow-md">

      {/* Wishlist heart */}
      <div className="absolute top-2 right-2 z-30">
        <WishlistHeart productId={product.id} productName={product.name} />
      </div>

      {/* Image + Info */}
      <Link href={`/products/${product.id}`} className="block">
        <ProductTilt className="relative aspect-square overflow-hidden bg-foreground/[0.04]">
          <Image
            src={images[0] ?? "/placeholder.jpg"}
            alt={product.name}
            fill
            className="object-cover transition-opacity duration-500 opacity-90 group-hover:opacity-100"
          />

          {discount && (
            <div className="absolute top-0 left-0 bg-[#ee0000] text-white text-[12px] font-mono font-bold px-2 py-0.5 tracking-widest z-10">
              -{discount}%
            </div>
          )}

          {outOfStock && (
            <div className="absolute inset-0 bg-background/75 flex items-center justify-center z-10">
              <span className="text-[12px] font-mono tracking-widest text-foreground/70 border border-foreground/25 px-2 py-1">
                OUT OF STOCK
              </span>
            </div>
          )}

          {product.featured && (
            <div className="absolute top-0 right-0 bg-yellow-400/20 border-l border-b border-yellow-500/40 text-yellow-600 dark:text-yellow-400/80 text-[12px] font-mono px-2 py-0.5 tracking-widest z-10">
              FEATURED
            </div>
          )}
        </ProductTilt>

        {/* Info */}
        <div className="p-3 space-y-1.5 border-t border-foreground/[0.06]">
          <p className="text-[12px] text-foreground/45 tracking-widest uppercase font-mono">
            {product.category?.name}
          </p>
          <h3 className="text-xs text-foreground/85 line-clamp-2 leading-relaxed group-hover:text-foreground transition-colors tracking-wide">
            {product.name}
          </h3>
          {avgRating !== null && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <div key={s} className={`w-2 h-2 rounded-[1px] ${s <= Math.round(avgRating) ? "bg-yellow-400/75" : "bg-foreground/10"}`} />
                ))}
              </div>
              <span className="text-[12px] text-foreground/40">({product.reviews?.length})</span>
            </div>
          )}
          <div className="flex items-baseline gap-2 pt-1 border-t border-foreground/[0.06]">
            <span className="text-sm font-mono font-semibold text-green-600 dark:text-green-400">
              {formatPrice(effectivePrice)}
            </span>
            {dealOn && product.originalPrice && (
              <span className="text-[12px] text-foreground/38 line-through font-mono">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action buttons */}
      <div className="px-3 pb-3 pt-2 flex gap-1.5 border-t border-foreground/[0.04]">
        <button
          onClick={handleBuyNow}
          disabled={outOfStock || buyingNow}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#ee0000] hover:bg-red-700 text-white text-[11px] font-mono font-bold tracking-widest active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {buyingNow ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Zap className="h-3 w-3" /> BUY NOW</>}
        </button>
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="flex items-center justify-center gap-1 px-3 py-2 border border-foreground/15 text-foreground/55 text-[11px] font-mono tracking-widest hover:border-foreground/35 hover:text-foreground/80 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title="Add to Bag"
        >
          <ShoppingCart className="h-3 w-3 flex-shrink-0" />
          <span className="hidden sm:inline">BAG</span>
        </button>
      </div>
    </div>
  )
}
