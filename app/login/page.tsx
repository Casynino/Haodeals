"use client"

import { Suspense, useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { tryAdminSignIn } from "@/app/actions/admin-auth"

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })
  const { data: session } = useSession()
  const currentUser = session?.user as { name?: string; email?: string } | undefined

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false })
    // In NextAuth v5, result.ok reflects HTTP 200 (always true).
    // result.error is set to "CredentialsSignin" when credentials are wrong.
    // We MUST check !result.error — not result.ok — to know if auth succeeded.
    if (result && !result.error) {
      toast.success("Welcome back!", { className: "font-mono text-xs" })
      await tryAdminSignIn(form.email, form.password)
      window.location.href = callbackUrl
    } else {
      toast.error("Incorrect email or password.", { className: "font-mono text-xs" })
    }
    setLoading(false)
  }

  async function handleOAuth(provider: "google" | "apple") {
    setOauthLoading(provider)
    await signIn(provider, { callbackUrl })
  }

  return (
    <div className="w-full max-w-[360px] space-y-7">

      {/* Already signed in — switching accounts banner */}
      {currentUser && (
        <div className="flex items-start gap-2.5 px-3 py-2.5 bg-foreground/5 border border-white/10 text-[10px] font-mono text-foreground/50">
          <UserCheck className="h-3.5 w-3.5 mt-0.5 shrink-0 text-foreground/30" />
          <span>
            Signed in as <span className="text-foreground/70">{currentUser.email}</span>.{" "}
            Sign in below to switch accounts, or{" "}
            <Link href="/" className="text-foreground/60 hover:text-foreground underline underline-offset-2 transition-colors">
              go to home
            </Link>
            .
          </span>
        </div>
      )}

      {/* Brand + heading */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-1 font-mono font-black text-base tracking-widest mb-1">
          <span className="text-foreground/30">[</span>
          <span>HAO</span>
          <span className="text-foreground/60">DEALS</span>
          <span className="text-foreground/30">]</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
        <p className="text-sm text-foreground/50">Sign in to continue shopping</p>
      </div>

      {/* OAuth buttons */}
      <div className="space-y-3">
        <button
          onClick={() => handleOAuth("google")}
          disabled={!!oauthLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white text-gray-800 text-sm font-semibold rounded-none border border-white/20 hover:bg-white/90 transition-colors disabled:opacity-60"
        >
          {oauthLoading === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          )}
          Continue with Google
        </button>

        <button
          onClick={() => handleOAuth("apple")}
          disabled={!!oauthLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-foreground text-background text-sm font-semibold rounded-none border border-foreground/20 hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {oauthLoading === "apple" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg width="16" height="18" viewBox="0 0 814 1000" fill="currentColor"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105.3-43.3-157.3-105.8C142.7 644 62.3 490 62.3 344c0-236.5 155.5-361.5 308.4-361.5 80.5 0 147.4 53.1 197.8 53.1 50.4 0 127.3-56.4 218.1-56.4 35.3 0 108.2 3.2 162.4 93.2zm-156.7-253.6C599.8 51.2 567 19 532.1 19c-41.4 0-86.8 26.7-115.8 68.8-26.1 37.5-42.7 84.2-42.7 127.3 0 5.8.6 11.6 1.3 16.8 2.6.6 6.5 1.3 10.4 1.3 39.5 0 87.5-25.4 117.1-67.5 31.2-42.7 49.3-90.3 49.3-127.3v-3.2z"/></svg>
          )}
          Continue with Apple
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-foreground/30 font-mono">or sign in with email</span>
        </div>
      </div>

      {/* Email/password form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-foreground/50 font-medium">Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full bg-transparent border border-white/15 px-3 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-foreground/50 font-medium">Password</label>
            <Link href="/forgot-password" className="text-xs text-foreground/40 hover:text-foreground transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-foreground text-background text-sm font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-foreground/40">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-foreground font-semibold hover:underline transition-colors">
          Sign Up
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
