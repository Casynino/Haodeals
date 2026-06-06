import Link from "next/link"
import { MapPin, Phone, Mail, Shield, Truck, RotateCcw, CreditCard } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative bg-background mt-auto font-mono overflow-hidden">

      {/* ── Top glow border ─────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm" />

      {/* ── Brand hero section ──────────────────────────────────────────── */}
      <div className="relative border-b border-white/6">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">

            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-base font-black tracking-[0.22em]">
                <span className="text-foreground/30">[</span>
                <span className="text-foreground">HAO</span>
                <span className="text-foreground/55">DEALS</span>
                <span className="text-foreground/30">]</span>
              </div>
              <p className="text-[11px] text-foreground/42 max-w-xs leading-relaxed">
                Tanzania&apos;s premium deals platform — up to 70% off, delivered fast.
              </p>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400/80" />
                </span>
                <span className="text-[9px] text-emerald-400/70 tracking-widest">Online &amp; delivering</span>
              </div>
            </div>

            {/* Contact pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: MapPin, text: "Mbezi Goigi, Dar es Salaam" },
                { icon: Phone,  text: "0788 734 003",              href: "tel:+255788734003" },
                { icon: Mail,   text: "haodealtz@gmail.com",        href: "mailto:haodealtz@gmail.com" },
              ].map(({ icon: Icon, text, href }) => {
                const cls = "flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/8 bg-white/[0.03] text-[9px] text-foreground/45 hover:text-foreground/70 hover:border-white/15 transition-all"
                const content = (
                  <>
                    <Icon className="h-2.5 w-2.5 text-foreground/25 flex-shrink-0" />
                    <span>{text}</span>
                  </>
                )
                return href
                  ? <a key={text} href={href} className={cls}>{content}</a>
                  : <div key={text} className={cls}>{content}</div>
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust strip ─────────────────────────────────────────────────── */}
      <div className="border-b border-white/6">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-4 sm:gap-2">
            {[
              { icon: Shield,     label: "Secure Checkout",   color: "text-emerald-400/65" },
              { icon: Truck,      label: "Nationwide Delivery",color: "text-blue-400/65"    },
              { icon: RotateCcw,  label: "72-Hour Returns",   color: "text-violet-400/65"  },
              { icon: CreditCard, label: "M-Pesa Accepted",   color: "text-amber-400/65"   },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className={`h-3 w-3 ${color}`} />
                <span className="text-[9px] text-foreground/40 tracking-wide">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Navigation columns ──────────────────────────────────────────── */}
      <div className="border-b border-white/6">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-8 max-w-lg">

            {/* Shop */}
            <div>
              <p className="text-[8px] tracking-[0.3em] text-foreground/30 uppercase mb-4">Shop</p>
              <ul className="space-y-2.5">
                {[
                  { label: "All Deals",   href: "/products" },
                  { label: "Tech Deals",  href: "/products?category=tech-deals" },
                  { label: "Fashion",     href: "/products?category=fashion" },
                  { label: "Accessories", href: "/products?category=accessories" },
                  { label: "Shoes",       href: "/products?category=shoes" },
                  { label: "Sports",      href: "/products?category=sports" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href}
                      className="group flex items-center gap-2 text-[11px] text-foreground/45 hover:text-foreground transition-all duration-150">
                      <span className="w-3 h-[1px] bg-foreground/15 group-hover:w-4 group-hover:bg-foreground/40 transition-all duration-200" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-[8px] tracking-[0.3em] text-foreground/30 uppercase mb-4">Quick Links</p>
              <ul className="space-y-2.5">
                {[
                  { label: "My Wallet",        href: "/wallet"   },
                  { label: "My Wishlist",      href: "/wishlist" },
                  { label: "Track Your Order", href: "/orders"   },
                  { label: "Returns Policy",   href: "/returns"  },
                  { label: "Shipping Policy",  href: "/shipping" },
                  { label: "Contact Us",       href: "/contact"  },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href}
                      className="group flex items-center gap-2 text-[11px] text-foreground/45 hover:text-foreground transition-all duration-150">
                      <span className="w-3 h-[1px] bg-foreground/15 group-hover:w-4 group-hover:bg-foreground/40 transition-all duration-200" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[9px] text-foreground/28 tracking-wide">
            © 2026 HaoDeals Tanzania — All rights reserved
          </p>
          <div className="flex items-center gap-2 text-[9px] text-foreground/30">
            <Link href="#"        className="hover:text-foreground/60 transition-colors">Privacy</Link>
            <span className="text-foreground/12">·</span>
            <Link href="/returns" className="hover:text-foreground/60 transition-colors">Returns</Link>
            <span className="text-foreground/12">·</span>
            <Link href="/shipping"className="hover:text-foreground/60 transition-colors">Shipping</Link>
            <span className="text-foreground/12">·</span>
            <Link href="/contact" className="hover:text-foreground/60 transition-colors">Contact</Link>
          </div>
        </div>
      </div>

    </footer>
  )
}
