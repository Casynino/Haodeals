import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background mt-auto font-mono">
      {/* Top bar */}
      <div className="border-b border-white/5">
        <div className="container mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-1 text-sm font-bold tracking-[0.2em]">
              <span className="text-foreground/30">[</span>
              <span>HAO</span>
              <span className="text-foreground/60">DEALS</span>
              <span className="text-foreground/30">]</span>
            </div>
            <p className="text-[10px] text-foreground/40 leading-relaxed">
              The best deals delivered to your door. Up to 70% off. Fast delivery across Tanzania 🇹🇿
            </p>
            <div className="flex items-center gap-1.5 text-[9px] text-foreground/30">
              <div className="w-1.5 h-1.5 bg-green-400/60 rounded-full" />
              <span>Online &amp; delivering</span>
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="text-[9px] text-foreground/30 tracking-widest mb-3">Shop</p>
            <ul className="space-y-1.5">
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
                    className="text-[10px] text-foreground/50 hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <span className="text-foreground/20">&gt;</span> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="text-[9px] text-foreground/30 tracking-widest mb-3">Support</p>
            <ul className="space-y-1.5">
              {[
                { label: "Help Center", href: "#" },
                { label: "Track Your Order", href: "#" },
                { label: "Returns", href: "#" },
                { label: "Shipping Policy", href: "#" },
                { label: "Contact Us", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-[10px] text-foreground/50 hover:text-foreground transition-colors flex items-center gap-1">
                    <span className="text-foreground/20">&gt;</span> {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <p className="text-[9px] text-foreground/30 tracking-widest mb-3">Info</p>
            <div className="space-y-1.5 text-[10px] text-foreground/40 font-mono">
              <div className="flex justify-between">
                <span>Status</span>
                <span className="text-green-400/70">Online</span>
              </div>
              <div className="flex justify-between">
                <span>Uptime</span>
                <span className="text-foreground/60">99.9%</span>
              </div>
              <div className="flex justify-between">
                <span>Products</span>
                <span className="text-foreground/60">20+</span>
              </div>
              <div className="flex justify-between">
                <span>Checkout</span>
                <span className="text-green-400/70">Secure</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="text-foreground/60">Nationwide</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[9px] text-foreground/30">
          <span>© 2025 HaoDeals</span>
          <span className="text-foreground/15">|</span>
          <span>All rights reserved</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-foreground/30">
          <a href="#" className="hover:text-foreground/60 transition-colors">Privacy Policy</a>
          <span className="text-foreground/15">|</span>
          <a href="#" className="hover:text-foreground/60 transition-colors">Terms of Service</a>
          <span className="text-foreground/15">|</span>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-green-400/60 rounded-full animate-pulse" />
            <span>Live</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
