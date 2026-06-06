import Link from "next/link"
import {
  Truck, MapPin, Clock, Tag, Gift, Package, CheckCircle2,
  ArrowRight, AlertTriangle, CreditCard, Calendar, Zap,
  Phone, Bike, Wind, Bus, Info, Globe2, Shield,
} from "lucide-react"

export const metadata = { title: "Shipping & Delivery Policy — HaoDeals" }

export default function ShippingPage() {
  return (
    <div className="min-h-screen font-mono bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/15 via-background to-background pointer-events-none" />
        <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1.5 h-1.5 bg-blue-400/70 rounded-full animate-pulse" />
              <span className="text-[9px] tracking-[0.3em] text-blue-400/60 uppercase">Delivery Information</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground/92 mb-4 leading-tight">
              Shipping &amp; Delivery<br className="hidden sm:block" /> Policy
            </h1>
            <p className="text-sm text-foreground/50 leading-relaxed max-w-lg">
              HaoDeals operates within <strong className="text-foreground/70">Tanzania only</strong>. We currently offer
              weekend free delivery in Dar es Salaam and customer-arranged express delivery throughout the country.
            </p>

            {/* Badge row */}
            <div className="flex items-center gap-2.5 mt-6 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/22">
                <Calendar className="h-3 w-3 text-emerald-400" />
                <span className="text-[9px] text-emerald-400/85">Free Weekend Delivery</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/22">
                <Zap className="h-3 w-3 text-blue-400" />
                <span className="text-[9px] text-blue-400/85">Express Nationwide</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10">
                <MapPin className="h-3 w-3 text-foreground/40" />
                <span className="text-[9px] text-foreground/45">Tanzania Only</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-14">

        {/* ── Delivery options ─────────────────────────────────────────── */}
        <section>
          <div className="mb-7">
            <p className="text-[9px] tracking-[0.3em] text-foreground/28 uppercase mb-1.5">Delivery Options</p>
            <h2 className="text-xl font-bold text-foreground/82">How We Deliver</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">

            {/* Option 1 — Free Weekend */}
            <div className="rounded-2xl border border-emerald-500/22 bg-emerald-500/[0.04] p-6 flex flex-col">
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-500/18 text-emerald-400 border border-emerald-500/22 tracking-widest">
                  FREE
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground/85 mb-2">Weekend Free Delivery</h3>
              <p className="text-[10px] text-foreground/48 leading-relaxed flex-1">
                Available on selected weekends for customers in <strong className="text-foreground/65">Dar es Salaam</strong>.
                Eligible orders are delivered at no delivery cost to the customer. Availability may vary based on location
                and order volume.
              </p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-emerald-500/12">
                <MapPin className="h-3 w-3 text-emerald-400/55 flex-shrink-0" />
                <span className="text-[9px] text-foreground/35">Dar es Salaam only · Weekends</span>
              </div>
            </div>

            {/* Option 2 — Express (Customer Pays) */}
            <div className="rounded-2xl border border-blue-500/22 bg-blue-500/[0.04] p-6 flex flex-col">
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/22 tracking-widest">
                  PAID
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground/85 mb-2">Express Delivery</h3>
              <p className="text-[10px] text-foreground/48 leading-relaxed flex-1">
                Available <strong className="text-foreground/65">throughout Tanzania</strong>. After your order is
                confirmed, HaoDeals coordinates with third-party delivery partners — Bolt, boda boda, bus services, or
                air cargo — based on your location. You will be contacted about the delivery cost and arrangements before
                the product is dispatched.
              </p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-blue-500/12">
                <Truck className="h-3 w-3 text-blue-400/55 flex-shrink-0" />
                <span className="text-[9px] text-foreground/35">Cost determined after order · ~10–30 mins (Dar)</span>
              </div>
            </div>

            {/* Option 3 — Promotional */}
            <div className="rounded-2xl border border-violet-500/22 bg-violet-500/[0.04] p-6 flex flex-col">
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-violet-400" />
                </div>
                <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/22 tracking-widest">
                  FREE
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground/85 mb-2">Promotional Free Delivery</h3>
              <p className="text-[10px] text-foreground/48 leading-relaxed flex-1">
                Occasionally offered during <strong className="text-foreground/65">special campaigns, promotions, or
                selected events</strong>. Eligibility and conditions vary by promotion. Watch for announcements on the
                website or through our notifications.
              </p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-violet-500/12">
                <Tag className="h-3 w-3 text-violet-400/55 flex-shrink-0" />
                <span className="text-[9px] text-foreground/35">Announced during campaigns</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── Express delivery partners ─────────────────────────────────── */}
        <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <Truck className="h-4 w-4 text-blue-400/60" />
            <p className="text-[9px] tracking-[0.3em] text-foreground/30 uppercase">Express Delivery Partners</p>
          </div>
          <p className="text-[11px] text-foreground/50 mb-6 leading-relaxed max-w-2xl">
            For express orders, HaoDeals works with a range of third-party delivery providers. The right provider is
            selected based on your location, product size, urgency, and availability.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Zap,      label: "Bolt / Ride-hailing", desc: "Fast in-city delivery",   color: "text-yellow-400", bg: "bg-yellow-500/8  border-yellow-500/15"  },
              { icon: Bike,     label: "Boda Boda",            desc: "Motorcycle courier",      color: "text-emerald-400",bg: "bg-emerald-500/8 border-emerald-500/15" },
              { icon: Bus,      label: "Bus Services",         desc: "Upcountry destinations",  color: "text-blue-400",   bg: "bg-blue-500/8    border-blue-500/15"    },
              { icon: Wind,     label: "Air Cargo",            desc: "Remote or urgent orders", color: "text-violet-400", bg: "bg-violet-500/8  border-violet-500/15"  },
            ].map(({ icon: Icon, label, desc, color, bg }) => (
              <div key={label} className={`rounded-xl border p-4 text-center space-y-2 ${bg}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto border ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className="text-[10px] font-semibold text-foreground/72">{label}</p>
                <p className="text-[8px] text-foreground/35">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-foreground/30 mt-5 leading-relaxed">
            * Delivery cost is determined by the provider based on distance, product weight/size, and current
            availability. HaoDeals will contact you with the delivery quote before dispatching your order.
          </p>
        </section>

        {/* ── How delivery works timeline ──────────────────────────────── */}
        <section>
          <div className="text-center mb-10">
            <p className="text-[9px] tracking-[0.3em] text-foreground/28 uppercase mb-2">Step by Step</p>
            <h2 className="text-xl font-bold text-foreground/82">How Delivery Works</h2>
            <p className="text-[11px] text-foreground/38 mt-2">From your tap to your door</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-0">
            {[
              {
                step: "01", icon: CreditCard, color: "text-violet-400", bg: "bg-violet-500/12 border-violet-500/18",
                title: "Customer Places Order",
                desc: "Select your product, add to bag or use Buy Now, complete checkout, and pay from your HaoDeals wallet. Your order is instantly recorded.",
              },
              {
                step: "02", icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/12 border-blue-500/18",
                title: "HaoDeals Confirms Order",
                desc: "Our team reviews your order and moves it to the packaging stage. You receive an in-app notification confirming your order has been accepted.",
              },
              {
                step: "03", icon: Package, color: "text-amber-400", bg: "bg-amber-500/12 border-amber-500/18",
                title: "Order is Packaged",
                desc: "We prepare and securely package your product immediately. HaoDeals does not intentionally hold confirmed orders — dispatch begins right away.",
              },
              {
                step: "04", icon: Phone, color: "text-foreground/65", bg: "bg-white/8 border-white/12",
                title: "Delivery Partner Assigned & Cost Communicated",
                desc: "For express orders, our team selects the most suitable delivery provider and contacts you to confirm the delivery cost and expected timeframe. You will not be surprised by any charges — all delivery costs are communicated before dispatch.",
                highlight: true,
              },
              {
                step: "05", icon: Truck, color: "text-emerald-400", bg: "bg-emerald-500/12 border-emerald-500/18",
                title: "Product is Dispatched",
                desc: "Your order is handed over to the delivery provider. You receive a tracking update and the delivery is underway. Dar es Salaam orders typically arrive within 10–30 minutes.",
              },
              {
                step: "06", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/12 border-yellow-500/18",
                title: "Customer Receives Order",
                desc: "Your product arrives at your door. The order status is updated to Delivered. You can then leave a review or initiate a return within 72 hours if needed.",
              },
            ].map(({ step, icon: Icon, color, bg, title, desc, highlight }, i, arr) => (
              <div key={step} className="relative flex gap-5">
                {/* Connector line */}
                {i < arr.length - 1 && (
                  <div className="absolute left-[19px] top-[44px] bottom-0 w-[2px] bg-white/6 z-0" />
                )}
                {/* Circle */}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                {/* Content */}
                <div className={`flex-1 pb-8 ${highlight ? "rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] p-4 -ml-2 mb-4" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[7px] font-mono text-foreground/20 tracking-widest">{step}</span>
                    <h3 className="text-[11px] font-bold text-foreground/80">{title}</h3>
                    {highlight && (
                      <span className="text-[7px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 tracking-widest">IMPORTANT</span>
                    )}
                  </div>
                  <p className="text-[10px] text-foreground/45 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Key facts grid ───────────────────────────────────────────── */}
        <section>
          <div className="mb-6">
            <p className="text-[9px] tracking-[0.3em] text-foreground/28 uppercase mb-1.5">Key Facts</p>
            <h2 className="text-xl font-bold text-foreground/82">Important Delivery Information</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Globe2,       color: "text-foreground/45", title: "Tanzania Only",               desc: "HaoDeals does not offer international shipping. All deliveries are within Tanzania." },
              { icon: Clock,        color: "text-blue-400",      title: "10–30 Minutes (Dar es Salaam)", desc: "For express orders in Dar es Salaam, you can generally expect delivery within 10–30 minutes of dispatch confirmation." },
              { icon: Phone,        color: "text-emerald-400",   title: "We Contact You",              desc: "For paid deliveries, our team will reach out to confirm the delivery cost and arrangement before dispatching." },
              { icon: Truck,        color: "text-amber-400",     title: "Immediate Dispatch",          desc: "HaoDeals aims to dispatch orders right away. We do not intentionally hold confirmed orders in the warehouse." },
              { icon: AlertTriangle,color: "text-amber-400",     title: "Variable Timelines",          desc: "Delivery times may vary due to weather, transportation availability, public holidays, or other unforeseen circumstances." },
              { icon: Shield,       color: "text-violet-400",    title: "No Hidden Charges",           desc: "Any delivery costs are communicated to you before the product is dispatched. You will never be surprised." },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-xl border border-white/7 bg-white/[0.02] hover:border-white/12 transition-all">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-foreground/72 mb-1">{title}</p>
                  <p className="text-[9px] text-foreground/40 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Notice banners ───────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-5">
            <Info className="h-3.5 w-3.5 text-foreground/28" />
            <p className="text-[9px] tracking-[0.3em] text-foreground/28 uppercase">Important Notices</p>
          </div>
          {[
            {
              type: "warning",
              title: "Delivery costs are not displayed on the platform",
              text: "For express delivery, costs are not pre-set or shown at checkout. After you place your order, the HaoDeals team will contact you with the delivery cost based on your location, product size, and available providers.",
            },
            {
              type: "info",
              title: "Free weekend delivery availability may vary",
              text: "Weekend free delivery is offered on selected weekends and is limited to Dar es Salaam customers. It is not guaranteed every weekend and depends on order volume and logistics availability.",
            },
            {
              type: "info",
              title: "HaoDeals dispatches orders quickly",
              text: "We aim to dispatch all confirmed orders immediately. However, delivery timelines depend on the selected provider, your region, and external factors beyond our control.",
            },
          ].map(({ type, title, text }, i) => {
            const styles = {
              warning: { wrap: "border-amber-500/20 bg-amber-500/[0.04]", icon: "text-amber-400", Icon: AlertTriangle },
              info:    { wrap: "border-blue-500/20 bg-blue-500/[0.04]",   icon: "text-blue-400",   Icon: Info         },
            }
            const s = styles[type as keyof typeof styles]
            return (
              <div key={i} className={`flex items-start gap-3.5 p-4 rounded-xl border ${s.wrap}`}>
                <s.Icon className={`h-4 w-4 ${s.icon} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className="text-[10px] font-bold text-foreground/72 mb-1">{title}</p>
                  <p className="text-[10px] text-foreground/48 leading-relaxed">{text}</p>
                </div>
              </div>
            )
          })}
        </section>

        {/* ── CTA ────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Truck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/82">Questions about your delivery?</p>
              <p className="text-[10px] text-foreground/42 mt-1 leading-relaxed">
                Track your order in the Orders section or contact our team for delivery enquiries.
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap justify-center">
            <Link href="/orders"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-foreground/55 text-[10px] font-mono hover:text-foreground hover:border-white/28 transition-all">
              Track My Order
            </Link>
            <Link href="/contact"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold tracking-wide transition-all active:scale-95">
              Contact Support <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <div className="h-4" />
      </div>
    </div>
  )
}
