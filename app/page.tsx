import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { ProductCard } from "@/components/ProductCard"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/types"
import { SplineScene } from "@/components/ui/splite"
import { Spotlight } from "@/components/ui/spotlight"

// Always fetch fresh data so new products appear immediately
export const dynamic = "force-dynamic"

async function getFeaturedProducts() {
  const products = await prisma.product.findMany({
    where: { featured: true },
    include: { category: true, reviews: { select: { rating: true } } },
    take: 8,
  })
  return products.map((p) => ({ ...p, images: JSON.parse(p.images) as string[] }))
}

async function getCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    take: 6,
  })
}

async function getDealsProducts() {
  const products = await prisma.product.findMany({
    include: { category: true, reviews: { select: { rating: true } } },
    take: 16,
    orderBy: { createdAt: "desc" },
  })
  return products.map((p) => ({ ...p, images: JSON.parse(p.images) as string[] }))
}

const categoryImages: Record<string, string> = {
  "tech-deals": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&h=600&fit=crop",
  fashion:      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&h=600&fit=crop",
  accessories:  "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&h=600&fit=crop",
  shoes:        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
  sports:       "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=600&fit=crop",
}

export default async function HomePage() {
  const [session, featuredProducts, categories, dealProducts] = await Promise.all([
    auth(),
    getFeaturedProducts(),
    getCategories(),
    getDealsProducts(),
  ])
  const isLoggedIn = !!session?.user

  return (
    <div className="flex flex-col">

      {/* ── Hero: Spline scene + glassy gold content ── */}
      <div className="relative h-screen bg-background overflow-hidden flex">

        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

        {/* Ambient gold glow blobs */}
        <div className="gold-glow absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full pointer-events-none z-0 opacity-70" />
        <div className="gold-glow absolute bottom-0 left-1/3 w-[26rem] h-[26rem] rounded-full pointer-events-none z-0 opacity-50" />

        {/* Left: text content */}
        <div className="relative z-20 w-full md:w-1/2 flex flex-col justify-center px-6 md:px-14 lg:px-20">
          <div className="max-w-lg">

            {/* Eyebrow pill */}
            <div className="inline-flex items-center gap-2 glass rounded-full px-3.5 py-1.5 mb-6">
              <span className="text-gold text-sm leading-none">✦</span>
              <span className="text-[12px] text-foreground/70 tracking-wide">HaoDeals · Tanzania 🇹🇿</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.05] mb-5">
              Premium deals,<br />
              <span className="text-gold">delivered</span> to your door.
            </h1>

            <p className="text-sm md:text-base text-foreground/60 leading-relaxed mb-8 max-w-md">
              Up to 70% off across Tech, Fashion, Accessories, Shoes &amp; Sports — with fast,
              reliable delivery anywhere in Tanzania.
            </p>

            {/* Stats */}
            <div className="flex gap-3 mb-8">
              {[["20+", "Products"], ["5", "Categories"], ["70%", "Max off"]].map(([val, label]) => (
                <div key={label} className="glass rounded-2xl px-4 py-3 flex-1">
                  <div className="text-xl text-foreground font-bold tracking-tight">{val}</div>
                  <div className="text-[11px] text-foreground/45 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link href="/products">
                <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-black text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_10px_30px_-10px_var(--gold-soft)]">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              {!isLoggedIn && (
                <Link href="/register">
                  <button className="px-6 py-3 rounded-full glass text-foreground/80 text-sm font-medium hover:text-foreground hover:border-gold/30 transition-all">
                    Create Free Account
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Spline scene — right half on desktop, full bg on mobile */}
        <div className="absolute right-0 top-0 w-full md:w-1/2 h-full z-0">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
          <div className="md:hidden absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent pointer-events-none" />
        </div>

        {/* Bottom trust bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="container mx-auto px-4 pb-4">
            <div className="glass rounded-2xl px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[12px] text-foreground/55">
                <span>Free shipping over TSh 100K</span>
                <span className="text-foreground/15">·</span>
                <span className="hidden sm:inline">30-day returns</span>
                <span className="hidden sm:inline text-foreground/15">·</span>
                <span className="hidden sm:inline">Secure checkout</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-foreground/55">
                <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
                Live deals
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Shop by category</h2>
                <p className="text-[13px] text-foreground/45 mt-1">Find exactly what you&apos;re after</p>
              </div>
              <Link href="/products" className="flex items-center gap-1 text-[13px] text-gold hover:brightness-110 transition-all">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl glass hover:border-gold/30 transition-all hover:-translate-y-1"
                >
                  <Image
                    src={cat.image || categoryImages[cat.slug] || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop"}
                    alt={cat.name}
                    fill
                    className="object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-[13px] text-white font-semibold tracking-tight">{cat.name}</p>
                    <p className="text-[11px] text-white/55 mt-0.5">{cat._count.products} items</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Flash Deals ── */}
      {dealProducts.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Flash deals</h2>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-gold glass rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" /> Live
                  </span>
                </div>
                <p className="text-[13px] text-foreground/45 mt-1">Fresh drops, limited time</p>
              </div>
              <Link href="/products" className="flex items-center gap-1 text-[13px] text-gold hover:brightness-110 transition-all">
                All deals <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {dealProducts.map((product) => (
                <ProductCard key={product.id} product={product as unknown as Product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured ── */}
      {featuredProducts.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Featured picks</h2>
                <p className="text-[13px] text-foreground/45 mt-1">Hand-selected favourites</p>
              </div>
              <Link href="/products?featured=true" className="flex items-center gap-1 text-[13px] text-gold hover:brightness-110 transition-all">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product as unknown as Product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Block ── */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="relative glass rounded-3xl p-8 md:p-12 overflow-hidden text-center">
            <div className="gold-glow absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none" />
            {isLoggedIn ? (
              <div className="relative space-y-4">
                <p className="text-[12px] text-gold tracking-[0.2em] uppercase">Today&apos;s Deals</p>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                  Welcome back — your deals are waiting
                </h2>
                <p className="text-sm text-foreground/55 leading-relaxed max-w-md mx-auto">
                  New deals added daily across Tech, Fashion, Accessories, Shoes &amp; Sports.
                </p>
                <Link href="/products" className="inline-block pt-2">
                  <button className="flex items-center gap-2 px-7 py-3 rounded-full bg-gold text-black text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all mx-auto">
                    View All Deals <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            ) : (
              <div className="relative space-y-4">
                <p className="text-[12px] text-gold tracking-[0.2em] uppercase">Limited Time Offer</p>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                  Get 20% off your first order
                </h2>
                <p className="text-sm text-foreground/55 leading-relaxed max-w-md mx-auto">
                  Sign up today and unlock exclusive deals, early access to flash sales, and personalised recommendations.
                </p>
                <Link href="/register" className="inline-block pt-2">
                  <button className="px-7 py-3 rounded-full bg-gold text-black text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all mx-auto">
                    Create Free Account
                  </button>
                </Link>
                <p className="text-[12px] text-foreground/30">No spam, ever.</p>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
