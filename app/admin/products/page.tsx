"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Plus, Pencil, Trash2, Search, Package, X, Upload, ImageIcon } from "lucide-react"
import type { ProductOption } from "@/types"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Product {
  id: string
  name: string
  description?: string | null
  price: number
  originalPrice?: number | null
  stock: number
  images: string[]
  featured: boolean
  options?: ProductOption[]
  dealEndsAt?: string | null
  category: { name: string; id: string }
  _count: { orderItems: number; reviews: number }
}

interface Category {
  id: string
  name: string
  slug: string
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  stock: "",
  images: "",
  featured: false,
  categoryId: "",
  dealEndsAt: "",
}

const PRESET_OPTIONS: ProductOption[] = [
  { name: "Size", values: ["XS", "S", "M", "L", "XL", "XXL"] },
  { name: "Color", values: ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Grey"] },
  { name: "Storage", values: ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"] },
  { name: "RAM", values: ["4GB", "8GB", "16GB", "32GB", "64GB"] },
  { name: "Material", values: ["Cotton", "Polyester", "Leather", "Wool", "Silk", "Denim"] },
]

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [options, setOptions] = useState<ProductOption[]>([])
  const [newOptionName, setNewOptionName] = useState("")
  const [newOptionValues, setNewOptionValues] = useState<Record<number, string>>({})

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    const urls: string[] = []
    for (const file of files) {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (res.ok) {
        const { url } = await res.json()
        urls.push(url)
      } else {
        toast.error(`Upload failed: ${file.name}`, { className: " text-xs" })
      }
    }
    const merged = [...uploadedUrls, ...urls]
    setUploadedUrls(merged)
    setForm((prev) => ({ ...prev, images: merged.join(", ") }))
    setUploading(false)
    e.target.value = ""
  }

  function removeUploadedUrl(url: string) {
    const next = uploadedUrls.filter((u) => u !== url)
    setUploadedUrls(next)
    setForm((prev) => ({ ...prev, images: next.join(", ") }))
  }

  async function loadProducts() {
    const res = await fetch("/api/admin/products")
    const data = await res.json()
    setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
    fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(() => {})
  }, [])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setUploadedUrls([])
    setOptions([])
    setNewOptionName("")
    setNewOptionValues({})
    setOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setUploadedUrls(product.images)
    setOptions(product.options ?? [])
    setNewOptionName("")
    setNewOptionValues({})
    // Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:MM)
    const dealEndsAtLocal = product.dealEndsAt
      ? new Date(product.dealEndsAt).toISOString().slice(0, 16)
      : ""
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() ?? "",
      stock: product.stock.toString(),
      images: product.images.join(", "),
      featured: product.featured,
      categoryId: product.category.id,
      dealEndsAt: dealEndsAtLocal,
    })
    setOpen(true)
  }

  function addPresetOption(preset: ProductOption) {
    if (options.find((o) => o.name === preset.name)) return
    setOptions([...options, { ...preset }])
  }

  function addCustomOption() {
    const name = newOptionName.trim()
    if (!name || options.find((o) => o.name === name)) return
    setOptions([...options, { name, values: [] }])
    setNewOptionName("")
  }

  function removeOption(idx: number) {
    setOptions(options.filter((_, i) => i !== idx))
  }

  function addOptionValue(idx: number) {
    const val = (newOptionValues[idx] ?? "").trim()
    if (!val || options[idx].values.includes(val)) return
    const next = options.map((o, i) => i === idx ? { ...o, values: [...o.values, val] } : o)
    setOptions(next)
    setNewOptionValues({ ...newOptionValues, [idx]: "" })
  }

  function removeOptionValue(optIdx: number, val: string) {
    setOptions(options.map((o, i) => i === optIdx ? { ...o, values: o.values.filter((v) => v !== val) } : o))
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.categoryId) {
      toast.error("Required fields missing", { className: " text-xs" })
      return
    }
    setSaving(true)
    const body = {
      ...form,
      images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
      options: options.filter((o) => o.values.length > 0),
    }
    const url = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products"
    const method = editing ? "PUT" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success(editing ? "Product updated" : "Product created", { className: " text-xs" })
      setOpen(false)
      loadProducts()
    } else {
      toast.error("Save failed", { className: " text-xs" })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("DELETE THIS PRODUCT?")) return
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Product deleted", { className: " text-xs" })
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } else {
      toast.error("Delete failed", { className: " text-xs" })
    }
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-foreground/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/30 text-[12px]"></span>
          <h1 className="text-[13px] tracking-[0.3em] text-foreground/70">Products manager</h1>
          <span className="text-[11px] text-foreground/30">[{products.length}.ITEMS]</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className="flex items-center gap-1.5 px-3 py-1.5 border border-foreground/20 text-[11px] tracking-widest text-foreground/50 hover:text-foreground hover:border-foreground/40 transition-colors"
            onClick={openAdd}
          >
            <Plus className="h-3 w-3" /> Add product
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-background border border-foreground/20">
            <DialogHeader>
              <DialogTitle className="text-[12px] tracking-widest text-foreground/60">
                {editing ? "// Edit product" : "// New product"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {[
                { key: "name", label: "Product name *", placeholder: "Product name" },
                { key: "description", label: "DESCRIPTION", placeholder: "Product description", multiline: true },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[10px] tracking-widest text-foreground/30 block mb-1">{field.label}</label>
                  {field.multiline ? (
                    <textarea
                      value={form[field.key as keyof typeof form] as string}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      rows={2}
                      className="w-full bg-transparent border border-foreground/15 px-2.5 py-2 text-[12px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors resize-none"
                    />
                  ) : (
                    <input
                      value={form[field.key as keyof typeof form] as string}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-transparent border border-foreground/15 px-2.5 py-2 text-[12px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                  )}
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "price", label: "PRICE *", placeholder: "29.99" },
                  { key: "originalPrice", label: "Orig price", placeholder: "59.99" },
                  { key: "stock", label: "STOCK", placeholder: "100" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-[10px] tracking-widest text-foreground/30 block mb-1">{field.label}</label>
                    <input
                      type="number"
                      value={form[field.key as keyof typeof form] as string}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-transparent border border-foreground/15 px-2.5 py-2 text-[12px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] tracking-widest text-foreground/30 block mb-1">CATEGORY *</label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => v && setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger className="bg-transparent border-foreground/15 text-[12px] text-foreground/70 focus:border-foreground/40">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-foreground/20">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-[12px] tracking-wide">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] tracking-widest text-foreground/30">Product options</label>
                  <span className="text-[10px] text-foreground/20">SIZE · COLOR · STORAGE · ETC</span>
                </div>

                {/* Preset chips */}
                <div className="flex flex-wrap gap-1">
                  {PRESET_OPTIONS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => addPresetOption(preset)}
                      disabled={!!options.find((o) => o.name === preset.name)}
                      className="px-2 py-0.5 text-[10px] tracking-widest border border-foreground/15 text-foreground/40 hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>

                {/* Custom option */}
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomOption())}
                    placeholder="CUSTOM OPTION NAME..."
                    className="flex-1 bg-transparent border border-foreground/15 px-2 py-1.5 text-[11px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addCustomOption}
                    className="px-3 border border-foreground/15 text-[11px] text-foreground/40 hover:text-foreground hover:border-foreground/40 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Option groups */}
                {options.map((opt, idx) => (
                  <div key={idx} className="border border-foreground/10 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] tracking-widest text-foreground/60">{opt.name}</span>
                      <button type="button" onClick={() => removeOption(idx)} className="text-foreground/20 hover:text-red-400/70 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {opt.values.map((val) => (
                        <span key={val} className="flex items-center gap-1 px-1.5 py-0.5 bg-foreground/5 border border-foreground/10 text-[10px] text-foreground/60">
                          {val}
                          <button type="button" onClick={() => removeOptionValue(idx, val)} className="text-foreground/20 hover:text-red-400/70 transition-colors">
                            <X className="h-2 w-2" />
                          </button>
                        </span>
                      ))}
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={newOptionValues[idx] ?? ""}
                          onChange={(e) => setNewOptionValues({ ...newOptionValues, [idx]: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOptionValue(idx))}
                          placeholder="Add value..."
                          className="w-24 bg-transparent border border-dashed border-foreground/15 px-1.5 py-0.5 text-[10px] text-foreground/60 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40"
                        />
                        <button type="button" onClick={() => addOptionValue(idx)} className="px-1.5 border border-dashed border-foreground/15 text-[10px] text-foreground/30 hover:text-foreground hover:border-foreground/40 transition-colors">
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Image upload */}
              <div>
                <label className="text-[10px] tracking-widest text-foreground/30 block mb-1">Product images</label>

                {/* Uploaded previews */}
                {uploadedUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {uploadedUrls.map((url) => (
                      <div key={url} className="relative w-16 h-16 border border-foreground/15 overflow-hidden group">
                        <Image src={url} alt="" fill className="object-cover opacity-70" />
                        <button
                          type="button"
                          onClick={() => removeUploadedUrl(url)}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-red-400/80" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <label className={`flex items-center justify-center gap-2 w-full py-3 border border-dashed border-foreground/20 text-[11px] tracking-widest cursor-pointer transition-colors ${uploading ? "text-foreground/20" : "text-foreground/40 hover:border-foreground/40 hover:text-foreground/60"}`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="sr-only"
                  />
                  {uploading ? (
                    <>
                      <Upload className="h-3 w-3 animate-pulse" />
                      UPLOADING...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-3 w-3" />
                      {uploadedUrls.length > 0 ? "Add more images" : "Upload images"}
                    </>
                  )}
                </label>
                <p className="text-[10px] text-foreground/20 mt-1">JPG · PNG · WEBP · GIF</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="w-3 h-3 accent-foreground"
                />
                <label htmlFor="featured" className="text-[11px] tracking-widest text-foreground/40">Featured product</label>
              </div>

              {/* Deal countdown timer */}
              <div>
                <label className="text-[10px] tracking-widest text-foreground/30 block mb-1">
                  Deal ends at <span className="text-foreground/20">(OPTIONAL — activates countdown timer)</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.dealEndsAt}
                  onChange={(e) => setForm({ ...form, dealEndsAt: e.target.value })}
                  className="w-full bg-transparent border border-foreground/15 px-2.5 py-2 text-[12px] text-foreground/70 focus:outline-none focus:border-foreground/40 transition-colors"
                />
                {form.dealEndsAt && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, dealEndsAt: "" })}
                    className="text-[10px] text-foreground/30 hover:text-red-400/70 transition-colors mt-1"
                  >
                    ✕ Clear timer
                  </button>
                )}
              </div>

              <div className="border-t border-foreground/10 pt-3 flex gap-2">
                <button
                  className="flex-1 py-2 bg-foreground text-background text-[11px] tracking-widest font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "SAVING..." : editing ? "Update product" : "Create product"}
                </button>
                <button
                  className="px-4 py-2 border border-foreground/20 text-[11px] tracking-widest text-foreground/40 hover:text-foreground hover:border-foreground/40 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/25" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-8 pr-8 py-2 bg-transparent border border-foreground/15 text-[12px] tracking-widest text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-foreground/5 border border-foreground/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-foreground/10">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-[12px] tracking-widest text-foreground/30">No products found</p>
        </div>
      ) : (
        <div className="border border-foreground/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-foreground/10 bg-foreground/3 text-[10px] tracking-widest text-foreground/25">
                  <th className="text-left p-3">PRODUCT</th>
                  <th className="text-left p-3">CATEGORY</th>
                  <th className="text-right p-3">PRICE</th>
                  <th className="text-right p-3">STOCK</th>
                  <th className="text-right p-3">ORDERS</th>
                  <th className="text-right p-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-foreground/3 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="relative w-10 h-10 overflow-hidden bg-foreground/5 border border-foreground/10 flex-shrink-0">
                          <Image
                            src={product.images[0] ?? ""}
                            alt={product.name}
                            fill
                            className="object-cover opacity-70"
                          />
                        </div>
                        <div>
                          <p className="text-[12px] text-foreground/70 line-clamp-1 uppercase tracking-wide">{product.name}</p>
                          {product.featured && (
                            <span className="text-[10px] text-yellow-400/60 border border-yellow-400/25 px-1 tracking-widest">FEATURED</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[11px] text-foreground/30 uppercase">{product.category.name}</td>
                    <td className="p-3 text-right">
                      <span className="text-[12px] text-green-400/70">{formatPrice(product.price)}</span>
                      {product.originalPrice && (
                        <span className="text-[10px] text-foreground/20 line-through ml-1">{formatPrice(product.originalPrice)}</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`text-[10px] border px-1.5 py-0.5 tracking-widest ${
                        product.stock === 0
                          ? "text-red-400/60 border-red-400/25"
                          : product.stock < 10
                          ? "text-yellow-400/60 border-yellow-400/25"
                          : "text-green-400/60 border-green-400/25"
                      }`}>
                        {product.stock === 0 ? "OUT" : product.stock}
                      </span>
                    </td>
                    <td className="p-3 text-right text-[11px] text-foreground/30">{product._count.orderItems}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="w-7 h-7 flex items-center justify-center border border-foreground/10 text-foreground/30 hover:text-foreground hover:border-foreground/30 transition-colors"
                          onClick={() => openEdit(product)}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          className="w-7 h-7 flex items-center justify-center border border-foreground/10 text-foreground/30 hover:text-red-400/70 hover:border-red-400/30 transition-colors"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
