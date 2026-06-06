import Link from "next/link"
import { Shield, Truck, RotateCcw, CreditCard, MapPin, Phone, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/12 bg-background mt-auto font-mono">

      {/* ── Trust bar ───────────────────────────────────────────────────── */}
      <div className="border-b border-white/6 bg-white/[0.015]">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Shield,    label: "Secure Checkout",      sub: "Encrypted payments",  color: "text-emerald-400/70" },
              { icon: Truck,     label: "Nationwide Delivery",   sub: "Across Tanzania",     color: "text-blue-400/70"    },
              { icon: RotateCcw, label: "72-Hour Returns",       sub: "Hassle-free policy",  color: "text-violet-400/70"  },
              { icon: CreditCard,label: "M-Pesa Accepted",       sub: "Fast mobile payments",color: "text-amber-400/70"   },
            ].map(({ icon: Icon, label, sub, color }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg border border-white/8 flex items-center justify-center flex-shrink-0 bg-white/[0.03]`}>
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold text-foreground/65 tracking-wide truncate">{label}</p>
                  <p className="text-[8px] text-foreground/30 truncate">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main footer ─────────────────────────────────────────────────── */}
      <div className="border-b border-white/8">
        <div className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-1 text-sm font-bold tracking-[0.2em]">
              <span className="text-foreground/35">[</span>
              <span>HAO</span>
              <span className="text-foreground/65">DEALS</span>
              <span className="text-foreground/35">]</span>
            </div>
            <p className="text-[11px] text-foreground/50 leading-relaxed">
              Tanzania&apos;s premium deals platform. Up to 70% off on electronics, fashion, accessories &amp; more.
            </p>
            <div className="flex items-center gap-1.5 text-[9px] text-foreground/40">
              <div className="w-1.5 h-1.5 bg-green-400/70 rounded-full animate-pulse" />
              <span>Online &amp; delivering</span>
            </div>
            {/* Contact quick-info */}
            <div className="space-y-1.5 pt-1">
              {[
                { icon: MapPin, text: "Mbezi Goigi, Dar es Salaam" },
                { icon: Phone,  text: "0788 734 003" },
                { icon: Mail,   text: "haodealtz@gmail.com" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-[9px] text-foreground/35">
                  <Icon className="h-2.5 w-2.5 flex-shrink-0 text-foreground/22" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="text-[9px] text-foreground/45 tracking-widest mb-3 uppercase font-semibold">Shop</p>
            <ul className="space-y-2">
              {[
                { label: "All Deals",   href: "/products" },
                { label: "Tech Deals",  href: "/products?category=tech-deals" },
                { label: "Fashion",     href: "/products?category=fashion" },
                { label: "Accessories", href: "/products?category=accessories" },
                { label: "Shoes",       href: "/products?category=shoes" },
                { label: "Sports",      href: "/products?category=sports" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-[11px] text-foreground/50 hover:text-foreground transition-colors flex items-center gap-1.5">
                    <span className="text-foreground/20">&gt;</span> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-[9px] text-foreground/45 tracking-widest mb-3 uppercase font-semibold">Support</p>
            <ul className="space-y-2">
              {[
                { label: "Contact Us",      href: "/contact" },
                { label: "Track Your Order", href: "/orders" },
                { label: "Returns Policy",  href: "/returns" },
                { label: "Shipping Policy", href: "/shipping" },
                { label: "My Wishlist",     href: "/wishlist" },
                { label: "My Wallet",       href: "/wallet" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-[11px] text-foreground/50 hover:text-foreground transition-colors flex items-center gap-1.5">
                    <span className="text-foreground/20">&gt;</span> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Why HaoDeals */}
          <div>
            <p className="text-[9px] text-foreground/45 tracking-widest mb-3 uppercase font-semibold">Why HaoDeals</p>
            <div className="space-y-2.5">
              {[
                { emoji: "🏷️", text: "Up to 70% off retail prices" },
                { emoji: "⚡", text: "Buy Now — pay directly from wallet" },
                { emoji: "🚚", text: "Weekend free delivery (Dar es Salaam)" },
                { emoji: "🔄", text: "72-hour return window" },
                { emoji: "🔐", text: "Secured by nTZS blockchain" },
                { emoji: "📱", text: "M-Pesa top-up in seconds" },
              ].map(({ emoji, text }) => (
                <div key={text} className="flex items-start gap-2">
                  <span className="text-sm leading-none mt-0.5 flex-shrink-0">{emoji}</span>
                  <span className="text-[10px] text-foreground/45 leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[9px] text-foreground/38">
          <span>© 2025 HaoDeals Tanzania</span>
          <span className="text-foreground/15">|</span>
          <span>All rights reserved</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-foreground/38">
          <Link href="#" className="hover:text-foreground/65 transition-colors">Privacy Policy</Link>
          <span className="text-foreground/15">|</span>
          <Link href="/returns" className="hover:text-foreground/65 transition-colors">Return Policy</Link>
          <span className="text-foreground/15">|</span>
          <Link href="/shipping" className="hover:text-foreground/65 transition-colors">Shipping</Link>
          <span className="text-foreground/15">|</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-400/70 rounded-full animate-pulse" />
            <span>Live</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
