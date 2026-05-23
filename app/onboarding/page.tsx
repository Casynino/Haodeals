"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Phone } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function OnboardingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    })

    if (res.ok) {
      // Update the JWT session so needsPhone clears immediately
      await update({ phone })
      toast.success("Phone number saved!", { className: "font-mono text-xs" })
      router.push("/products")
      router.refresh()
    } else {
      const data = await res.json()
      toast.error(data.error ?? "Something went wrong. Please try again.", { className: "font-mono text-xs" })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[360px] space-y-8">

        {/* Brand + heading */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-1 font-mono font-black text-base tracking-widest mb-1">
            <span className="text-foreground/30">[</span>
            <span>HAO</span>
            <span className="text-foreground/60">DEALS</span>
            <span className="text-foreground/30">]</span>
          </Link>
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 flex items-center justify-center bg-foreground/5 border border-white/10 rounded-full">
              <Phone className="h-5 w-5 text-foreground/50" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">One Last Step</h1>
          <p className="text-sm text-foreground/50">
            Add your phone number so we can deliver to you across Tanzania 🇹🇿
          </p>
        </div>

        {/* Why we need it */}
        <div className="bg-foreground/3 border border-white/8 px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-foreground/60">Why do we need your phone?</p>
          <ul className="space-y-1">
            <li className="text-xs text-foreground/40">• Delivery updates via SMS</li>
            <li className="text-xs text-foreground/40">• M-Pesa & Tigo Pesa payments</li>
            <li className="text-xs text-foreground/40">• Order confirmation &amp; support</li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-foreground/50 font-medium">
              Phone number <span className="text-foreground/30">(Tanzania)</span>
            </label>
            <input
              type="tel"
              placeholder="+255 712 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              minLength={9}
              className="w-full bg-transparent border border-white/15 px-3 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-foreground text-background text-sm font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Saving..." : "Save & Continue Shopping"}
          </button>
        </form>

        <p className="text-center text-xs text-foreground/25">
          Your number is only used for delivery and payments. We never share it.
        </p>
      </div>
    </div>
  )
}
