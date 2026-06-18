"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/hooks/useCart"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatPrice } from "@/lib/utils"

export function CartDrawer() {
  const { items, removeItem, updateQuantity, total, count } = useCart()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  useEffect(() => setMounted(true), [])

  const itemCount = mounted ? count() : 0
  const cartTotal = mounted ? total() : 0
  const finalTotal = cartTotal

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="relative w-8 h-8 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-colors border border-transparent hover:border-white/10">
        <ShoppingCart className="h-3.5 w-3.5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-foreground text-background text-[10px] font-mono font-bold">
            {itemCount}
          </span>
        )}
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-sm flex flex-col bg-background border-l border-white/10 font-mono p-0">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-white/10">
          <SheetTitle className="text-[12px] tracking-widest text-foreground/60 flex items-center gap-2 font-mono">
            <span className="text-foreground/30">//</span>
            BAG.CONTENTS
            <span className="ml-auto text-foreground/40">[{itemCount}]</span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-foreground/30 p-8">
            <div className="border border-white/10 p-6">
              <ShoppingCart className="h-8 w-8 opacity-30" />
            </div>
            <div className="text-center">
              <p className="text-[12px] tracking-widest mb-1">BAG.EMPTY</p>
              <p className="text-[11px] text-foreground/20">NO ITEMS IN BAG</p>
            </div>
            <Link
              href="/products"
              className="px-4 py-1.5 text-[12px] tracking-widest border border-white/20 text-foreground/60 hover:text-foreground hover:border-white/40 transition-colors"
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
                    <p className="text-[12px] text-foreground/70 truncate uppercase tracking-wide">{item.name}</p>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.selectedOptions.map((opt) => (
                          <span key={opt.name} className="text-[10px] tracking-widest text-foreground/40 border border-white/10 px-1 py-0.5">
                            {opt.name.toUpperCase()}: {opt.value}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-green-400/80 font-mono">{formatPrice(item.price)}</span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-[11px] text-foreground/30 line-through">{formatPrice(item.originalPrice)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        className="w-5 h-5 border border-white/20 flex items-center justify-center text-foreground/50 hover:text-foreground hover:border-white/40 transition-colors"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <span className="text-[12px] w-5 text-center">{item.quantity}</span>
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
              <div className="flex justify-between items-center text-[12px]">
                <span className="tracking-widest text-foreground/40">TOTAL</span>
                <span className="font-mono text-green-400/80 text-[13px]">{formatPrice(finalTotal)}</span>
              </div>
              <button
                onClick={() => { setOpen(false); router.push("/checkout") }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background text-[12px] tracking-widest font-bold hover:bg-foreground/90 transition-colors"
              >
                CHECKOUT <ArrowRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => { setOpen(false); router.push("/cart") }}
                className="w-full text-center py-1.5 text-[11px] tracking-widest text-foreground/30 hover:text-foreground transition-colors"
              >
                VIEW.FULL.BAG
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
