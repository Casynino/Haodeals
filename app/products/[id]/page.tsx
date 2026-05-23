"use client"

import { useEffect, useState, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useCart } from "@/hooks/useCart"
import { ShoppingCart, Minus, Plus, ChevronLeft, Truck, RotateCcw, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import type { Product, SelectedOption } from "@/types"
import { formatPrice } from "@/lib/utils"
import { ProductTilt } from "@/components/ui/product-tilt"

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<"reviews" | "details">("reviews")
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => { setProduct(data); setLoading(false) })
  }, [id])

  const discount = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  const avgRating = product?.reviews?.length
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : null

  const productOptions = product?.options as { name: string; values: string[] }[] | null | undefined
  const allOptionsSelected = !productOptions?.length ||
    productOptions.every((opt) => !!selectedOptions[opt.name])

  function handleAddToCart() {
    if (!product) return
    const opts: SelectedOption[] = Object.entries(selectedOptions).map(([name, value]) => ({ name, value }))
    addItem(product, quantity, opts.length ? opts : undefined)
    toast.success(`ADDED: ${product.name.toUpperCase().slice(0, 24)}`, {
      description: opts.length
        ? opts.map((o) => `${o.name}: ${o.value}`).join(" · ")
        : `QTY ${quantity} // ${formatPrice(product.price * quantity)}`,
      className: "font-mono text-xs",
    })
  }

  async function submitReview() {
    if (!session) { toast.error("SIGN.IN.REQUIRED"); return }
    setSubmittingReview(true)
    const res = await fetch(`/api/products/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
    })
    if (res.ok) {
      toast.success("REVIEW.SUBMITTED")
      const updated = await fetch(`/api/products/${id}`).then((r) => r.json())
      setProduct(updated)
      setReviewComment("")
    } else {
      toast.error("SUBMISSION.FAILED")
    }
    setSubmittingReview(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 font-mono">
        <div className="grid md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-foreground/5 border border-white/10" />
          <div className="space-y-4">
            <div className="h-3 bg-foreground/10 w-1/3" />
            <div className="h-6 bg-foreground/10 w-3/4" />
            <div className="h-4 bg-foreground/10 w-1/4" />
            <div className="h-20 bg-foreground/10" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center font-mono">
        <p className="text-[11px] tracking-widest text-foreground/40 mb-4">PRODUCT.NOT.FOUND</p>
        <Link href="/products" className="px-4 py-2 text-[10px] tracking-widest border border-white/20 text-foreground/60 hover:text-foreground hover:border-white/40 transition-colors">
          BACK.TO.PRODUCTS
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 font-mono">
      <Link href="/products" className="inline-flex items-center gap-1 text-[9px] tracking-widest text-foreground/40 hover:text-foreground transition-colors mb-6">
        <ChevronLeft className="h-3 w-3" />
        PRODUCTS.INDEX
      </Link>

      <div className="grid md:grid-cols-2 gap-10 mb-12">
        {/* Images */}
        <div className="space-y-3">
          <ProductTilt className="relative aspect-square overflow-hidden bg-foreground/5 border border-white/10" intensity={10}>
            <Image
              src={product.images[selectedImage] ?? ""}
              alt={product.name}
              fill
              className="object-cover opacity-80"
              priority
            />
            {discount && (
              <div className="absolute top-0 left-0 bg-foreground text-background text-[9px] font-bold px-2 py-0.5 tracking-widest z-10">
                -{discount}%
              </div>
            )}
            <div className="absolute inset-0 scanline-overlay pointer-events-none" />
          </ProductTilt>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 flex-shrink-0 overflow-hidden border transition-colors ${
                    selectedImage === i ? "border-white/60" : "border-white/15 hover:border-white/30"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover opacity-70" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="text-[8px] tracking-widest text-foreground/30 mb-1">{product.category?.name?.toUpperCase()}</p>
            <h1 className="text-lg font-bold tracking-wide uppercase text-foreground/90">{product.name}</h1>
          </div>

          {avgRating !== null && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className={`w-2 h-2 ${star <= Math.round(avgRating) ? "bg-yellow-400/70" : "bg-white/10"}`} />
                ))}
              </div>
              <span className="text-[9px] text-foreground/30">
                {avgRating.toFixed(1)} [{product.reviews?.length}.REVIEWS]
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-mono text-green-400/80">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-foreground/30 line-through">{formatPrice(product.originalPrice)}</span>
            )}
            {discount && (
              <span className="text-[9px] tracking-widest text-green-400/60 border border-green-400/30 px-1.5 py-0.5">
                SAVE.{discount}%
              </span>
            )}
          </div>

          <p className="text-[10px] text-foreground/50 leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-2 text-[9px] tracking-widest">
            <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? "bg-green-400/70" : "bg-red-400/70"}`} />
            <span className={product.stock > 0 ? "text-green-400/70" : "text-red-400/70"}>
              {product.stock > 0 ? `IN.STOCK [${product.stock}.UNITS]` : "OUT.OF.STOCK"}
            </span>
          </div>

          {/* Variant selectors */}
          {productOptions && productOptions.length > 0 && (
            <div className="space-y-3 border-t border-white/5 pt-4">
              {productOptions.map((opt) => (
                <div key={opt.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] tracking-widest text-foreground/40">{opt.name.toUpperCase()}</span>
                    {selectedOptions[opt.name] && (
                      <span className="text-[8px] text-foreground/60 border border-white/15 px-1.5 py-0.5">
                        {selectedOptions[opt.name]}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {opt.values.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [opt.name]: val }))}
                        className={`px-3 py-1.5 text-[9px] tracking-widest border transition-all ${
                          selectedOptions[opt.name] === val
                            ? "border-foreground/70 text-foreground bg-foreground/10"
                            : "border-white/15 text-foreground/50 hover:border-white/40 hover:text-foreground"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!allOptionsSelected && (
                <p className="text-[8px] text-foreground/30 tracking-widest">
                  SELECT ALL OPTIONS TO ADD TO CART
                </p>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-[9px] tracking-widest text-foreground/40">QTY:</span>
            <div className="flex items-center border border-white/20">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors border-r border-white/20"
              >
                <Minus className="h-2.5 w-2.5" />
              </button>
              <span className="w-8 text-center text-[10px]">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="w-7 h-7 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors border-l border-white/20 disabled:opacity-20"
              >
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || !allOptionsSelected}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background text-[10px] tracking-widest font-bold hover:bg-foreground/90 transition-colors disabled:opacity-30"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {!allOptionsSelected ? "SELECT.OPTIONS" : "ADD.TO.CART"}
          </button>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
            {[
              { icon: Truck, label: "Free Shipping", sub: "Over TSh 100K" },
              { icon: RotateCcw, label: "30-Day Returns", sub: "Easy returns" },
              { icon: ShieldCheck, label: "Secure", sub: "Safe checkout" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center p-2 border border-white/5">
                <Icon className="h-3.5 w-3.5 text-foreground/30" />
                <p className="text-[8px] tracking-widest text-foreground/50">{label}</p>
                <p className="text-[7px] text-foreground/20">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-white/10">
        <div className="flex border-b border-white/10">
          {[
            { id: "reviews" as const, label: `REVIEWS [${product.reviews?.length ?? 0}]` },
            { id: "details" as const, label: "PRODUCT.DETAILS" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-[9px] tracking-widest transition-colors border-r border-white/5 ${
                activeTab === tab.id
                  ? "text-foreground border-b-2 border-b-foreground"
                  : "text-foreground/40 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "reviews" && (
          <div className="py-6 space-y-6">
            {/* Write review */}
            <div className="border border-white/10 p-5 space-y-3">
              <p className="text-[9px] tracking-widest text-foreground/40">// SUBMIT.REVIEW</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewRating(star)}>
                    <div className={`w-4 h-4 border transition-colors ${star <= reviewRating ? "bg-yellow-400/70 border-yellow-400/70" : "border-white/20 hover:border-yellow-400/40"}`} />
                  </button>
                ))}
                <span className="text-[9px] text-foreground/30 ml-2">{reviewRating}/5</span>
              </div>
              <textarea
                placeholder="SHARE.YOUR.EXPERIENCE..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="w-full bg-transparent border border-white/15 p-2.5 text-[10px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors resize-none tracking-wide"
              />
              <button
                onClick={submitReview}
                disabled={submittingReview || !session}
                className="px-4 py-1.5 text-[9px] tracking-widest border border-white/20 text-foreground/60 hover:text-foreground hover:border-white/40 transition-colors disabled:opacity-30"
              >
                {session ? (submittingReview ? "SUBMITTING..." : "SUBMIT.REVIEW") : "SIGN.IN.TO.REVIEW"}
              </button>
            </div>

            {/* Reviews list */}
            {product.reviews?.length === 0 ? (
              <p className="text-[10px] tracking-widest text-foreground/30 text-center py-8">NO.REVIEWS.YET</p>
            ) : (
              <div className="space-y-3">
                {product.reviews?.map((review) => (
                  <div key={review.id} className="border border-white/10 p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] tracking-wide text-foreground/70 uppercase">{review.user?.name ?? "ANONYMOUS"}</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <div key={s} className={`w-1.5 h-1.5 ${s <= review.rating ? "bg-yellow-400/70" : "bg-white/10"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-[8px] text-foreground/25">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {review.comment && (
                      <p className="text-[10px] text-foreground/50 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "details" && (
          <div className="py-6">
            <div className="border border-white/10 p-5 space-y-4">
              <p className="text-[9px] tracking-widest text-foreground/40">// PRODUCT.SPECIFICATIONS</p>
              <p className="text-[10px] text-foreground/50 leading-relaxed">{product.description}</p>
              <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-2">
                {[
                  ["CATEGORY", product.category?.name?.toUpperCase() ?? "—"],
                  ["STOCK", `${product.stock}.UNITS`],
                  ["SKU", product.id.slice(0, 8).toUpperCase()],
                  ["STATUS", product.stock > 0 ? "IN.STOCK" : "OUT.OF.STOCK"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/5 text-[9px]">
                    <span className="text-foreground/30 tracking-widest">{label}</span>
                    <span className="text-foreground/60">{value}</span>
                  </div>
                ))}
              </div>
              {productOptions && productOptions.length > 0 && (
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <p className="text-[8px] tracking-widest text-foreground/30">AVAILABLE.OPTIONS</p>
                  {productOptions.map((opt) => (
                    <div key={opt.name} className="flex items-start justify-between gap-3 text-[9px] border-b border-white/5 pb-2">
                      <span className="text-foreground/30 tracking-widest shrink-0">{opt.name.toUpperCase()}</span>
                      <span className="text-foreground/50 text-right">{opt.values.join(" · ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
