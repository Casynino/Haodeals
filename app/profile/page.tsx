"use client"

import { useSession, signOut } from "next-auth/react"
import { User, Mail, ShieldCheck, Package, LogOut, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const { data: session } = useSession()
  const user = session?.user as { name?: string; email?: string; image?: string; id?: string; role?: string } | undefined

  const initial = user?.name?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? "U"

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg font-mono">
      <div className="flex items-center gap-3 mb-6 border-b border-white/12 pb-4">
        <span className="text-foreground/45 text-xs">//</span>
        <h1 className="text-lg font-semibold tracking-[0.2em] text-foreground/90">Profile</h1>
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
            <h2 className="text-base font-bold tracking-wide uppercase text-foreground/90">{user?.name ?? "USER"}</h2>
            <p className="text-xs text-foreground/60 mt-0.5">{user?.email}</p>
            <span className={`inline-block mt-1.5 text-[12px] tracking-widest border px-2 py-0.5 ${
              user?.role === "admin"
                ? "border-yellow-400/40 text-yellow-400/80"
                : "border-white/25 text-foreground/55"
            }`}>
              {user?.role === "admin" ? "[ADMIN]" : "[MEMBER]"}
            </span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 space-y-3">
          <p className="text-[12px] tracking-widest text-foreground/45">Account details</p>
          {[
            { icon: User, label: "Name", value: user?.name ?? "—" },
            { icon: Mail, label: "Email", value: user?.email ?? "—" },
            { icon: ShieldCheck, label: "Account type", value: (user?.role ?? "customer").toUpperCase() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 border border-white/12 flex items-center justify-center flex-shrink-0">
                <Icon className="h-3.5 w-3.5 text-foreground/50" />
              </div>
              <div>
                <p className="text-[12px] text-foreground/45 tracking-wider">{label}</p>
                <p className="text-xs text-foreground/75 mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <p className="text-[12px] tracking-widest text-foreground/45">Quick actions</p>
          <Link
            href="/orders"
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 border border-white/18 text-xs text-foreground/65 hover:text-foreground hover:border-white/35 transition-colors"
          >
            <Package className="h-3.5 w-3.5" /> My Orders
          </Link>
          <Link
            href="/messages"
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 border border-white/18 text-xs text-foreground/65 hover:text-foreground hover:border-white/35 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" /> Messages / Inbox
          </Link>
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 border border-yellow-400/25 text-xs text-yellow-400/70 hover:text-yellow-400/90 hover:border-yellow-400/45 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Admin Dashboard
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 border border-white/18 text-xs text-foreground/50 hover:text-red-400/80 hover:border-red-400/35 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
