"use client"

import { useEffect, useState, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCart } from "@/hooks/useCart"
import { ShoppingCart, Zap, Minus, Plus, ChevronLeft, Truck, RotateCcw, ShieldCheck, Star } from "lucide-react"
import { toast } from "sonner"
import type { Product, SelectedOption } from "@/types"
import { formatPrice, getEffectivePrice, isDealActive } from "@/lib/utils"
import { ProductTilt } from "@/components/ui/product-tilt"
import { DealCountdown } from "@/components/DealCountdown"
import { HaoPlusBanner } from "@/components/HaoPlusBanner"
import { ShareButton } from "@/components/ShareButton"
import { StockBadge } from "@/components/StockBadge"

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
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

  // Use shared utils — same logic as ProductCard and checkout
  const dealActive   = product ? isDealActive(product) : false
  const displayPrice = product ? getEffectivePrice(product) : 0
  const discount     = product?.originalPrice && dealActive
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
    toast.success(`Added: ${product.name.slice(0, 28)}`, {
      description: opts.length
        ? opts.map((o) => `${o.name}: ${o.value}`).join(" · ")
        : `Qty ${quantity} · ${formatPrice(product.price * quantity)}`,
      className: " text-xs",
    })
  }

  function handleBuyNow() {
    if (!product || !allOptionsSelected) return
    const opts: SelectedOption[] = Object.entries(selectedOptions).map(([name, value]) => ({ name, value }))
    addItem(product, quantity, opts.length ? opts : undefined)
    router.push("/checkout")
  }

  async function submitReview() {
    if (!session) { toast.error("Sign in to leave a review"); return }
    setSubmittingReview(true)
    const res = await fetch(`/api/products/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
    })
    if (res.ok) {
      toast.success("Review submitted")
      const updated = await fetch(`/api/products/${id}`).then((r) => r.json())
      setProduct(updated)
      setReviewComment("")
    } else {
      toast.error("Couldn't submit review")
    }
    setSubmittingReview(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square rounded-3xl skeleton" />
          <div className="space-y-4">
            <div className="h-4 w-1/3 rounded skeleton" />
            <div className="h-8 w-3/4 rounded skeleton" />
            <div className="h-6 w-1/4 rounded skeleton" />
            <div className="h-28 rounded-2xl skeleton" />
            <div className="h-12 rounded-full skeleton" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-base text-foreground/55 mb-5">Product not found.</p>
        <Link href="/products" className="inline-block px-5 py-2.5 rounded-full glass text-foreground/80 text-sm hover:border-gold/30 transition-all">
          Back to products
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link href="/products" className="inline-flex items-center gap-1.5 text-[13px] text-foreground/45 hover:text-foreground transition-colors mb-6">
        <ChevronLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="grid md:grid-cols-2 gap-10 mb-14">
        {/* ── Image gallery ── */}
        <div className="space-y-3">
          <ProductTilt className="relative aspect-square overflow-hidden rounded-3xl glass-soft" intensity={8}>
            <Image
              src={product.images[selectedImage] ?? ""}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {dealActive && discount && (
              <div className="absolute top-4 left-4 bg-gold text-black text-[12px] font-bold px-3 py-1 rounded-full z-10">
                −{discount}%
              </div>
            )}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10">
                <span className="text-[13px] tracking-[0.2em] text-foreground/70 glass rounded-full px-4 py-2">
                  OUT OF STOCK
                </span>
              </div>
            )}
          </ProductTilt>
          {product.images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-[4.5rem] h-[4.5rem] flex-shrink-0 overflow-hidden rounded-2xl transition-all ${
                    selectedImage === i ? "ring-2 ring-gold" : "ring-1 ring-foreground/10 hover:ring-foreground/25"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product info ── */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <p className="text-[12px] tracking-[0.2em] uppercase text-gold">{product.category?.name}</p>
              <ShareButton productName={product.name} productPath={`/products/${product.id}`} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">{product.name}</h1>
          </div>

          {avgRating !== null && (
            <div className="flex items-center gap-2.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-4 w-4 ${star <= Math.round(avgRating) ? "fill-gold text-gold" : "text-foreground/20"}`} />
                ))}
              </div>
              <span className="text-[13px] text-foreground/55">
                {avgRating.toFixed(1)} · {product.reviews?.length} reviews
              </span>
            </div>
          )}

          {/* Deal countdown — only while timer is active */}
          {dealActive && <DealCountdown dealEndsAt={product.dealEndsAt} />}

          {/* Price */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold text-foreground">{formatPrice(displayPrice)}</span>
            {dealActive && product.originalPrice && (
              <span className="text-base text-foreground/40 line-through">{formatPrice(product.originalPrice)}</span>
            )}
            {discount && (
              <span className="text-[12px] font-semibold tracking-wide text-gold glass rounded-full px-2.5 py-1">
                Save {discount}%
              </span>
            )}
          </div>

          {/* Stock badge */}
          <StockBadge stock={product.stock} />

          {/* Variant selectors */}
          {productOptions && productOptions.length > 0 && (
            <div className="space-y-4 border-t border-foreground/8 pt-5">
              {productOptions.map((opt) => (
                <div key={opt.name}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[12px] tracking-wide text-foreground/55 font-medium">{opt.name}</span>
                    {selectedOptions[opt.name] && (
                      <span className="text-[12px] text-gold">{selectedOptions[opt.name]}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [opt.name]: val }))}
                        className={`px-4 py-2 rounded-full text-[13px] transition-all ${
                          selectedOptions[opt.name] === val
                            ? "bg-gold text-black font-semibold"
                            : "glass text-foreground/65 hover:text-foreground hover:border-gold/30"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!allOptionsSelected && (
                <p className="text-[12px] text-foreground/40">Select all options to continue</p>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-foreground/55 font-medium">Quantity</span>
            <div className="flex items-center glass rounded-full">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 flex items-center justify-center text-foreground/55 hover:text-foreground transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-9 text-center text-[14px] font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="w-9 h-9 flex items-center justify-center text-foreground/55 hover:text-foreground transition-colors disabled:opacity-25"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* CTA Buttons — Buy Now (primary) + Add to Bag */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0 || !allOptionsSelected}
              className="flex items-center justify-center gap-2 py-3.5 rounded-full bg-gold text-black text-[14px] font-semibold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 disabled:active:scale-100 shadow-[0_12px_34px_-12px_var(--gold-soft)]"
            >
              <Zap className="h-4 w-4" /> Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || !allOptionsSelected}
              className="flex items-center justify-center gap-2 py-3.5 rounded-full glass text-foreground/80 text-[14px] font-medium hover:text-foreground hover:border-gold/30 active:scale-[0.98] transition-all disabled:opacity-30 disabled:active:scale-100"
            >
              <ShoppingCart className="h-4 w-4" /> Add to Bag
            </button>
          </div>

          {/* HAO+ banner */}
          <HaoPlusBanner variant="product" />

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { icon: Truck,       label: "Fast delivery", sub: "Across Tanzania" },
              { icon: RotateCcw,   label: "Easy returns",  sub: "30-day window" },
              { icon: ShieldCheck, label: "Secure",        sub: "Safe checkout" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center p-3 rounded-2xl glass">
                <div className="w-9 h-9 rounded-xl bg-gold-soft flex items-center justify-center">
                  <Icon className="h-4 w-4 text-gold" />
                </div>
                <p className="text-[12px] font-semibold text-foreground/80">{label}</p>
                <p className="text-[11px] text-foreground/40">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div>
        <div className="flex gap-1 border-b border-foreground/8">
          {[
            { id: "reviews" as const, label: `Reviews (${product.reviews?.length ?? 0})` },
            { id: "details" as const, label: "Product details" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[13px] font-medium transition-colors relative ${
                activeTab === tab.id ? "text-foreground" : "text-foreground/40 hover:text-foreground/70"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gold rounded-full" />}
            </button>
          ))}
        </div>

        {activeTab === "reviews" && (
          <div className="py-6 space-y-5">
            <div className="rounded-2xl glass p-5 space-y-3">
              <p className="text-[13px] font-semibold text-foreground/80">Write a review</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewRating(star)} aria-label={`${star} stars`}>
                    <Star className={`h-5 w-5 transition-colors ${star <= reviewRating ? "fill-gold text-gold" : "text-foreground/20 hover:text-gold/50"}`} />
                  </button>
                ))}
                <span className="text-[12px] text-foreground/40 ml-2">{reviewRating}/5</span>
              </div>
              <textarea
                placeholder="Share your experience…"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="w-full bg-foreground/[0.03] rounded-xl border border-foreground/10 p-3 text-[13px] text-foreground/80 placeholder:text-foreground/25 focus:outline-none focus:border-gold/35 transition-colors resize-none"
              />
              <button
                onClick={submitReview}
                disabled={submittingReview || !session}
                className="px-5 py-2.5 rounded-full bg-gold text-black text-[13px] font-semibold hover:brightness-110 transition-all disabled:opacity-35"
              >
                {session ? (submittingReview ? "Submitting…" : "Submit review") : "Sign in to review"}
              </button>
            </div>

            {product.reviews?.length === 0 ? (
              <p className="text-[13px] text-foreground/35 text-center py-10">No reviews yet — be the first.</p>
            ) : (
              <div className="space-y-3">
                {product.reviews?.map((review) => (
                  <div key={review.id} className="rounded-2xl glass p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <p className="text-[13px] font-semibold text-foreground/85">{review.user?.name ?? "Anonymous"}</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-gold text-gold" : "text-foreground/15"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-foreground/30">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    {review.comment && (
                      <p className="text-[13px] text-foreground/65 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "details" && (
          <div className="py-6">
            <div className="rounded-2xl glass p-5 space-y-4">
              <p className="text-[13px] text-foreground/65 leading-relaxed">{product.description}</p>
              <div className="border-t border-foreground/8 pt-4 grid grid-cols-2 gap-x-6 gap-y-1">
                {[
                  ["Category", product.category?.name ?? "—"],
                  ["Stock", `${product.stock} units`],
                  ["SKU", product.id.slice(0, 8)],
                  ["Status", product.stock > 0 ? "In stock" : "Out of stock"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-foreground/5 text-[12px]">
                    <span className="text-foreground/40">{label}</span>
                    <span className="text-foreground/70 font-medium">{value}</span>
                  </div>
                ))}
              </div>
              {productOptions && productOptions.length > 0 && (
                <div className="border-t border-foreground/8 pt-4 space-y-2">
                  <p className="text-[12px] tracking-wide text-foreground/40">Available options</p>
                  {productOptions.map((opt) => (
                    <div key={opt.name} className="flex items-start justify-between gap-3 text-[12px] border-b border-foreground/5 pb-2">
                      <span className="text-foreground/45 shrink-0">{opt.name}</span>
                      <span className="text-foreground/65 text-right">{opt.values.join(" · ")}</span>
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
