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
              TERMINAL-GRADE DEALS ON TOP PRODUCTS. NO NOISE. JUST SAVINGS.
            </p>
            <div className="flex items-center gap-1.5 text-[9px] text-foreground/30">
              <div className="w-1.5 h-1.5 bg-green-400/60 rounded-full" />
              <span>SYSTEM.OPERATIONAL</span>
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="text-[9px] text-foreground/30 tracking-widest mb-3">// SHOP</p>
            <ul className="space-y-1.5">
              {[
                { label: "ALL.DEALS", slug: "" },
                { label: "TECH DEALS", slug: "tech-deals" },
                { label: "FASHION", slug: "fashion" },
                { label: "ACCESSORIES", slug: "accessories" },
                { label: "SHOES", slug: "shoes" },
                { label: "SPORTS", slug: "sports" },
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
            <p className="text-[9px] text-foreground/30 tracking-widest mb-3">// SUPPORT</p>
            <ul className="space-y-1.5">
              {["HELP.CENTER", "TRACK.ORDER", "RETURNS", "SHIPPING.POLICY", "CONTACT"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-[10px] text-foreground/50 hover:text-foreground transition-colors flex items-center gap-1">
                    <span className="text-foreground/20">&gt;</span> {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* System */}
          <div>
            <p className="text-[9px] text-foreground/30 tracking-widest mb-3">// SYSTEM</p>
            <div className="space-y-1.5 text-[10px] text-foreground/40 font-mono">
              <div className="flex justify-between">
                <span>VERSION</span>
                <span className="text-foreground/60">v2.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>STATUS</span>
                <span className="text-green-400/70">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>UPTIME</span>
                <span className="text-foreground/60">99.9%</span>
              </div>
              <div className="flex justify-between">
                <span>PRODUCTS</span>
                <span className="text-foreground/60">20+</span>
              </div>
              <div className="flex justify-between">
                <span>ENCRYPTION</span>
                <span className="text-green-400/70">AES-256</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[9px] text-foreground/30">
          <span>© 2024 HAODEALS.SYS</span>
          <span className="text-foreground/15">|</span>
          <span>ALL.RIGHTS.RESERVED</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-foreground/30">
          <span>PRIVACY.POLICY</span>
          <span className="text-foreground/15">|</span>
          <span>TERMS.OF.SERVICE</span>
          <span className="text-foreground/15">|</span>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-green-400/60 rounded-full animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
