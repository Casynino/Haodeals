"use client"

import { useCart } from "@/hooks/useCart"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, ShieldCheck, Truck } from "lucide-react"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const cartTotal = total()
  const shipping = 0
  const finalTotal = cartTotal

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-6 text-center font-mono">
        <div className="border border-white/10 p-8">
          <ShoppingCart className="h-12 w-12 opacity-20" />
        </div>
        <p className="text-[11px] tracking-widest text-foreground/40">Your cart is empty</p>
        <p className="text-[9px] text-foreground/20">Add some items to get started</p>
        <Link href="/products" className="px-6 py-2 text-[10px] tracking-widest border border-white/20 text-foreground/60 hover:text-foreground hover:border-white/40 transition-colors flex items-center gap-2">
          Browse Deals <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-[0.2em] text-foreground/90">Your Cart</h1>
          <span className="text-xs text-foreground/55">{items.length} {items.length === 1 ? "item" : "items"}</span>
        </div>
        <button
          onClick={() => { clearCart(); toast.success("Cart cleared") }}
          className="text-[9px] tracking-widest text-foreground/30 hover:text-red-400/70 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 border border-white/10 hover:border-white/20 transition-colors p-3">
              <Link href={`/products/${item.id}`} className="relative w-20 h-20 flex-shrink-0 overflow-hidden bg-foreground/5 border border-white/10">
                <Image src={item.image} alt={item.name} fill className="object-cover opacity-70" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <Link href={`/products/${item.id}`}>
                    <h3 className="text-xs tracking-wide text-foreground/80 hover:text-foreground transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                  </Link>
                  <button
                    onClick={() => { removeItem(item.id); toast.success("Item removed") }}
                    className="ml-2 text-foreground/20 hover:text-red-400/70 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-green-400 font-mono">{formatPrice(item.price)}</span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-[10px] text-foreground/40 line-through">{formatPrice(item.originalPrice)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-white/20">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-colors border-r border-white/15"
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <span className="w-6 text-center text-[9px]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-6 h-6 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-colors border-l border-white/15 disabled:opacity-20"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-foreground/60">{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary — desktop only (mobile gets sticky bottom bar) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="border border-white/10 p-5 space-y-4 sticky top-24">
            <p className="text-xs tracking-widest text-foreground/60 font-semibold">Order Summary</p>

            <div className="space-y-2.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-foreground/55">Subtotal ({items.length} {items.length === 1 ? "item" : "items"})</span>
                <span className="text-foreground/80">{formatPrice(cartTotal)}</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="text-xs tracking-widest text-foreground/60 font-semibold">Total</span>
              <span className="text-green-400 font-mono text-base font-semibold">{formatPrice(finalTotal)}</span>
            </div>

            <div className="space-y-1.5">
              <Link
                href="/checkout"
                className="block text-center py-2 text-[10px] tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-colors font-bold flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                href="/products"
                className="block text-center py-2 text-[10px] tracking-widest border border-white/20 text-foreground/50 hover:text-foreground hover:border-white/40 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="flex items-center justify-center gap-4 text-[8px] text-foreground/25 pt-1">
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-2.5 w-2.5" /> Secure checkout
              </div>
              <div className="flex items-center gap-1">
                <Truck className="h-2.5 w-2.5" /> Fast delivery
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-white/15 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[8px] tracking-widest text-foreground/30">Total</p>
            <p className="text-green-400/80 font-mono text-sm font-bold">{formatPrice(finalTotal)}</p>
          </div>
          <Link
            href="/checkout"
            className="flex-1 text-center py-2.5 text-[10px] tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-colors font-bold flex items-center justify-center gap-2"
          >
            Proceed to Checkout <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
