import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/ProductCard"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/types"
import { SplineScene } from "@/components/ui/splite"
import { Spotlight } from "@/components/ui/spotlight"

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
    take: 8,
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
  const [featuredProducts, categories, dealProducts] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getDealsProducts(),
  ])

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
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <div className="w-6 h-px bg-foreground" />
              <span className="text-foreground text-[9px] font-mono tracking-widest">HAODEALS.SYS</span>
              <div className="flex-1 h-px bg-foreground" />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-foreground font-mono tracking-widest leading-none mb-1">
              BEST
            </h1>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black font-mono tracking-widest leading-none mb-4">
              <span className="text-foreground/25">DEALS.</span>
              <span className="text-foreground">EVER.</span>
            </h1>

            {/* Dot row */}
            <div className="flex gap-0.5 mb-5 opacity-25">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="w-1 h-1 bg-foreground" />
              ))}
            </div>

            <p className="text-[11px] md:text-sm text-foreground/50 font-mono leading-relaxed mb-7 max-w-xs">
              Save up to 70% OFF on TECH · FASHION · ACCESSORIES · SHOES · SPORTS
              <br /><br />
              Shop now &amp; get fast delivery across Tanzania 🇹🇿
            </p>

            {/* Stats */}
            <div className="flex gap-6 mb-7 text-[9px] font-mono text-foreground/40">
              {[["20+", "PRODUCTS"], ["6", "CATEGORIES"], ["70%", "MAX.OFF"]].map(([val, label]) => (
                <div key={label}>
                  <div className="text-xl text-foreground font-bold">{val}</div>
                  <div className="text-[7px] tracking-widest">{label}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link href="/products">
                <button className="relative px-5 py-2 bg-transparent text-foreground font-mono text-xs border border-foreground hover:bg-foreground hover:text-background transition-all duration-200 tracking-widest group">
                  <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  ACCESS.DEALS
                </button>
              </Link>
              <Link href="/register">
                <button className="px-5 py-2 bg-transparent text-foreground/50 font-mono text-xs border border-foreground/30 hover:border-foreground hover:text-foreground transition-all duration-200 tracking-widest">
                  JOIN.FREE
                </button>
              </Link>
            </div>

            {/* Bottom rule */}
            <div className="flex items-center gap-2 mt-7 opacity-25">
              <span className="text-foreground text-[9px] font-mono">∞</span>
              <div className="flex-1 h-px bg-foreground" />
              <span className="text-foreground text-[9px] font-mono">MARKET.PROTOCOL</span>
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
            <div className="flex items-center gap-4 text-[8px] font-mono text-foreground/30">
              <span>FREE.SHIP.TSh100K+</span>
              <span className="text-foreground/10">|</span>
              <span>30D.RETURNS</span>
              <span className="text-foreground/10">|</span>
              <span>AES-256.SECURE</span>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-mono text-foreground/30">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1 h-1 bg-foreground/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <span>LIVE</span>
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
                <h2 className="text-[11px] font-mono tracking-[0.3em] text-foreground/70">CATEGORIES</h2>
              </div>
              <Link href="/products" className="flex items-center gap-1 text-[9px] font-mono text-foreground/40 hover:text-foreground tracking-widest transition-colors">
                VIEW.ALL <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group relative aspect-square overflow-hidden bg-foreground/5 border border-white/10 hover:border-white/30 transition-colors"
                >
                  <Image
                    src={cat.image || categoryImages[cat.slug] || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop"}
                    alt={cat.name}
                    fill
                    className="object-cover opacity-40 group-hover:opacity-60 transition-opacity grayscale"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-[9px] font-mono text-white tracking-widest uppercase">{cat.name}</p>
                    <p className="text-[7px] text-white/40">{cat._count.products} ITEMS</p>
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
                <span className="text-foreground/30 text-[10px]">//</span>
                <h2 className="text-[11px] font-mono tracking-[0.3em] text-foreground/70">FLASH.DEALS</h2>
                <div className="flex items-center gap-1 text-[9px] font-mono text-green-400/60">
                  <div className="w-1.5 h-1.5 bg-green-400/60 rounded-full animate-pulse" />
                  LIVE
                </div>
              </div>
              <Link href="/products" className="flex items-center gap-1 text-[9px] font-mono text-foreground/40 hover:text-foreground tracking-widest transition-colors">
                ALL.DEALS <ArrowRight className="h-2.5 w-2.5" />
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
                <span className="text-foreground/30 text-[10px]">//</span>
                <h2 className="text-[11px] font-mono tracking-[0.3em] text-foreground/70">FEATURED.ITEMS</h2>
              </div>
              <Link href="/products?featured=true" className="flex items-center gap-1 text-[9px] font-mono text-foreground/40 hover:text-foreground tracking-widest transition-colors">
                VIEW.ALL <ArrowRight className="h-2.5 w-2.5" />
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

      {/* ── CTA Terminal Block ── */}
      <section className="py-16 border-b border-white/5">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="border border-white/15 p-8 relative">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/30" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/30" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/30" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/30" />

            <div className="text-center space-y-4">
              <p className="text-[9px] font-mono text-foreground/30 tracking-widest">// SPECIAL.OFFER.PROTOCOL</p>
              <h2 className="text-2xl md:text-3xl font-black font-mono tracking-widest">
                GET 20% OFF<br />
                <span className="text-foreground/40">FIRST ORDER</span>
              </h2>
              <div className="w-full h-px bg-white/10" />
              <p className="text-[11px] font-mono text-foreground/50 leading-relaxed">
                SIGN UP NOW. UNLOCK EXCLUSIVE DEALS, EARLY ACCESS TO FLASH SALES, AND PERSONALIZED RECOMMENDATIONS.
              </p>
              <Link href="/register">
                <button className="mt-2 px-8 py-2.5 bg-foreground text-background font-mono text-xs tracking-widest hover:bg-foreground/90 transition-colors font-bold">
                  INITIALIZE.ACCOUNT
                </button>
              </Link>
              <p className="text-[9px] font-mono text-foreground/20 tracking-widest">NO.SPAM. EVER.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
