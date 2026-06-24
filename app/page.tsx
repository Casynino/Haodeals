import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { ProductCard } from "@/components/ProductCard"
import {
  ArrowRight, Search, Sparkles,
  Smartphone, Shirt, Watch, Footprints, Dumbbell, Package,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/types"
import { PromoCarousel, type PromoSlide } from "@/components/PromoCarousel"
import { HaoPlusBanner } from "@/components/HaoPlusBanner"

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

const categoryIcons: Record<string, typeof Package> = {
  "tech-deals": Smartphone,
  fashion:      Shirt,
  accessories:  Watch,
  shoes:        Footprints,
  sports:       Dumbbell,
}

export default async function HomePage() {
  const [session, featuredProducts, categories, dealProducts] = await Promise.all([
    auth(),
    getFeaturedProducts(),
    getCategories(),
    getDealsProducts(),
  ])
  const isLoggedIn = !!session?.user
  const heroProduct = featuredProducts[0] ?? dealProducts[0]
  const heroImage = heroProduct?.images?.[0]

  // Best active discount per category — powers the "Up to X% off" deal tiles
  const discountByCat = new Map<string, number>()
  for (const p of dealProducts) {
    if (p.originalPrice && p.originalPrice > p.price && p.category?.slug) {
      const d = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      discountByCat.set(p.category.slug, Math.max(discountByCat.get(p.category.slug) ?? 0, d))
    }
  }

  // Banner imagery — African lifestyle shots (verified live).
  // NOTE: swap any of these freely, or drop your own into /public/banners and
  // reference e.g. "/banners/hero.jpg" (or set `video: "/banners/clip.mp4"`).
  const bannerDelivery = "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1280&h=620&fit=crop"
  const bannerCrew     = "https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=1280&h=620&fit=crop"
  const bannerPromo    = "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=1280&h=620&fit=crop"

  // Promotional carousel slides (image-first, people/lifestyle)
  const slides: PromoSlide[] = [
    {
      // Custom marketing banner — text baked into the artwork; image-only
      eyebrow: "", title: "", subtitle: "", cta: "Shop Now",
      href: "/products",
      image: "/banners/banner2.png",
      bare: true,
      gradient: "",
    },
    {
      eyebrow: "Weekend special",
      title: "Free delivery in Dar es Salaam",
      subtitle: "Order this weekend and we'll deliver it free — fast, within the city.",
      cta: "Browse deals",
      href: "/products",
      image: bannerDelivery,
      gradient: "bg-[radial-gradient(120%_120%_at_0%_0%,rgba(56,135,90,0.16),transparent_55%)]",
    },
    isLoggedIn
      ? {
          eyebrow: "Featured deal",
          title: heroProduct?.name ?? "Today's featured deal",
          subtitle: "Handpicked for you — tap through to grab it before it's gone.",
          cta: "View deal",
          href: heroProduct ? `/products/${heroProduct.id}` : "/products",
          image: bannerCrew,
          gradient: "bg-[radial-gradient(120%_120%_at_0%_0%,rgba(120,90,210,0.16),transparent_55%)]",
        }
      : {
          eyebrow: "Limited time",
          title: "Get 20% off your first order",
          subtitle: "Sign up free to unlock exclusive deals and early access to flash sales.",
          cta: "Create free account",
          href: "/register",
          image: bannerCrew,
          gradient: "bg-[radial-gradient(120%_120%_at_0%_0%,rgba(120,90,210,0.16),transparent_55%)]",
        },
  ]

  return (
    <div className="flex flex-col pb-10">

      {/* ── Promotional carousel ──────────────────────────────────── */}
      <section className="container mx-auto px-4 pt-5">
        <PromoCarousel slides={slides} />
      </section>

      {/* ── Search shortcut ───────────────────────────────────────── */}
      <section className="container mx-auto px-4 pt-4">
        <Link
          href="/products"
          className="flex items-center gap-3 glass rounded-2xl px-4 py-3.5 text-foreground/45 hover:border-gold/30 transition-all"
        >
          <Search className="h-4 w-4 text-gold" />
          <span className="text-sm">Search products, categories and deals…</span>
        </Link>
      </section>

      {/* ── Animated ticker ───────────────────────────────────────── */}
      <section className="container mx-auto px-4 pt-3">
        <div className="relative overflow-hidden rounded-2xl glass py-3">
          {/* soft fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-background to-transparent" />
          <div className="flex carousel-track w-max">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center shrink-0">
                {[
                  "Good Deals, Delivered",
                  "Fast delivery across Tanzania",
                  "Up to 70% off — every day",
                  "Secure checkout",
                  "New deals daily",
                ].map((phrase, i) => (
                  <span key={`${dup}-${i}`} className="flex items-center whitespace-nowrap">
                    <Sparkles className="h-3.5 w-3.5 text-gold mx-3 flex-shrink-0" />
                    <span className="text-sm font-semibold text-foreground/70">{phrase}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop by category (quick nav) ──────────────────────────── */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 pt-9">
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-4">Shop by category</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.slug] ?? Package
              return (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} className="group flex flex-col items-center gap-2 flex-shrink-0 w-[4.5rem]">
                  <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center group-hover:border-gold/40 group-hover:-translate-y-0.5 transition-all">
                    <Icon className="h-6 w-6 text-gold" />
                  </div>
                  <span className="text-[11px] text-foreground/60 text-center leading-tight line-clamp-2">{cat.name}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Flash deals ───────────────────────────────────────────── */}
      {dealProducts.length > 0 && (
        <section className="container mx-auto px-4 pt-9">
          <div className="flex items-end justify-between mb-5">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {dealProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product as unknown as Product} />
            ))}
          </div>
        </section>
      )}

      {/* ── Mid-page promo banner (image-based) ───────────────────── */}
      <section className="container mx-auto px-4 pt-10">
        <div className="relative overflow-hidden rounded-3xl aspect-[16/9] sm:aspect-[3/1] lg:aspect-[21/7]">
          <Image src={bannerPromo} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />
          <div className="gold-glow absolute -top-16 right-10 w-72 h-72 rounded-full pointer-events-none" />
          <div className="relative h-full flex items-center">
            <div className="px-6 md:px-10 max-w-lg">
              <p className="text-[12px] text-gold tracking-[0.2em] uppercase mb-2">Weekend special</p>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                Free delivery in Dar es Salaam
              </h3>
              <p className="text-sm text-white/75 mt-2 mb-5 max-w-md">
                Order this weekend and we&apos;ll deliver it free — fast, within the city.
              </p>
              <Link href="/products">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-black text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all">
                  Browse deals <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Deals by category (Walmart-style discount tiles) ──────── */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 pt-10">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Top deals by category</h2>
              <p className="text-[13px] text-foreground/45 mt-1">Save big across every department</p>
            </div>
            <Link href="/products" className="flex items-center gap-1 text-[13px] text-gold hover:brightness-110 transition-all">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {categories.map((cat, i) => {
              const disc = discountByCat.get(cat.slug)
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className={`group relative overflow-hidden rounded-3xl glass hover:-translate-y-1 hover:shadow-[0_22px_60px_-18px_rgba(0,0,0,0.4)] transition-all ${i === 0 ? "col-span-2 sm:col-span-1 aspect-[2/1] sm:aspect-[4/5]" : "aspect-[4/5]"}`}
                >
                  <Image
                    src={cat.image || categoryImages[cat.slug] || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop"}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-black/10" />
                  {/* Discount badge */}
                  <div className="absolute top-3 left-3">
                    {disc ? (
                      <span className="inline-block bg-gold text-black text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-lg tracking-wide">
                        UP TO {disc}% OFF
                      </span>
                    ) : (
                      <span className="inline-block bg-white/90 text-black text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                        Deals
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-[16px] text-white font-bold tracking-tight">{cat.name}</p>
                    <span className="inline-flex items-center gap-1 text-[12px] text-gold font-semibold mt-1">
                      Shop deals <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Hǎo+ featured service ─────────────────────────────────── */}
      <section className="container mx-auto px-4 pt-10">
        <HaoPlusBanner variant="home" />
      </section>

      {/* ── Featured picks ────────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 pt-10">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Featured picks</h2>
              <p className="text-[13px] text-foreground/45 mt-1">Hand-selected favourites</p>
            </div>
            <Link href="/products?featured=true" className="flex items-center gap-1 text-[13px] text-gold hover:brightness-110 transition-all">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product as unknown as Product} />
            ))}
          </div>
        </section>
      )}

      {/* ── Closing CTA ───────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pt-12">
        <div className="relative glass rounded-3xl p-8 md:p-12 overflow-hidden text-center max-w-3xl mx-auto">
          <div className="gold-glow absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none" />
          {isLoggedIn ? (
            <div className="relative space-y-4">
              <p className="text-[12px] text-gold tracking-[0.2em] uppercase">Today&apos;s Deals</p>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Welcome back — your deals are waiting</h2>
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
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Get 20% off your first order</h2>
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
      </section>

    </div>
  )
}
