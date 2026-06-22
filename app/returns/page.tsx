import Link from "next/link"
import {
  RotateCcw, Clock, CheckCircle2, XCircle, AlertTriangle,
  Package, Search, Banknote, ArrowRight, Shield, Phone,
} from "lucide-react"

export const metadata = { title: "Returns & Refund Policy — HaoDeals" }

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/15 via-background to-background pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-emerald-400/70 rounded-full" />
              <span className="text-[11px] tracking-[0.3em] text-emerald-400/60 uppercase">Customer Protection</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground/90 mb-4">
              Returns &amp; Refund Policy
            </h1>
            <p className="text-sm text-foreground/50 leading-relaxed max-w-lg">
              We want you to be completely satisfied with your purchase. If something isn&apos;t right, here&apos;s exactly how our returns process works.
            </p>
            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Clock className="h-3 w-3 text-emerald-400" />
                <span className="text-[11px] text-emerald-400/80">72-Hour Return Window</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Banknote className="h-3 w-3 text-blue-400" />
                <span className="text-[11px] text-blue-400/80">Full Refund if Eligible</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key policy cards ──────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-12">
        <p className="text-[11px] tracking-[0.3em] text-foreground/30 uppercase mb-6">Policy Summary</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
          {[
            {
              icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20",
              title: "72-Hour Window",
              desc: "You must initiate a return request within 72 hours of receiving your product. Requests after this period will not be accepted.",
            },
            {
              icon: RotateCcw, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",
              title: "Customer Bears Shipping",
              desc: "HaoDeals does not cover return shipping costs. You are responsible for all costs associated with sending the product back to us.",
            },
            {
              icon: Search, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
              title: "3-Day Review",
              desc: "Once we receive your returned product, our team will review it within 3 working days to determine eligibility for a refund.",
            },
            {
              icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",
              title: "Full Refund Issued",
              desc: "If the review confirms the issue was not caused by you (defective, wrong item, damage in transit), you receive a full refund.",
            },
            {
              icon: XCircle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20",
              title: "No Refund for Misuse",
              desc: "If our review team determines the damage was caused by misuse, negligence, or customer actions, no refund will be issued.",
            },
            {
              icon: Banknote, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",
              title: "Refund to Wallet",
              desc: "Approved refunds are credited to your HaoDeals wallet within 1 working day after the review decision.",
            },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className={`rounded-2xl border p-5 space-y-3 ${bg}`}>
              <div className={`w-9 h-9 rounded-xl border ${bg} flex items-center justify-center`}>
                <Icon className={`h-4.5 w-4.5 ${color}`} />
              </div>
              <h3 className="text-[13px] font-bold text-foreground/80 tracking-wide">{title}</h3>
              <p className="text-[12px] text-foreground/45 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* ── Return process timeline ── */}
        <div className="max-w-3xl mx-auto mb-14">
          <div className="text-center mb-8">
            <p className="text-[11px] tracking-[0.3em] text-foreground/28 uppercase mb-2">Step by Step</p>
            <h2 className="text-xl font-bold text-foreground/80">How to Return a Product</h2>
          </div>

          <div className="space-y-0">
            {[
              {
                step: "01", icon: Phone, color: "text-violet-400", bg: "bg-violet-500/15",
                title: "Contact Us Within 72 Hours",
                desc: "Email haodealtz@gmail.com or call 0788 734 003 with your order number and the reason for the return. Include photos of the product if it arrived damaged.",
              },
              {
                step: "02", icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/15",
                title: "Receive Return Authorisation",
                desc: "Our team will review your request and send you a Return Authorisation (RA) number. Do not send the product back without this confirmation.",
              },
              {
                step: "03", icon: Package, color: "text-amber-400", bg: "bg-amber-500/15",
                title: "Package & Ship the Product",
                desc: "Securely repackage the product in its original packaging if possible. Ship to our warehouse at Mbezi Goigi, Dar es Salaam. You cover the shipping cost.",
              },
              {
                step: "04", icon: Search, color: "text-foreground/60", bg: "bg-white/10",
                title: "Product Review (3 Working Days)",
                desc: "Once received, our team inspects the product within 3 working days to verify the return reason and determine refund eligibility.",
              },
              {
                step: "05", icon: Banknote, color: "text-emerald-400", bg: "bg-emerald-500/15",
                title: "Refund Decision & Processing",
                desc: "If eligible, a full refund is credited to your HaoDeals wallet within 1 working day of the review decision. You will be notified by email.",
              },
            ].map(({ step, icon: Icon, color, bg, title, desc }, i, arr) => (
              <div key={step} className="relative flex gap-5">
                {/* Connector line */}
                {i < arr.length - 1 && (
                  <div className="absolute left-[19px] top-12 bottom-0 w-[2px] bg-white/8 z-0" />
                )}
                {/* Step circle */}
                <div className={`relative z-10 w-10 h-10 rounded-full ${bg} border border-white/10 flex items-center justify-center flex-shrink-0 mt-1`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                {/* Content */}
                <div className={`flex-1 pb-8 ${i < arr.length - 1 ? "" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-foreground/22">{step}</span>
                    <h3 className="text-[13px] font-bold text-foreground/78">{title}</h3>
                  </div>
                  <p className="text-[12px] text-foreground/42 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Important notices ── */}
        <div className="max-w-3xl mx-auto space-y-3 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400/60" />
            <p className="text-[11px] tracking-[0.3em] text-foreground/30 uppercase">Important Notices</p>
          </div>
          {[
            { type: "warning", text: "Returns requested after 72 hours from delivery will NOT be accepted under any circumstances." },
            { type: "warning", text: "Products must be returned in the same condition as received. Damaged, used, or incomplete returns may be rejected." },
            { type: "danger",  text: "HaoDeals does not accept returns for change of mind, wrong size chosen, or products matching their description exactly." },
            { type: "info",    text: "Keep your return tracking number. We are not responsible for packages lost in transit on the way back to our warehouse." },
            { type: "info",    text: "For urgent return requests, call us directly at 0788 734 003 during business hours." },
          ].map(({ type, text }, i) => {
            const styles = {
              warning: "border-amber-500/20 bg-amber-500/[0.04] text-amber-400",
              danger:  "border-rose-500/20 bg-rose-500/[0.04] text-rose-400",
              info:    "border-blue-500/20 bg-blue-500/[0.04] text-blue-400",
            }
            const icons = { warning: AlertTriangle, danger: XCircle, info: Shield }
            const Icon = icons[type as keyof typeof icons]
            return (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${styles[type as keyof typeof styles]}`}>
                <Icon className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] leading-relaxed text-foreground/65">{text}</p>
              </div>
            )
          })}
        </div>

        {/* ── CTA ── */}
        <div className="max-w-3xl mx-auto rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground/78">Need to start a return?</p>
            <p className="text-[12px] text-foreground/40 mt-0.5">Contact our support team and we&apos;ll guide you through the process.</p>
          </div>
          <Link href="/contact" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[12px] font-semibold tracking-widest transition-all active:scale-95 flex-shrink-0">
            Contact Support <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

    </div>
  )
}
