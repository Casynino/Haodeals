"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/ProductCard"
import { Search, SlidersHorizontal, X } from "lucide-react"
import type { Product } from "@/types"

const CATEGORIES = [
  { slug: "tech-deals", name: "TECH DEALS" },
  { slug: "fashion", name: "FASHION" },
  { slug: "accessories", name: "ACCESSORIES" },
  { slug: "shoes", name: "SHOES" },
  { slug: "sports", name: "SPORTS" },
]

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price low→HIGH" },
  { value: "price-desc", label: "Price high→LOW" },
  { value: "discount", label: "Biggest discount" },
]

function ProductsContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("newest")
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") ?? "")
  const [sortOpen, setSortOpen] = useState(false)

  useEffect(() => {
    setActiveCategory(searchParams.get("category") ?? "")
  }, [searchParams])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeCategory) params.set("category", activeCategory)
      if (search) params.set("search", search)
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      setProducts(data)
      setLoading(false)
    }
    load()
  }, [activeCategory, search])

  const sorted = [...products].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price
    if (sort === "price-desc") return b.price - a.price
    if (sort === "discount") {
      const da = a.originalPrice ? a.originalPrice - a.price : 0
      const db = b.originalPrice ? b.originalPrice - b.price : 0
      return db - da
    }
    return 0
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-foreground/10 pb-6 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-lg font-semibold tracking-[0.2em] text-foreground/90">PRODUCTS</h1>
          {!loading && (
            <span className="text-xs text-foreground/50 ml-auto">
              {sorted.length} results
            </span>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-transparent border border-foreground/15 rounded-xl text-xs text-foreground/80 placeholder:text-foreground/35 focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-foreground/15 text-xs text-foreground/65 hover:border-foreground/30 hover:text-foreground transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "SORT BY"}
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 glass rounded-2xl min-w-[190px] shadow-xl overflow-hidden">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSort(opt.value); setSortOpen(false) }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs tracking-wide transition-colors ${
                    sort === opt.value
                      ? "bg-foreground/10 text-foreground"
                      : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  {sort === opt.value && <span className="mr-1.5">›</span>}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory("")}
          className={`px-3.5 py-1.5 text-xs tracking-wide rounded-full transition-colors border ${
            !activeCategory
              ? "bg-gold text-black border-gold"
              : "border-foreground/15 text-foreground/60 hover:border-foreground/30 hover:text-foreground"
          }`}
        >
          ALL DEALS
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActiveCategory(activeCategory === cat.slug ? "" : cat.slug)}
            className={`px-3.5 py-1.5 text-xs tracking-wide rounded-full transition-colors border ${
              activeCategory === cat.slug
                ? "bg-gold text-black border-gold"
                : "border-foreground/15 text-foreground/60 hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {cat.name}
          </button>
        ))}
        {(activeCategory || search) && (
          <button
            onClick={() => { setActiveCategory(""); setSearch("") }}
            className="px-3.5 py-1.5 text-xs rounded-full border border-foreground/15 text-foreground/50 hover:border-red-400/45 hover:text-red-400/80 transition-colors flex items-center gap-1.5"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-3xl glass animate-pulse overflow-hidden">
              <div className="aspect-square bg-foreground/5" />
              <div className="p-3 space-y-2">
                <div className="h-2 bg-foreground/10 rounded w-1/2" />
                <div className="h-2 bg-foreground/10 rounded w-full" />
                <div className="h-2 bg-foreground/10 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-3xl glass">
          <div className="glass rounded-2xl p-6">
            <Search className="h-8 w-8 opacity-30" />
          </div>
          <p className="text-sm tracking-widest text-foreground/55">No results found</p>
          <button
            onClick={() => { setActiveCategory(""); setSearch("") }}
            className="px-4 py-2 text-xs tracking-wide rounded-full glass text-foreground/60 hover:text-foreground transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  )
}
