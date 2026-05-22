"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (result?.ok) {
      toast.success("AUTH.SUCCESS", { className: "font-mono text-xs" })
      router.push(callbackUrl)
      router.refresh()
    } else {
      toast.error("AUTH.FAILED // INVALID.CREDENTIALS", { className: "font-mono text-xs" })
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm space-y-6">

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 opacity-50">
          <div className="w-4 h-px bg-foreground" />
          <span className="text-[9px] tracking-widest">HAODEALS.SYS / AUTH</span>
          <div className="flex-1 h-px bg-foreground" />
        </div>
        <h1 className="text-xl font-black tracking-widest">ACCESS.TERMINAL</h1>
        <p className="text-[10px] text-foreground/40 tracking-wide">ENTER.CREDENTIALS.TO.PROCEED</p>
      </div>

      {/* Demo credentials */}
      <div className="border border-foreground/15 p-3 space-y-1.5">
        <p className="text-[8px] tracking-widest text-foreground/30">// DEMO.CREDENTIALS</p>
        <div className="text-[9px] text-foreground/40 space-y-1">
          <p><span className="text-foreground/20">ADMIN</span> admin@haodeals.com / admin123</p>
          <p><span className="text-foreground/20">USER </span> user@haodeals.com / user1234</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="border border-foreground/15 p-5 space-y-4 relative">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-foreground/30" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-foreground/30" />

        <div className="space-y-1.5">
          <label className="text-[8px] tracking-widest text-foreground/30">EMAIL.ADDRESS</label>
          <input
            type="email"
            placeholder="user@domain.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full bg-transparent border border-foreground/15 px-3 py-2 text-[10px] tracking-wide text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[8px] tracking-widest text-foreground/30">PASSWORD</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full bg-transparent border border-foreground/15 px-3 py-2 pr-9 text-[10px] tracking-wide text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
            >
              {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-foreground text-background text-[10px] tracking-widest font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {loading ? "AUTHENTICATING..." : "INITIALIZE.SESSION"}
        </button>
      </form>

      <p className="text-center text-[9px] text-foreground/30 tracking-wide">
        NO.ACCOUNT?{" "}
        <Link href="/register" className="text-foreground/60 hover:text-foreground transition-colors tracking-widest">
          REGISTER.NOW
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 font-mono">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
