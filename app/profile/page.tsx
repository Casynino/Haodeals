"use client"

import { useSession, signOut } from "next-auth/react"
import { User, Mail, ShieldCheck, Package, LogOut } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const { data: session } = useSession()
  const user = session?.user as { name?: string; email?: string; image?: string; id?: string; role?: string } | undefined

  const initial = user?.name?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? "U"

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg font-mono">
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <span className="text-foreground/30 text-[10px]">//</span>
        <h1 className="text-[11px] tracking-[0.3em] text-foreground/70">USER.PROFILE</h1>
      </div>

      <div className="border border-white/10 p-6 space-y-6 relative">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20" />

        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 border border-white/20 flex items-center justify-center bg-foreground/5 text-xl font-bold text-foreground/70">
            {initial}
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-foreground/80">{user?.name ?? "USER"}</h2>
            <p className="text-[9px] text-foreground/40">{user?.email}</p>
            <span className={`inline-block mt-1 text-[7px] tracking-widest border px-1.5 py-0.5 ${
              user?.role === "admin"
                ? "border-yellow-400/30 text-yellow-400/70"
                : "border-white/20 text-foreground/40"
            }`}>
              {user?.role === "admin" ? "[ADMIN]" : "[MEMBER]"}
            </span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 space-y-3">
          <p className="text-[8px] tracking-widest text-foreground/25">// ACCOUNT.DATA</p>
          {[
            { icon: User, label: "DISPLAY.NAME", value: user?.name ?? "—" },
            { icon: Mail, label: "EMAIL.ADDRESS", value: user?.email ?? "—" },
            { icon: ShieldCheck, label: "ACCOUNT.TYPE", value: (user?.role ?? "customer").toUpperCase() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-7 h-7 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-3 w-3 text-foreground/30" />
              </div>
              <div>
                <p className="text-[8px] text-foreground/25 tracking-widest">{label}</p>
                <p className="text-[10px] text-foreground/60">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <p className="text-[8px] tracking-widest text-foreground/25">// ACTIONS</p>
          <Link
            href="/orders"
            className="flex items-center gap-2 w-full px-3 py-2 border border-white/15 text-[10px] tracking-widest text-foreground/50 hover:text-foreground hover:border-white/30 transition-colors"
          >
            <Package className="h-3 w-3" /> VIEW.MY.ORDERS
          </Link>
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 w-full px-3 py-2 border border-yellow-400/20 text-[10px] tracking-widest text-yellow-400/60 hover:text-yellow-400/80 hover:border-yellow-400/40 transition-colors"
            >
              <ShieldCheck className="h-3 w-3" /> ADMIN.DASHBOARD
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 w-full px-3 py-2 border border-white/15 text-[10px] tracking-widest text-foreground/40 hover:text-red-400/70 hover:border-red-400/30 transition-colors"
          >
            <LogOut className="h-3 w-3" /> TERMINATE.SESSION
          </button>
        </div>
      </div>
    </div>
  )
}
