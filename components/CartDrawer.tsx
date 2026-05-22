"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useCart } from "@/hooks/useCart"
import Image from "next/image"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"

export function CartDrawer() {
  const { items, removeItem, updateQuantity, total, count } = useCart()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const itemCount = mounted ? count() : 0
  const cartTotal = mounted ? total() : 0

  return (
    <Sheet>
      <SheetTrigger className="relative w-8 h-8 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-colors border border-transparent hover:border-white/10">
        <ShoppingCart className="h-3.5 w-3.5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-foreground text-background text-[8px] font-mono font-bold">
            {itemCount}
          </span>
        )}
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-sm flex flex-col bg-background border-l border-white/10 font-mono p-0">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-white/10">
          <SheetTitle className="text-[10px] tracking-widest text-foreground/60 flex items-center gap-2 font-mono">
            <span className="text-foreground/30">//</span>
            CART.CONTENTS
            <span className="ml-auto text-foreground/40">[{itemCount}]</span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-foreground/30 p-8">
            <div className="border border-white/10 p-6">
              <ShoppingCart className="h-8 w-8 opacity-30" />
            </div>
            <div className="text-center">
              <p className="text-[10px] tracking-widest mb-1">CART.EMPTY</p>
              <p className="text-[9px] text-foreground/20">NO ITEMS QUEUED</p>
            </div>
            <Link
              href="/products"
              className="px-4 py-1.5 text-[10px] tracking-widest border border-white/20 text-foreground/60 hover:text-foreground hover:border-white/40 transition-colors"
            >
              BROWSE.DEALS
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 p-4">
                  <div className="relative w-16 h-16 bg-foreground/5 border border-white/10 overflow-hidden flex-shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover opacity-80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-foreground/70 truncate uppercase tracking-wide">{item.name}</p>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.selectedOptions.map((opt) => (
                          <span key={opt.name} className="text-[7px] tracking-widest text-foreground/40 border border-white/10 px-1 py-0.5">
                            {opt.name.toUpperCase()}: {opt.value}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-green-400/80 font-mono">{formatPrice(item.price)}</span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-[9px] text-foreground/30 line-through">{formatPrice(item.originalPrice)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        className="w-5 h-5 border border-white/20 flex items-center justify-center text-foreground/50 hover:text-foreground hover:border-white/40 transition-colors"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <span className="text-[10px] w-5 text-center">{item.quantity}</span>
                      <button
                        className="w-5 h-5 border border-white/20 flex items-center justify-center text-foreground/50 hover:text-foreground hover:border-white/40 transition-colors disabled:opacity-20"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                      <button
                        className="ml-auto w-5 h-5 flex items-center justify-center text-foreground/30 hover:text-red-400/70 transition-colors"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 p-4 space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-foreground/40 tracking-widest">TOTAL.AMOUNT</span>
                <span className="text-green-400/80 font-mono">{formatPrice(cartTotal)}</span>
              </div>
              <div className="grid gap-1.5">
                <Link
                  href="/cart"
                  className="block text-center py-1.5 text-[10px] tracking-widest border border-white/20 text-foreground/60 hover:text-foreground hover:border-white/40 transition-colors"
                >
                  VIEW.CART
                </Link>
                <Link
                  href="/checkout"
                  className="block text-center py-1.5 text-[10px] tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-colors font-bold"
                >
                  EXECUTE.CHECKOUT
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
