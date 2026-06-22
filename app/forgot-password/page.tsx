"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setSent(true)
      } else {
        const data = await res.json()
        setError(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[360px] space-y-6">

        {/* Brand */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-1 font-black text-base tracking-widest mb-1">
            <span className="text-foreground/30">[</span>
            <span>HAO</span>
            <span className="text-foreground/60">DEALS</span>
            <span className="text-foreground/30">]</span>
          </Link>

          {!sent ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
              <p className="text-sm text-foreground/50">
                Enter your email and we&apos;ll send you a link to reset it.
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mt-2">
                <CheckCircle className="h-10 w-10 text-green-400/70" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
              <p className="text-sm text-foreground/50">
                If an account exists for <span className="text-foreground/70 font-medium">{email}</span>, we sent a password reset link. It expires in 1 hour.
              </p>
            </>
          )}
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-foreground/50 font-medium">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent border border-white/15 pl-9 pr-3 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400/80 bg-red-400/5 border border-red-400/15 px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-foreground text-background text-sm font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => { setSent(false); setEmail("") }}
              className="w-full py-2.5 bg-transparent border border-white/20 text-foreground/60 text-sm hover:text-foreground hover:border-white/40 transition-colors"
            >
              Use a different email
            </button>
          </div>
        )}

        <p className="text-center text-sm text-foreground/40">
          <Link href="/login" className="inline-flex items-center gap-1 text-foreground/50 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Sign In
          </Link>
        </p>

      </div>
    </div>
  )
}
