import Link from "next/link"
import { MapPin, Phone, Mail } from "lucide-react"

/* ── Instagram SVG icon ──────────────────────────────────────────────────── */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="relative bg-background mt-auto font-mono overflow-hidden">

      {/* ── Top glow border ─────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm" />

      {/* ── Brand + Contact section ──────────────────────────────────────── */}
      <div className="relative border-b border-white/6">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">

            {/* Brand */}
            <div className="space-y-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 text-base font-black tracking-[0.22em]">
                <span className="text-foreground/30">[</span>
                <span className="text-foreground">HAO</span>
                <span className="text-foreground/55">DEALS</span>
                <span className="text-foreground/30">]</span>
              </div>
              <p className="text-[11px] text-foreground/40 max-w-[200px] leading-relaxed">
                Tanzania&apos;s premium deals platform.
              </p>
            </div>

            {/* Contact cards + Instagram */}
            <div className="flex flex-col gap-4 lg:items-end">

              {/* Contact grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    icon: MapPin, label: "Location",
                    text: "Mbezi Goigi, Dar es Salaam",
                    href: undefined,
                    iconCls: "text-amber-400/70",
                    cardCls: "border-white/8 bg-white/[0.025]",
                  },
                  {
                    icon: Phone, label: "Phone",
                    text: "0788 734 003",
                    href: "tel:+255788734003",
                    iconCls: "text-emerald-400/70",
                    cardCls: "border-white/8 bg-white/[0.025] hover:border-emerald-500/25",
                  },
                  {
                    icon: Mail, label: "Email",
                    text: "haodealtz@gmail.com",
                    href: "mailto:haodealtz@gmail.com",
                    iconCls: "text-blue-400/70",
                    cardCls: "border-white/8 bg-white/[0.025] hover:border-blue-500/25",
                  },
                ].map(({ icon: Icon, label, text, href, iconCls, cardCls }) => {
                  const inner = (
                    <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-200 ${cardCls}`}>
                      <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/6 flex items-center justify-center flex-shrink-0">
                        <Icon className={`h-3 w-3 ${iconCls}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[7px] text-foreground/25 tracking-[0.2em] uppercase mb-0.5">{label}</p>
                        <p className="text-[10px] text-foreground/60 truncate">{text}</p>
                      </div>
                    </div>
                  )
                  return href
                    ? <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{inner}</a>
                    : <div key={label}>{inner}</div>
                })}
              </div>

              {/* Instagram button */}
              <a
                href="https://www.instagram.com/haodeals"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/10
                  bg-gradient-to-r from-[#833ab4]/15 via-[#fd1d1d]/12 to-[#fcb045]/10
                  hover:from-[#833ab4]/28 hover:via-[#fd1d1d]/22 hover:to-[#fcb045]/18
                  hover:border-[#fd1d1d]/30 transition-all duration-200 active:scale-[0.98] self-start lg:self-end"
              >
                <InstagramIcon className="h-3.5 w-3.5 text-foreground/55 group-hover:text-white/80 transition-colors flex-shrink-0" />
                <div>
                  <p className="text-[9px] font-semibold text-foreground/65 group-hover:text-foreground/85 transition-colors leading-none">
                    Follow us on Instagram
                  </p>
                  <p className="text-[7px] text-foreground/28 mt-0.5">@haodeals</p>
                </div>
                <svg className="h-2.5 w-2.5 text-foreground/20 group-hover:text-foreground/45 ml-1 transition-all group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation columns ──────────────────────────────────────────── */}
      <div className="border-b border-white/6">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 gap-8 max-w-lg">

            {/* Shop */}
            <div>
              <p className="text-[8px] tracking-[0.3em] text-foreground/28 uppercase mb-4">Shop</p>
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
                      className="group flex items-center gap-2 text-[11px] text-foreground/42 hover:text-foreground transition-all duration-150">
                      <span className="w-3 h-[1px] bg-foreground/12 group-hover:w-4 group-hover:bg-foreground/38 transition-all duration-200" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-[8px] tracking-[0.3em] text-foreground/28 uppercase mb-4">Quick Links</p>
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
                      className="group flex items-center gap-2 text-[11px] text-foreground/42 hover:text-foreground transition-all duration-150">
                      <span className="w-3 h-[1px] bg-foreground/12 group-hover:w-4 group-hover:bg-foreground/38 transition-all duration-200" />
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
          <p className="text-[9px] text-foreground/25 tracking-wide">
            © 2026 HaoDeals Tanzania — All rights reserved
          </p>
          <div className="flex items-center gap-2 text-[9px] text-foreground/28">
            <Link href="#"         className="hover:text-foreground/55 transition-colors">Privacy</Link>
            <span className="text-foreground/10">·</span>
            <Link href="/returns"  className="hover:text-foreground/55 transition-colors">Returns</Link>
            <span className="text-foreground/10">·</span>
            <Link href="/shipping" className="hover:text-foreground/55 transition-colors">Shipping</Link>
            <span className="text-foreground/10">·</span>
            <Link href="/contact"  className="hover:text-foreground/55 transition-colors">Contact</Link>
          </div>
        </div>
      </div>

    </footer>
  )
}
