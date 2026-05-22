"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Star } from "lucide-react"
import { useCart } from "@/hooks/useCart"
import type { Product } from "@/types"
import { toast } from "sonner"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const images = Array.isArray(product.images)
    ? product.images
    : (JSON.parse(product.images as unknown as string) as string[])

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  const avgRating =
    product.reviews?.length
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : null

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addItem(product)
    toast.success(`ADDED: ${product.name.toUpperCase().slice(0, 24)}`, {
      description: `QTY +1 // $${product.price.toFixed(2)}`,
      className: "font-mono text-xs",
    })
  }

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="border border-white/10 hover:border-white/30 transition-colors bg-card relative overflow-hidden">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-foreground/5">
          <Image
            src={images[0] ?? "/placeholder.jpg"}
            alt={product.name}
            fill
            className="object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-500 group-hover:scale-105 transform transition-transform duration-700"
          />
          {/* Scan line overlay */}
          <div className="absolute inset-0 scanline-overlay pointer-events-none" />

          {/* Discount tag */}
          {discount && (
            <div className="absolute top-0 left-0 bg-foreground text-background text-[9px] font-mono font-bold px-1.5 py-0.5 tracking-widest">
              -{discount}%
            </div>
          )}

          {/* Out of stock */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="text-[9px] font-mono tracking-widest text-foreground/60 border border-white/20 px-2 py-1">
                OUT.OF.STOCK
              </span>
            </div>
          )}

          {/* Featured */}
          {product.featured && (
            <div className="absolute top-0 right-0 bg-yellow-400/10 border-l border-b border-yellow-400/30 text-yellow-400/70 text-[8px] font-mono px-1.5 py-0.5 tracking-widest">
              FEATURED
            </div>
          )}

          {/* Add to cart - appears on hover */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="absolute bottom-0 left-0 right-0 py-1.5 bg-foreground text-background text-[9px] font-mono tracking-widest text-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 hover:bg-foreground/90 disabled:opacity-0"
          >
            <ShoppingCart className="h-2.5 w-2.5" />
            ADD.TO.CART
          </button>
        </div>

        {/* Info */}
        <div className="p-2.5 space-y-1.5 border-t border-white/5">
          {/* Category */}
          <p className="text-[8px] text-foreground/30 tracking-widest uppercase">
            {product.category?.name}
          </p>

          {/* Name */}
          <h3 className="text-[10px] text-foreground/80 line-clamp-2 leading-relaxed group-hover:text-foreground transition-colors tracking-wide uppercase">
            {product.name}
          </h3>

          {/* Rating */}
          {avgRating !== null && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`w-1.5 h-1.5 ${s <= Math.round(avgRating) ? "bg-yellow-400/60" : "bg-white/10"}`}
                />
              ))}
              <span className="text-[8px] text-foreground/30 ml-0.5">({product.reviews?.length})</span>
            </div>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-mono text-green-400/80">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-[8px] text-foreground/30 line-through">${product.originalPrice.toFixed(2)}</span>
              )}
            </div>
            <span className="text-[8px] text-foreground/30">{product.stock > 0 ? `${product.stock} LEFT` : "—"}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
