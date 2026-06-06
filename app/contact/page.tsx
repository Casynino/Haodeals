"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MapPin, Phone, Mail, Clock, Send, CheckCircle2,
  MessageSquare, Loader2, ChevronDown, ChevronUp, ArrowRight,
} from "lucide-react"
import { toast } from "sonner"

const FAQS = [
  { q: "How do I track my order?", a: "Go to your account → Orders to see real-time tracking updates for every order you've placed." },
  { q: "How long does delivery take?", a: "Standard delivery takes 1–3 business days within Dar es Salaam. Weekend free delivery is available for qualifying orders." },
  { q: "Can I return a product?", a: "Yes. You have 72 hours from the time you receive your order to initiate a return. See our Returns Policy for full details." },
  { q: "What payment methods are accepted?", a: "We accept M-Pesa mobile payments via our nTZS wallet system. Top up your wallet and pay instantly at checkout." },
  { q: "My order hasn't arrived. What should I do?", a: "First check your order status in the Orders section. If the status is 'In Transit' and it has been more than 3 days, contact us at the email or phone below." },
  { q: "Can I change or cancel my order?", a: "Orders can be cancelled before they move to the Packaging stage. Once packaging begins, please contact us directly for assistance." },
]

export default function ContactPage() {
  const [form,    setForm]    = useState({ name: "", email: "", subject: "", message: "" })
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    // Simulate a brief send delay then confirm
    await new Promise((r) => setTimeout(r, 900))
    setSending(false)
    setSent(true)
    toast.success("Message received! We'll reply within 24 hours.", { className: "font-mono text-xs" })
  }

  return (
    <div className="min-h-screen font-mono bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-background to-background pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-violet-400/70 rounded-full" />
              <span className="text-[9px] tracking-[0.3em] text-violet-400/60 uppercase">Support</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground/90 mb-4">
              Get in Touch
            </h1>
            <p className="text-sm text-foreground/50 leading-relaxed max-w-lg">
              We&apos;re here to help. Whether you have a question about an order, need product information, or want to give feedback — our team responds within 24 hours.
            </p>
            <div className="flex items-center gap-2 mt-6">
              <div className="w-2 h-2 bg-emerald-400/70 rounded-full animate-pulse" />
              <span className="text-[10px] text-emerald-400/60">Team available · Mon–Sat, 8am–8pm EAT</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact cards ──────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: MapPin, label: "Visit Us", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20",
              lines: ["Warehouse & Returns", "Mbezi Goigi", "Dar es Salaam, Tanzania"],
            },
            {
              icon: Phone, label: "Call Us", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",
              lines: ["Direct line", "0788 734 003", "Mon–Sat · 8am–8pm EAT"],
            },
            {
              icon: Mail, label: "Email Us", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",
              lines: ["General enquiries", "haodealtz@gmail.com", "Reply within 24 hours"],
            },
          ].map(({ icon: Icon, label, color, bg, lines }) => (
            <div key={label} className={`rounded-2xl border p-5 space-y-3 ${bg} hover:scale-[1.01] transition-transform`}>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-[9px] tracking-widest text-foreground/35 uppercase mb-2">{label}</p>
                {lines.map((l, i) => (
                  <p key={i} className={i === 1 ? "text-sm font-semibold text-foreground/80" : "text-[10px] text-foreground/40"}>{l}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Two-column: form + hours ── */}
        <div className="grid lg:grid-cols-5 gap-8">

          {/* Contact form */}
          <div className="lg:col-span-3 rounded-2xl border border-white/8 bg-white/[0.02] p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="h-4 w-4 text-violet-400/60" />
              <h2 className="text-sm font-semibold text-foreground/75 tracking-widest uppercase">Send a Message</h2>
            </div>

            {sent ? (
              <div className="flex flex-col items-center text-center py-10 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <p className="text-base font-semibold text-foreground/80">Message Sent!</p>
                <p className="text-sm text-foreground/40">We&apos;ll get back to you within 24 hours at the email you provided.</p>
                <button onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }) }}
                  className="text-[10px] text-foreground/30 hover:text-foreground/60 transition-colors mt-2">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] tracking-widest text-foreground/35 block mb-1.5 uppercase">Your Name</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                      placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/75 placeholder:text-foreground/20 focus:outline-none focus:border-violet-500/40 transition-all" />
                  </div>
                  <div>
                    <label className="text-[9px] tracking-widest text-foreground/35 block mb-1.5 uppercase">Email Address</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                      placeholder="you@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/75 placeholder:text-foreground/20 focus:outline-none focus:border-violet-500/40 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] tracking-widest text-foreground/35 block mb-1.5 uppercase">Subject</label>
                  <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required
                    placeholder="e.g. Order issue, Return request…" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/75 placeholder:text-foreground/20 focus:outline-none focus:border-violet-500/40 transition-all" />
                </div>
                <div>
                  <label className="text-[9px] tracking-widest text-foreground/35 block mb-1.5 uppercase">Message</label>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={5}
                    placeholder="Describe your question or issue in detail…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-foreground/75 placeholder:text-foreground/20 focus:outline-none focus:border-violet-500/40 transition-all resize-none" />
                </div>
                <button type="submit" disabled={sending}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50">
                  {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send Message</>}
                </button>
              </form>
            )}
          </div>

          {/* Hours + quick links */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-3.5 w-3.5 text-blue-400/60" />
                <p className="text-[9px] tracking-widest text-foreground/35 uppercase">Business Hours</p>
              </div>
              <div className="space-y-2">
                {[
                  { day: "Monday – Friday", hours: "8:00 AM – 8:00 PM", active: true },
                  { day: "Saturday",        hours: "9:00 AM – 6:00 PM", active: true },
                  { day: "Sunday",          hours: "Closed",            active: false },
                ].map(({ day, hours, active }) => (
                  <div key={day} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-[10px] text-foreground/50">{day}</span>
                    <span className={`text-[10px] font-mono ${active ? "text-foreground/65" : "text-foreground/28"}`}>{hours}</span>
                  </div>
                ))}
              </div>
              <p className="text-[8px] text-foreground/28 mt-3">All times are East Africa Time (EAT, GMT+3)</p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-3">
              <p className="text-[9px] tracking-widest text-foreground/35 uppercase mb-3">Quick Links</p>
              {[
                { label: "Track My Order",   href: "/orders"   },
                { label: "Returns Policy",   href: "/returns"  },
                { label: "Shipping Policy",  href: "/shipping" },
                { label: "My Account",       href: "/profile"  },
              ].map(({ label, href }) => (
                <Link key={label} href={href}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 text-[10px] text-foreground/50 hover:text-foreground/80 transition-colors">
                  <span>{label}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="border-t border-white/8 bg-white/[0.01]">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-[9px] tracking-[0.3em] text-foreground/30 uppercase mb-2">FAQ</p>
              <h2 className="text-xl font-bold text-foreground/80">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-white/8 rounded-2xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors">
                    <span className="text-[11px] font-semibold text-foreground/72 pr-4">{faq.q}</span>
                    {openFaq === i
                      ? <ChevronUp className="h-4 w-4 text-foreground/30 flex-shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-foreground/30 flex-shrink-0" />
                    }
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 border-t border-white/6">
                      <p className="text-[11px] text-foreground/50 leading-relaxed mt-3">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
