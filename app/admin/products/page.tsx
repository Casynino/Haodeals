"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Plus, Pencil, Trash2, Search, Package, X, Upload, ImageIcon } from "lucide-react"
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
  price: number
  originalPrice?: number | null
  stock: number
  images: string[]
  featured: boolean
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
}

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
        toast.error(`UPLOAD.FAILED: ${file.name}`, { className: "font-mono text-xs" })
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
    setOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setUploadedUrls(product.images)
    setForm({
      name: product.name,
      description: "",
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() ?? "",
      stock: product.stock.toString(),
      images: product.images.join(", "),
      featured: product.featured,
      categoryId: product.category.id,
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.categoryId) {
      toast.error("REQUIRED.FIELDS.MISSING", { className: "font-mono text-xs" })
      return
    }
    setSaving(true)
    const body = {
      ...form,
      images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
    }
    const url = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products"
    const method = editing ? "PUT" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success(editing ? "PRODUCT.UPDATED" : "PRODUCT.CREATED", { className: "font-mono text-xs" })
      setOpen(false)
      loadProducts()
    } else {
      toast.error("SAVE.FAILED", { className: "font-mono text-xs" })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("DELETE THIS PRODUCT?")) return
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("PRODUCT.DELETED", { className: "font-mono text-xs" })
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } else {
      toast.error("DELETE.FAILED", { className: "font-mono text-xs" })
    }
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/30 text-[10px]">//</span>
          <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">PRODUCTS.MANAGER</h1>
          <span className="text-[9px] text-foreground/30">[{products.length}.ITEMS]</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className="flex items-center gap-1.5 px-3 py-1.5 border border-white/20 text-[9px] tracking-widest text-foreground/50 hover:text-foreground hover:border-white/40 transition-colors"
            onClick={openAdd}
          >
            <Plus className="h-3 w-3" /> ADD.PRODUCT
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-background border border-white/20 font-mono">
            <DialogHeader>
              <DialogTitle className="text-[10px] tracking-widest text-foreground/60">
                {editing ? "// EDIT.PRODUCT" : "// NEW.PRODUCT"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {[
                { key: "name", label: "PRODUCT.NAME *", placeholder: "Product name" },
                { key: "description", label: "DESCRIPTION", placeholder: "Product description", multiline: true },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">{field.label}</label>
                  {field.multiline ? (
                    <textarea
                      value={form[field.key as keyof typeof form] as string}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      rows={2}
                      className="w-full bg-transparent border border-white/15 px-2.5 py-2 text-[10px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors resize-none"
                    />
                  ) : (
                    <input
                      value={form[field.key as keyof typeof form] as string}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-transparent border border-white/15 px-2.5 py-2 text-[10px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
                    />
                  )}
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "price", label: "PRICE *", placeholder: "29.99" },
                  { key: "originalPrice", label: "ORIG.PRICE", placeholder: "59.99" },
                  { key: "stock", label: "STOCK", placeholder: "100" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">{field.label}</label>
                    <input
                      type="number"
                      value={form[field.key as keyof typeof form] as string}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-transparent border border-white/15 px-2.5 py-2 text-[10px] text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">CATEGORY *</label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => v && setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger className="bg-transparent border-white/15 text-[10px] text-foreground/70 focus:border-white/40">
                    <SelectValue placeholder="SELECT.CATEGORY" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/20 font-mono">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-[10px] tracking-wide">
                        {cat.name.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image upload */}
              <div>
                <label className="text-[8px] tracking-widest text-foreground/30 block mb-1">PRODUCT.IMAGES</label>

                {/* Uploaded previews */}
                {uploadedUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {uploadedUrls.map((url) => (
                      <div key={url} className="relative w-16 h-16 border border-white/15 overflow-hidden group">
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
                <label className={`flex items-center justify-center gap-2 w-full py-3 border border-dashed border-white/20 text-[9px] tracking-widest cursor-pointer transition-colors ${uploading ? "text-foreground/20" : "text-foreground/40 hover:border-white/40 hover:text-foreground/60"}`}>
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
                      {uploadedUrls.length > 0 ? "ADD.MORE.IMAGES" : "UPLOAD.IMAGES"}
                    </>
                  )}
                </label>
                <p className="text-[7px] text-foreground/20 mt-1">JPG · PNG · WEBP · GIF</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="w-3 h-3 accent-foreground"
                />
                <label htmlFor="featured" className="text-[9px] tracking-widest text-foreground/40">FEATURED.PRODUCT</label>
              </div>

              <div className="border-t border-white/10 pt-3 flex gap-2">
                <button
                  className="flex-1 py-2 bg-foreground text-background text-[9px] tracking-widest font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "SAVING..." : editing ? "UPDATE.PRODUCT" : "CREATE.PRODUCT"}
                </button>
                <button
                  className="px-4 py-2 border border-white/20 text-[9px] tracking-widest text-foreground/40 hover:text-foreground hover:border-white/40 transition-colors"
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
          placeholder="SEARCH.PRODUCTS..."
          className="w-full pl-8 pr-8 py-2 bg-transparent border border-white/15 text-[10px] tracking-widest text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
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
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-foreground/5 border border-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-white/10">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-[10px] tracking-widest text-foreground/30">NO.PRODUCTS.FOUND</p>
        </div>
      ) : (
        <div className="border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-foreground/3 text-[8px] tracking-widest text-foreground/25">
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
                        <div className="relative w-10 h-10 overflow-hidden bg-foreground/5 border border-white/10 flex-shrink-0">
                          <Image
                            src={product.images[0] ?? ""}
                            alt={product.name}
                            fill
                            className="object-cover opacity-70"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-foreground/70 line-clamp-1 uppercase tracking-wide">{product.name}</p>
                          {product.featured && (
                            <span className="text-[7px] text-yellow-400/60 border border-yellow-400/25 px-1 tracking-widest">FEATURED</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[9px] text-foreground/30 uppercase">{product.category.name}</td>
                    <td className="p-3 text-right">
                      <span className="text-[10px] text-green-400/70">${product.price.toFixed(2)}</span>
                      {product.originalPrice && (
                        <span className="text-[8px] text-foreground/20 line-through ml-1">${product.originalPrice.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`text-[8px] border px-1.5 py-0.5 tracking-widest ${
                        product.stock === 0
                          ? "text-red-400/60 border-red-400/25"
                          : product.stock < 10
                          ? "text-yellow-400/60 border-yellow-400/25"
                          : "text-green-400/60 border-green-400/25"
                      }`}>
                        {product.stock === 0 ? "OUT" : product.stock}
                      </span>
                    </td>
                    <td className="p-3 text-right text-[9px] text-foreground/30">{product._count.orderItems}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="w-7 h-7 flex items-center justify-center border border-white/10 text-foreground/30 hover:text-foreground hover:border-white/30 transition-colors"
                          onClick={() => openEdit(product)}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          className="w-7 h-7 flex items-center justify-center border border-white/10 text-foreground/30 hover:text-red-400/70 hover:border-red-400/30 transition-colors"
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
