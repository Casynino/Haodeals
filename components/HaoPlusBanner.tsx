"use client"

import { Crown, Zap, Package2, Star } from "lucide-react"

type Variant = "product" | "checkout" | "cart"

const COPY: Record<Variant, string> = {
  product:  "HAO+ members unlock exclusive prices & priority shipping on every order.",
  checkout: "Subscribe to HAO+ and get FREE delivery on every order. Members always pay less.",
  cart:     "HAO+ members save more on every purchase. Join to unlock exclusive deals.",
}

const PERKS = [
  { Icon: Package2, label: "Free Delivery" },
  { Icon: Zap,      label: "Exclusive Prices" },
  { Icon: Star,     label: "Early Access" },
]

export function HaoPlusBanner({ variant = "product" }: { variant?: Variant }) {
  return (
    <div className="border border-yellow-400/18 bg-yellow-400/[0.025] px-4 py-3.5">
      <div className="flex items-start gap-3">
        {/* Crown icon */}
        <div className="w-9 h-9 border border-yellow-400/30 bg-yellow-400/[0.07] flex items-center justify-center shrink-0 mt-0.5">
          <Crown className="h-4 w-4 text-yellow-400/70" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold tracking-[0.15em] text-yellow-400/90 font-mono">HAO+</span>
            <span className="text-[8px] tracking-widest text-yellow-400/50 border border-yellow-400/25 px-1.5 py-0.5">
              COMING SOON
            </span>
          </div>
          <p className="text-[9px] text-foreground/50 leading-relaxed">{COPY[variant]}</p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {PERKS.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-1 text-[8px] text-foreground/35">
                <Icon className="h-2.5 w-2.5 text-yellow-400/45" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button className="shrink-0 mt-0.5 text-[8px] tracking-widest text-yellow-400/65 border border-yellow-400/25 px-2.5 py-1.5 hover:bg-yellow-400/[0.07] transition-colors whitespace-nowrap">
          NOTIFY ME
        </button>
      </div>
    </div>
  )
}
