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
import { celebrateAddToCart } from "@/lib/fx"
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
    celebrateAddToCart()
    toast.success(`Added: ${product.name.slice(0, 28)}`, {
      description: formatPrice(effectivePrice), className: " text-xs",
    })
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setBuyingNow(true)
    setBuyNow({ ...product, price: effectivePrice })
    router.push("/checkout")
  }

  return (
    <div className="group relative glass rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_-18px_rgba(0,0,0,0.65)]">

      {/* Wishlist heart */}
      <div className="absolute top-3 right-3 z-30">
        <WishlistHeart productId={product.id} productName={product.name} />
      </div>

      {/* Image + Info */}
      <Link href={`/products/${product.id}`} className="block">
        <ProductTilt className="relative aspect-square overflow-hidden rounded-3xl bg-foreground/[0.04] m-1.5">
          <Image
            src={images[0] ?? "/placeholder.jpg"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

          {discount && (
            <div className="absolute top-2.5 left-2.5 bg-gold text-black text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
              -{discount}%
            </div>
          )}

          {outOfStock && (
            <div className="absolute inset-0 bg-background/55 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-3xl">
              <span className="text-[11px] tracking-widest text-foreground/80 glass rounded-full px-3 py-1.5">
                OUT OF STOCK
              </span>
            </div>
          )}

          {product.featured && (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/35 backdrop-blur-md border border-gold/30 text-gold text-[10px] font-semibold px-2 py-0.5 rounded-full z-10">
              ★ FEATURED
            </div>
          )}
        </ProductTilt>

        {/* Info */}
        <div className="px-3.5 pt-2 pb-1 space-y-1.5">
          <p className="text-[10px] text-gold/80 tracking-[0.18em] uppercase font-medium">
            {product.category?.name}
          </p>
          <h3 className="text-[13px] font-medium text-foreground/85 line-clamp-2 leading-snug group-hover:text-foreground transition-colors">
            {product.name}
          </h3>
          {avgRating !== null && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <div key={s} className={`w-1.5 h-1.5 rounded-full ${s <= Math.round(avgRating) ? "bg-gold" : "bg-foreground/12"}`} />
                ))}
              </div>
              <span className="text-[11px] text-foreground/40">({product.reviews?.length})</span>
            </div>
          )}
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-[15px] font-bold text-foreground tracking-tight">
              {formatPrice(effectivePrice)}
            </span>
            {dealOn && product.originalPrice && (
              <span className="text-[11px] text-foreground/35 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action buttons */}
      <div className="px-3.5 pb-3.5 pt-2 flex gap-2">
        <button
          onClick={handleBuyNow}
          disabled={outOfStock || buyingNow}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-gold text-black text-[12px] font-semibold hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {buyingNow ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Zap className="h-3.5 w-3.5" /> Buy Now</>}
        </button>
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="flex items-center justify-center gap-1 px-3.5 py-2.5 rounded-full glass-soft text-foreground/70 text-[12px] font-medium hover:text-foreground hover:border-gold/30 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title="Add to Bag"
        >
          <ShoppingCart className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="hidden sm:inline">Bag</span>
        </button>
      </div>
    </div>
  )
}
