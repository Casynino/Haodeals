"use client"

import { Crown, Zap, Package2, Star, Bell } from "lucide-react"

type Variant = "product" | "checkout" | "cart" | "home"

const COPY: Record<Variant, { headline: string; sub: string }> = {
  product:  { headline: "Members pay less on every order", sub: "Exclusive prices & priority delivery — coming soon to Hǎodeals." },
  checkout: { headline: "Free delivery on every order", sub: "Hǎodeals+ members always pay less. Coming soon." },
  cart:     { headline: "Save more on every purchase", sub: "Unlock member-only deals with Hǎodeals+. Coming soon." },
  home:     { headline: "Hǎodeals+ is coming — members pay less", sub: "Exclusive prices, free delivery and early access to every drop. Be first in line." },
}

const PERKS = [
  { Icon: Package2, label: "Free delivery" },
  { Icon: Zap,      label: "Exclusive prices" },
  { Icon: Star,     label: "Early access" },
]

const GOLD = "#e3b341"

export function HaoPlusBanner({ variant = "product" }: { variant?: Variant }) {
  const { headline, sub } = COPY[variant]
  const feature = variant === "home"

  return (
    <div
      className={`relative overflow-hidden rounded-3xl ${feature ? "p-6 md:p-9" : "p-5"}`}
      style={{ background: "linear-gradient(135deg, #241b0c 0%, #0b0a07 55%, #2c2110 100%)" }}
    >
      {/* Ambient gold glow + premium hairline */}
      <div className="absolute -top-24 -right-10 w-80 h-80 rounded-full pointer-events-none" style={{ background: `radial-gradient(closest-side, ${GOLD}44, transparent)` }} />
      <div className="absolute -bottom-28 left-8 w-72 h-72 rounded-full pointer-events-none" style={{ background: `radial-gradient(closest-side, ${GOLD}22, transparent)` }} />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}99, transparent)` }} />

      <div className={`relative flex flex-col gap-5 ${feature ? "md:flex-row md:items-center" : "sm:flex-row sm:items-center"}`}>
        {/* Copy */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${GOLD}24`, border: `1px solid ${GOLD}59` }}>
              <Crown className="h-5 w-5" style={{ color: GOLD }} />
            </div>
            <span className="text-xl font-black tracking-tight" style={{ color: GOLD }}>Hǎo<span className="text-white">+</span></span>
            <span className="text-[10px] font-bold tracking-[0.2em] rounded-full px-2.5 py-1" style={{ color: GOLD, border: `1px solid ${GOLD}66` }}>
              COMING SOON
            </span>
          </div>

          <h3 className={`font-bold tracking-tight text-white leading-tight ${feature ? "text-2xl md:text-3xl" : "text-lg"}`}>
            {headline}
          </h3>
          <p className={`text-white/65 mt-2 leading-relaxed ${feature ? "text-sm md:text-base max-w-lg" : "text-[13px]"}`}>
            {sub}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
            {PERKS.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[13px] text-white/80">
                <Icon className="h-4 w-4" style={{ color: GOLD }} /> {label}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <button
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-black text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all"
            style={{ background: GOLD, boxShadow: `0 14px 36px -12px ${GOLD}99` }}
          >
            <Bell className="h-4 w-4" /> Notify me
          </button>
        </div>
      </div>
    </div>
  )
}
