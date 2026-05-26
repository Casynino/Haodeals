import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-white/12 bg-background mt-auto font-mono">
      {/* Top bar */}
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
            <p className="text-xs text-foreground/55 leading-relaxed">
              The best deals delivered to your door. Up to 70% off. Fast delivery across Tanzania 🇹🇿
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/45">
              <div className="w-1.5 h-1.5 bg-green-400/70 rounded-full" />
              <span>Online &amp; delivering</span>
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="text-xs text-foreground/50 tracking-widest mb-3 font-semibold">Shop</p>
            <ul className="space-y-2">
              {[
                { label: "All Deals", slug: "" },
                { label: "Tech Deals", slug: "tech-deals" },
                { label: "Fashion", slug: "fashion" },
                { label: "Accessories", slug: "accessories" },
                { label: "Shoes", slug: "shoes" },
                { label: "Sports", slug: "sports" },
              ].map(({ label, slug }) => (
                <li key={label}>
                  <Link
                    href={slug ? `/products?category=${slug}` : "/products"}
                    className="text-xs text-foreground/55 hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-foreground/25">&gt;</span> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-xs text-foreground/50 tracking-widest mb-3 font-semibold">Support</p>
            <ul className="space-y-2">
              {[
                { label: "Help Center", href: "#" },
                { label: "Track Your Order", href: "#" },
                { label: "Returns", href: "#" },
                { label: "Shipping Policy", href: "#" },
                { label: "Contact Us", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-xs text-foreground/55 hover:text-foreground transition-colors flex items-center gap-1.5">
                    <span className="text-foreground/25">&gt;</span> {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <p className="text-xs text-foreground/50 tracking-widest mb-3 font-semibold">Status</p>
            <div className="space-y-2 text-xs text-foreground/55">
              <div className="flex justify-between">
                <span className="text-foreground/45">Status</span>
                <span className="text-green-400/80">Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/45">Uptime</span>
                <span>99.9%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/45">Products</span>
                <span>20+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/45">Checkout</span>
                <span className="text-green-400/80">Secure</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/45">Delivery</span>
                <span>Nationwide</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="container mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[10px] text-foreground/45">
          <span>© 2025 HaoDeals</span>
          <span className="text-foreground/20">|</span>
          <span>All rights reserved</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-foreground/45">
          <a href="#" className="hover:text-foreground/70 transition-colors">Privacy Policy</a>
          <span className="text-foreground/20">|</span>
          <a href="#" className="hover:text-foreground/70 transition-colors">Terms of Service</a>
          <span className="text-foreground/20">|</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-400/70 rounded-full animate-pulse" />
            <span>Live</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
