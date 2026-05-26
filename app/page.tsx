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

      {/* ── Hero: Spline robot + terminal text ── */}
      <div className="relative h-screen bg-background overflow-hidden flex">

        {/* Spotlight */}
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-foreground/20 z-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-foreground/20 z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-foreground/20 z-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-foreground/20 z-20 pointer-events-none" />

        {/* Scanline */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(128,128,128,0.04) 2px, rgba(128,128,128,0.04) 4px)" }}
        />

        {/* Left: text content */}
        <div className="relative z-20 w-full md:w-1/2 flex flex-col justify-center px-6 md:px-14 lg:px-20">
          <div className="max-w-md">

            {/* Top rule */}
            <div className="flex items-center gap-2 mb-4 opacity-60">
              <div className="w-6 h-px bg-foreground" />
              <span className="text-foreground text-[10px] font-mono tracking-widest">HAODEALS</span>
              <div className="flex-1 h-px bg-foreground" />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-foreground font-mono tracking-widest leading-none mb-1">
              BEST
            </h1>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black font-mono tracking-widest leading-none mb-4">
              <span className="text-foreground/35">DEALS.</span>
              <span className="text-foreground">EVER.</span>
            </h1>

            {/* Dot row */}
            <div className="flex gap-0.5 mb-5 opacity-30">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="w-1 h-1 bg-foreground" />
              ))}
            </div>

            <p className="text-xs md:text-sm text-foreground/65 font-mono leading-relaxed mb-7 max-w-xs">
              Save up to 70% OFF on TECH · FASHION · ACCESSORIES · SHOES · SPORTS
              <br /><br />
              Shop now &amp; get fast delivery across Tanzania 🇹🇿
            </p>

            {/* Stats */}
            <div className="flex gap-6 mb-7 font-mono text-foreground/55">
              {[["20+", "PRODUCTS"], ["5", "CATEGORIES"], ["70%", "MAX OFF"]].map(([val, label]) => (
                <div key={label}>
                  <div className="text-xl text-foreground font-bold">{val}</div>
                  <div className="text-[10px] tracking-widest">{label}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link href="/products">
                <button className="relative px-5 py-2 bg-transparent text-foreground font-mono text-xs border border-foreground hover:bg-foreground hover:text-background transition-all duration-200 tracking-widest group">
                  <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  Shop Now
                </button>
              </Link>
              {!isLoggedIn && (
                <Link href="/register">
                  <button className="px-5 py-2 bg-transparent text-foreground/50 font-mono text-xs border border-foreground/30 hover:border-foreground hover:text-foreground transition-all duration-200 tracking-widest">
                    Create Free Account
                  </button>
                </Link>
              )}
            </div>

            {/* Bottom rule */}
            <div className="flex items-center gap-2 mt-7 opacity-25">
              <span className="text-foreground text-[9px] font-mono">∞</span>
              <div className="flex-1 h-px bg-foreground" />
            </div>
          </div>
        </div>

        {/* Spline robot — right half on desktop, full bg on mobile */}
        <div className="absolute right-0 top-0 w-full md:w-1/2 h-full z-0">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
          {/* Mobile: gradient so left-side text stays legible */}
          <div className="md:hidden absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent pointer-events-none" />
        </div>

        {/* Bottom status bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-foreground/10 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] font-mono text-foreground/50">
              <span>Free shipping over TSh 100K</span>
              <span className="text-foreground/20">|</span>
              <span>30-day returns</span>
              <span className="text-foreground/20">|</span>
              <span>Secure checkout</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-foreground/50">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-green-400/60 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <span>Live deals</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Categories Grid ── */}
      {categories.length > 0 && (
        <section className="py-12 border-b border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-mono tracking-[0.25em] text-foreground/80 font-semibold">CATEGORIES</h2>
              </div>
              <Link href="/products" className="flex items-center gap-1 text-[10px] font-mono text-foreground/55 hover:text-foreground tracking-widest transition-colors">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group relative aspect-square overflow-hidden bg-foreground/5 border border-white/12 hover:border-white/35 transition-colors"
                >
                  <Image
                    src={cat.image || categoryImages[cat.slug] || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop"}
                    alt={cat.name}
                    fill
                    className="object-cover opacity-55 group-hover:opacity-75 transition-opacity grayscale"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-[11px] font-mono text-white tracking-widest uppercase font-medium">{cat.name}</p>
                    <p className="text-[10px] text-white/55 mt-0.5">{cat._count.products} items</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Flash Deals ── */}
      {dealProducts.length > 0 && (
        <section className="py-12 border-b border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-foreground/40 text-xs">//</span>
                <h2 className="text-sm font-mono tracking-[0.25em] text-foreground/80 font-semibold">Flash Deals</h2>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-green-400/75">
                  <div className="w-1.5 h-1.5 bg-green-400/75 rounded-full animate-pulse" />
                  Live
                </div>
              </div>
              <Link href="/products" className="flex items-center gap-1 text-[10px] font-mono text-foreground/55 hover:text-foreground tracking-widest transition-colors">
                All Deals <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {dealProducts.map((product) => (
                <ProductCard key={product.id} product={product as unknown as Product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured ── */}
      {featuredProducts.length > 0 && (
        <section className="py-12 border-b border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-foreground/40 text-xs">//</span>
                <h2 className="text-sm font-mono tracking-[0.25em] text-foreground/80 font-semibold">Featured</h2>
              </div>
              <Link href="/products?featured=true" className="flex items-center gap-1 text-[10px] font-mono text-foreground/55 hover:text-foreground tracking-widest transition-colors">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product as unknown as Product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Block ── */}
      <section className="py-16 border-b border-white/5">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="border border-white/15 p-8 relative">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/30" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/30" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/30" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/30" />

            {isLoggedIn ? (
              /* Logged-in: push straight to deals */
              <div className="text-center space-y-4">
                <p className="text-[9px] font-mono text-foreground/30 tracking-widest">Today&apos;s Deals</p>
                <h2 className="text-2xl md:text-3xl font-black font-mono tracking-widest">
                  Welcome Back!<br />
                  <span className="text-foreground/40">Deals Are Waiting</span>
                </h2>
                <div className="w-full h-px bg-white/10" />
                <p className="text-sm text-foreground/50 leading-relaxed">
                  New deals added daily across Tech, Fashion, Accessories, Shoes &amp; Sports.
                </p>
                <Link href="/products">
                  <button className="mt-2 px-8 py-2.5 bg-foreground text-background font-mono text-xs tracking-widest hover:bg-foreground/90 transition-colors font-bold flex items-center gap-2 mx-auto">
                    View All Deals <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>
            ) : (
              /* Guest: drive signup with offer */
              <div className="text-center space-y-4">
                <p className="text-[9px] font-mono text-foreground/30 tracking-widest">Limited Time Offer</p>
                <h2 className="text-2xl md:text-3xl font-black font-mono tracking-widest">
                  Get 20% Off<br />
                  <span className="text-foreground/40">Your First Order</span>
                </h2>
                <div className="w-full h-px bg-white/10" />
                <p className="text-sm text-foreground/50 leading-relaxed">
                  Sign up today and unlock exclusive deals, early access to flash sales, and personalised recommendations.
                </p>
                <Link href="/register">
                  <button className="mt-2 px-8 py-2.5 bg-foreground text-background font-mono text-xs tracking-widest hover:bg-foreground/90 transition-colors font-bold">
                    Create Free Account
                  </button>
                </Link>
                <p className="text-[9px] font-mono text-foreground/20 tracking-widest">No spam, ever.</p>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
