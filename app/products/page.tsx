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
  { value: "newest", label: "NEWEST.FIRST" },
  { value: "price-asc", label: "PRICE.LOW→HIGH" },
  { value: "price-desc", label: "PRICE.HIGH→LOW" },
  { value: "discount", label: "BIGGEST.DISCOUNT" },
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
    <div className="container mx-auto px-4 py-8 font-mono">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-foreground/30 text-[10px]">//</span>
          <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">PRODUCTS.INDEX</h1>
          {!loading && (
            <span className="text-[9px] text-foreground/30 ml-auto">
              [{sorted.length}.RESULTS]
            </span>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/30" />
          <input
            type="text"
            placeholder="SEARCH.PRODUCTS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-transparent border border-white/15 text-[10px] tracking-widest text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
          />
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 px-3 py-2 border border-white/15 text-[10px] tracking-widest text-foreground/60 hover:border-white/30 hover:text-foreground transition-colors"
          >
            <SlidersHorizontal className="h-3 w-3" />
            {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "SORT.BY"}
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-background border border-white/20 min-w-[180px]">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSort(opt.value); setSortOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-[9px] tracking-widest transition-colors ${
                    sort === opt.value
                      ? "bg-foreground/10 text-foreground"
                      : "text-foreground/50 hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  {sort === opt.value && <span className="mr-1">›</span>}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <button
          onClick={() => setActiveCategory("")}
          className={`px-3 py-1 text-[9px] tracking-widest transition-colors border ${
            !activeCategory
              ? "bg-foreground text-background border-foreground"
              : "border-white/15 text-foreground/50 hover:border-white/30 hover:text-foreground"
          }`}
        >
          ALL.DEALS
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActiveCategory(activeCategory === cat.slug ? "" : cat.slug)}
            className={`px-3 py-1 text-[9px] tracking-widest transition-colors border ${
              activeCategory === cat.slug
                ? "bg-foreground text-background border-foreground"
                : "border-white/15 text-foreground/50 hover:border-white/30 hover:text-foreground"
            }`}
          >
            {cat.name}
          </button>
        ))}
        {(activeCategory || search) && (
          <button
            onClick={() => { setActiveCategory(""); setSearch("") }}
            className="px-3 py-1 text-[9px] tracking-widest border border-white/20 text-foreground/40 hover:border-red-400/40 hover:text-red-400/70 transition-colors flex items-center gap-1"
          >
            <X className="h-2.5 w-2.5" /> CLEAR.FILTERS
          </button>
        )}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border border-white/10 animate-pulse">
              <div className="aspect-square bg-foreground/5" />
              <div className="p-2.5 space-y-1.5">
                <div className="h-2 bg-foreground/10 w-1/2" />
                <div className="h-2 bg-foreground/10 w-full" />
                <div className="h-2 bg-foreground/10 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 border border-white/10">
          <div className="border border-white/10 p-6">
            <Search className="h-8 w-8 opacity-20" />
          </div>
          <p className="text-[10px] tracking-widest text-foreground/40">NO.RESULTS.FOUND</p>
          <button
            onClick={() => { setActiveCategory(""); setSearch("") }}
            className="px-4 py-1.5 text-[9px] tracking-widest border border-white/20 text-foreground/50 hover:text-foreground hover:border-white/40 transition-colors"
          >
            CLEAR.FILTERS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
