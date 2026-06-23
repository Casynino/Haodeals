"use client"

import { Crown, Bell } from "lucide-react"

type Variant = "product" | "checkout" | "cart" | "home"

const COPY: Record<Variant, string> = {
  product:  "Members pay less — exclusive prices & priority delivery.",
  checkout: "Members get free delivery on every order.",
  cart:     "Members save more on every order.",
  home:     "Exclusive prices, free delivery & early access to every drop.",
}

/** Compact, premium "featured service" card — blends into the page, never dominates. */
export function HaoPlusBanner({ variant = "product" }: { variant?: Variant }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl glass px-4 py-3 hover:border-gold/30 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-gold-soft flex items-center justify-center flex-shrink-0">
        <Crown className="h-4 w-4 text-gold" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-foreground">Hǎo<span className="text-gold">+</span></span>
          <span className="text-[9px] font-semibold tracking-wide uppercase text-gold bg-gold-soft rounded-full px-1.5 py-0.5">
            Coming soon
          </span>
        </div>
        <p className="text-[12px] text-foreground/50 truncate mt-0.5">{COPY[variant]}</p>
      </div>

      <button className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gold text-black text-[12px] font-semibold hover:brightness-110 active:scale-[0.98] transition-all">
        <Bell className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Notify me</span>
      </button>
    </div>
  )
}
