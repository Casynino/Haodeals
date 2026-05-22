"use client"

import { useCart } from "@/hooks/useCart"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, ShieldCheck, Truck } from "lucide-react"
import { toast } from "sonner"

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const cartTotal = total()
  const shipping = cartTotal >= 50 ? 0 : 9.99
  const finalTotal = cartTotal + shipping

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-6 text-center font-mono">
        <div className="border border-white/10 p-8">
          <ShoppingCart className="h-12 w-12 opacity-20" />
        </div>
        <p className="text-[11px] tracking-widest text-foreground/40">CART.EMPTY</p>
        <p className="text-[9px] text-foreground/20">NO.ITEMS.QUEUED</p>
        <Link href="/products" className="px-6 py-2 text-[10px] tracking-widest border border-white/20 text-foreground/60 hover:text-foreground hover:border-white/40 transition-colors flex items-center gap-2">
          BROWSE.DEALS <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/30 text-[10px]">//</span>
          <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">CART.CONTENTS</h1>
          <span className="text-[9px] text-foreground/30">[{items.length}.ITEMS]</span>
        </div>
        <button
          onClick={() => { clearCart(); toast.success("CART.CLEARED") }}
          className="text-[9px] tracking-widest text-foreground/30 hover:text-red-400/70 transition-colors"
        >
          CLEAR.ALL
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
                    <h3 className="text-[10px] tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                  </Link>
                  <button
                    onClick={() => { removeItem(item.id); toast.success("ITEM.REMOVED") }}
                    className="ml-2 text-foreground/20 hover:text-red-400/70 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-green-400/80">${item.price.toFixed(2)}</span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-[8px] text-foreground/25 line-through">${item.originalPrice.toFixed(2)}</span>
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
                  <span className="text-[10px] text-foreground/60">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary — desktop only (mobile gets sticky bottom bar) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="border border-white/10 p-5 space-y-4 sticky top-24">
            <p className="text-[9px] tracking-widest text-foreground/40">// ORDER.SUMMARY</p>

            <div className="space-y-2.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-foreground/40 tracking-widest">SUBTOTAL [{items.length}]</span>
                <span className="text-foreground/70">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/40 tracking-widest">SHIPPING</span>
                {shipping === 0 ? (
                  <span className="text-green-400/70 tracking-widest">FREE</span>
                ) : (
                  <span className="text-foreground/70">${shipping.toFixed(2)}</span>
                )}
              </div>
              {cartTotal < 50 && (
                <p className="text-[8px] tracking-wide text-foreground/30 border border-white/10 px-2 py-1.5">
                  ADD ${(50 - cartTotal).toFixed(2)} MORE FOR FREE.SHIPPING
                </p>
              )}
            </div>

            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="text-[9px] tracking-widest text-foreground/40">TOTAL.AMOUNT</span>
              <span className="text-green-400/80 font-mono">${finalTotal.toFixed(2)}</span>
            </div>

            <div className="space-y-1.5">
              <Link
                href="/checkout"
                className="block text-center py-2 text-[10px] tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-colors font-bold flex items-center justify-center gap-2"
              >
                EXECUTE.CHECKOUT <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                href="/products"
                className="block text-center py-2 text-[10px] tracking-widest border border-white/20 text-foreground/50 hover:text-foreground hover:border-white/40 transition-colors"
              >
                CONTINUE.SHOPPING
              </Link>
            </div>

            <div className="flex items-center justify-center gap-4 text-[8px] text-foreground/25 pt-1">
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-2.5 w-2.5" /> AES-256.SECURE
              </div>
              <div className="flex items-center gap-1">
                <Truck className="h-2.5 w-2.5" /> FAST.DELIVERY
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-white/15 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[8px] tracking-widest text-foreground/30">TOTAL.AMOUNT</p>
            <p className="text-green-400/80 font-mono text-sm font-bold">${finalTotal.toFixed(2)}</p>
          </div>
          <Link
            href="/checkout"
            className="flex-1 text-center py-2.5 text-[10px] tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-colors font-bold flex items-center justify-center gap-2"
          >
            EXECUTE.CHECKOUT <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
