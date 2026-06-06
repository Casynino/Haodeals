import Link from "next/link"
import {
  Truck, MapPin, Clock, Tag, Gift, Package, CheckCircle2,
  ArrowRight, AlertTriangle, CreditCard, Calendar, Zap,
} from "lucide-react"

export const metadata = { title: "Shipping Policy — HaoDeals" }

export default function ShippingPage() {
  return (
    <div className="min-h-screen font-mono bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/15 via-background to-background pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-blue-400/70 rounded-full" />
              <span className="text-[9px] tracking-[0.3em] text-blue-400/60 uppercase">Delivery Information</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground/90 mb-4">
              Shipping &amp; Delivery Policy
            </h1>
            <p className="text-sm text-foreground/50 leading-relaxed max-w-lg">
              We deliver nationwide across Tanzania. Here&apos;s everything you need to know about our shipping options, fees, and free delivery opportunities.
            </p>
            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Truck className="h-3 w-3 text-blue-400" />
                <span className="text-[9px] text-blue-400/80">Nationwide Delivery</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Tag className="h-3 w-3 text-emerald-400" />
                <span className="text-[9px] text-emerald-400/80">Free Delivery Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Delivery options ─────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-12">
        <p className="text-[9px] tracking-[0.3em] text-foreground/28 uppercase mb-6">Delivery Options</p>
        <div className="grid sm:grid-cols-3 gap-4 mb-14">
          {[
            {
              icon: CreditCard, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
              title: "Standard Delivery",
              badge: "Customer Pays",
              badgeCls: "bg-blue-500/15 text-blue-400",
              desc: "Available for all orders. Shipping and delivery fees are the customer's responsibility and will be displayed clearly during checkout.",
              detail: "Fees shown at checkout",
            },
            {
              icon: Calendar, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",
              title: "Weekend Free Delivery",
              badge: "Free",
              badgeCls: "bg-emerald-500/15 text-emerald-400",
              desc: "Free delivery is available every Saturday and Sunday for customers in Dar es Salaam. Weekend delivery is automatically applied at checkout.",
              detail: "Saturdays & Sundays only",
            },
            {
              icon: Gift, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",
              title: "Promotional Free Delivery",
              badge: "Free (Limited)",
              badgeCls: "bg-violet-500/15 text-violet-400",
              desc: "Free delivery is also offered during special campaigns, promotions, or for qualifying large purchases. Watch for announcements on the website.",
              detail: "Announced during campaigns",
            },
          ].map(({ icon: Icon, color, bg, title, badge, badgeCls, desc, detail }) => (
            <div key={title} className={`rounded-2xl border p-5 space-y-3 ${bg}`}>
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-xl border ${bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>{badge}</span>
              </div>
              <h3 className="text-[11px] font-bold text-foreground/80">{title}</h3>
              <p className="text-[10px] text-foreground/45 leading-relaxed">{desc}</p>
              <div className="flex items-center gap-1.5 text-[8px] text-foreground/30 border-t border-white/6 pt-2.5">
                <Clock className="h-2.5 w-2.5" />
                {detail}
              </div>
            </div>
          ))}
        </div>

        {/* ── Delivery process timeline ── */}
        <div className="max-w-3xl mx-auto mb-14">
          <div className="text-center mb-8">
            <p className="text-[9px] tracking-[0.3em] text-foreground/28 uppercase mb-2">Order Journey</p>
            <h2 className="text-xl font-bold text-foreground/80">How Delivery Works</h2>
          </div>

          <div className="grid sm:grid-cols-5 gap-3">
            {[
              { icon: CreditCard, label: "Payment",    desc: "Pay from your wallet",         color: "text-violet-400", bg: "bg-violet-500/12" },
              { icon: CheckCircle2, label: "Confirmed", desc: "Order confirmed instantly",    color: "text-blue-400",   bg: "bg-blue-500/12"   },
              { icon: Package,    label: "Packaging",  desc: "We pack your order",           color: "text-amber-400",  bg: "bg-amber-500/12"  },
              { icon: Truck,      label: "In Transit", desc: "Out for delivery",             color: "text-blue-400",   bg: "bg-blue-500/12"   },
              { icon: Zap,        label: "Delivered",  desc: "Arrived at your door",         color: "text-emerald-400",bg: "bg-emerald-500/12"},
            ].map(({ icon: Icon, label, desc, color, bg }, i, arr) => (
              <div key={label} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                <div className={`w-10 h-10 rounded-full ${bg} border border-white/8 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden sm:block w-full h-[2px] bg-white/6 absolute" />
                )}
                <div className="sm:mt-1">
                  <p className="text-[9px] font-bold text-foreground/70">{label}</p>
                  <p className="text-[8px] text-foreground/35 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* connector line (desktop only) */}
          <div className="hidden sm:block -mt-[46px] mb-8 mx-5">
            <div className="h-[2px] bg-white/6 rounded-full" />
          </div>
        </div>

        {/* ── Key facts ── */}
        <div className="max-w-3xl mx-auto mb-12">
          <p className="text-[9px] tracking-[0.3em] text-foreground/28 uppercase mb-5">Key Facts</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: MapPin,    color: "text-amber-400",  text: "We deliver to all regions across Tanzania, not just Dar es Salaam." },
              { icon: Clock,     color: "text-blue-400",   text: "Standard delivery typically takes 1–3 business days within Dar es Salaam." },
              { icon: CreditCard,color: "text-violet-400", text: "All shipping fees are shown clearly at checkout before you pay — no surprises." },
              { icon: Calendar,  color: "text-emerald-400",text: "Weekend free delivery applies automatically every Saturday and Sunday." },
              { icon: Truck,     color: "text-blue-400",   text: "Upcountry orders may take 3–7 business days depending on your region." },
              { icon: Tag,       color: "text-emerald-400",text: "Large or bulk orders may qualify for free delivery. Details shown at checkout." },
            ].map(({ icon: Icon, color, text }) => (
              <div key={text} className="flex items-start gap-3 p-3.5 rounded-xl border border-white/7 bg-white/[0.02]">
                <Icon className={`h-3.5 w-3.5 ${color} flex-shrink-0 mt-0.5`} />
                <p className="text-[10px] text-foreground/52 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Important notices ── */}
        <div className="max-w-3xl mx-auto space-y-3 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400/60" />
            <p className="text-[9px] tracking-[0.3em] text-foreground/28 uppercase">Important Notices</p>
          </div>
          {[
            { type: "warning", text: "HaoDeals generally does not offer free standard delivery. Shipping costs must be paid by the customer unless a promotional free delivery is active." },
            { type: "info",    text: "Weekend free delivery is available only in Dar es Salaam. Customers in other regions pay standard shipping rates on weekends." },
            { type: "warning", text: "Delivery times are estimates and may vary due to location, weather, or high-demand periods. We do not guarantee specific delivery times." },
            { type: "info",    text: "For express or same-day delivery within Dar es Salaam, select Express Delivery at checkout and arrange transport with your preferred provider." },
          ].map(({ type, text }, i) => {
            const styles = {
              warning: "border-amber-500/20 bg-amber-500/[0.04] text-amber-400",
              info:    "border-blue-500/20 bg-blue-500/[0.04] text-blue-400",
            }
            const icons = { warning: AlertTriangle, info: CheckCircle2 }
            const Icon = icons[type as keyof typeof icons]
            return (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${styles[type as keyof typeof styles]}`}>
                <Icon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-foreground/62">{text}</p>
              </div>
            )
          })}
        </div>

        {/* ── CTA ── */}
        <div className="max-w-3xl mx-auto rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground/78">Questions about your delivery?</p>
            <p className="text-[10px] text-foreground/40 mt-0.5">Track your order in real-time or contact our support team.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link href="/orders" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-foreground/55 text-[10px] font-mono hover:text-foreground hover:border-white/30 transition-all">
              Track Order
            </Link>
            <Link href="/contact" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold tracking-widest transition-all active:scale-95">
              Contact Us <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
