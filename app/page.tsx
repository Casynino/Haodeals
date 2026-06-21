import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { ProductCard } from "@/components/ProductCard"
import {
  ArrowRight, Search, Truck, Tag, ShieldCheck,
  Smartphone, Shirt, Watch, Footprints, Dumbbell, Package,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/types"
import { PromoCarousel, type PromoSlide } from "@/components/PromoCarousel"

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

  // Banner imagery (reuses image IDs already proven in the codebase)
  const bannerShopping = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=600&fit=crop"
  const bannerFashion  = "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&h=600&fit=crop"
  const bannerAccess   = "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=1200&h=600&fit=crop"

  // Promotional carousel slides (image-first)
  const slides: PromoSlide[] = [
    {
      eyebrow: "New deals daily",
      title: "Up to 70% off — premium deals, delivered",
      subtitle: "Tech, Fashion, Accessories, Shoes & Sports, with fast delivery across Tanzania.",
      cta: "Shop Now",
      href: "/products",
      image: heroImage ?? bannerShopping,
      gradient: "bg-[radial-gradient(120%_120%_at_0%_0%,var(--gold-soft),transparent_55%)]",
    },
    {
      eyebrow: "Weekend special",
      title: "Free delivery in Dar es Salaam",
      subtitle: "Order this weekend and we'll deliver it free — fast, within the city.",
      cta: "Browse deals",
      href: "/products",
      image: bannerFashion,
      gradient: "bg-[radial-gradient(120%_120%_at_0%_0%,rgba(56,135,90,0.16),transparent_55%)]",
    },
    isLoggedIn
      ? {
          eyebrow: "Featured deal",
          title: heroProduct?.name ?? "Today's featured deal",
          subtitle: "Handpicked for you — tap through to grab it before it's gone.",
          cta: "View deal",
          href: heroProduct ? `/products/${heroProduct.id}` : "/products",
          image: heroImage ?? bannerAccess,
          gradient: "bg-[radial-gradient(120%_120%_at_0%_0%,rgba(120,90,210,0.16),transparent_55%)]",
        }
      : {
          eyebrow: "Limited time",
          title: "Get 20% off your first order",
          subtitle: "Sign up free to unlock exclusive deals and early access to flash sales.",
          cta: "Create free account",
          href: "/register",
          image: bannerAccess,
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

      {/* ── Trust strip ───────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pt-3">
        <div className="grid grid-cols-3 gap-3">
          {[
            { Icon: Truck,       label: "Fast delivery",   sub: "Across Tanzania" },
            { Icon: Tag,         label: "Up to 70% off",   sub: "Daily deals" },
            { Icon: ShieldCheck, label: "Secure checkout", sub: "Shop with trust" },
          ].map(({ Icon, label, sub }) => (
            <div key={label} className="glass rounded-2xl px-3.5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold-soft flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-foreground/85 truncate">{label}</p>
                <p className="text-[11px] text-foreground/40 truncate">{sub}</p>
              </div>
            </div>
          ))}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {dealProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product as unknown as Product} />
            ))}
          </div>
        </section>
      )}

      {/* ── Mid-page promo banner ─────────────────────────────────── */}
      <section className="container mx-auto px-4 pt-10">
        <div
          className="relative overflow-hidden rounded-3xl p-7 md:p-9"
          style={{ background: "linear-gradient(125deg, rgba(212,175,55,0.20) 0%, rgba(154,118,17,0.10) 35%, rgba(0,0,0,0.35) 100%)" }}
        >
          <div className="gold-glow absolute -top-16 right-10 w-72 h-72 rounded-full pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-[12px] text-gold tracking-[0.2em] uppercase mb-2">Weekend special</p>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Free delivery in Dar es Salaam
              </h3>
              <p className="text-sm text-foreground/55 mt-2 max-w-md">
                Order this weekend and we&apos;ll deliver it free — fast, within the city.
              </p>
            </div>
            <Link href="/products" className="flex-shrink-0">
              <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-black text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all">
                Browse deals <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Collections (visual category showcase) ────────────────── */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 pt-10">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Collections</h2>
              <p className="text-[13px] text-foreground/45 mt-1">Browse curated category edits</p>
            </div>
            <Link href="/products" className="flex items-center gap-1 text-[13px] text-gold hover:brightness-110 transition-all">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={`group relative overflow-hidden rounded-3xl glass hover:border-gold/30 hover:-translate-y-1 transition-all ${i === 0 ? "col-span-2 md:col-span-1 aspect-[2/1] md:aspect-[4/5]" : "aspect-[4/5]"}`}
              >
                <Image
                  src={cat.image || categoryImages[cat.slug] || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop"}
                  alt={cat.name}
                  fill
                  className="object-cover opacity-75 group-hover:opacity-95 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[15px] text-white font-semibold tracking-tight">{cat.name}</p>
                  <p className="text-[12px] text-gold mt-0.5">{cat._count.products} items →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
