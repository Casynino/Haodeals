"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  // No token in URL — show helpful message
  if (!token) {
    return (
      <div className="w-full max-w-[360px] space-y-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-400/70 mx-auto" />
        <h1 className="text-2xl font-bold tracking-tight">Invalid reset link</h1>
        <p className="text-sm text-foreground/50">
          This link is missing a reset token. Please request a new password reset.
        </p>
        <Link href="/forgot-password" className="inline-block w-full py-2.5 bg-foreground text-background text-sm font-bold text-center hover:bg-foreground/90 transition-colors">
          Request New Link
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()
      if (res.ok) {
        setDone(true)
      } else {
        setError(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="w-full max-w-[360px] space-y-6 text-center">
        <CheckCircle className="h-10 w-10 text-green-400/70 mx-auto" />
        <h1 className="text-2xl font-bold tracking-tight">Password updated!</h1>
        <p className="text-sm text-foreground/50">
          Your password has been changed successfully. You can now sign in with your new password.
        </p>
        <Link href="/login" className="inline-block w-full py-2.5 bg-foreground text-background text-sm font-bold text-center hover:bg-foreground/90 transition-colors">
          Sign In Now
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[360px] space-y-6">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-1 font-mono font-black text-base tracking-widest mb-1">
          <span className="text-foreground/30">[</span>
          <span>HAO</span>
          <span className="text-foreground/60">DEALS</span>
          <span className="text-foreground/30">]</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
        <p className="text-sm text-foreground/50">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-foreground/50 font-medium">New password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-transparent border border-white/15 px-3 py-2.5 pr-10 text-sm text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-foreground/50 font-medium">Confirm new password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Same password again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full bg-transparent border border-white/15 px-3 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
          />
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
          {loading ? "Updating password..." : "Update Password"}
        </button>
      </form>

      <p className="text-center text-sm text-foreground/40">
        <Link href="/login" className="inline-flex items-center gap-1 text-foreground/50 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to Sign In
        </Link>
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
