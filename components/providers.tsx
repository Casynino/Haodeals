"use client"

// ─── Tab-session isolation ────────────────────────────────────────────────────
// NextAuth v5 uses BroadcastChannel("next-auth") to push signIn/signOut events
// to every open tab.  We replace that channel with a no-op BEFORE any React
// rendering or useEffect runs, so each tab keeps its own session state and only
// syncs when the user navigates or refreshes — exactly how Amazon, eBay, etc. work.
//
// Why module-level (not useEffect)?  ES-module body code runs synchronously
// after imports are resolved, which is before React's render→commit→effect
// pipeline.  NextAuth's BroadcastChannel is lazily created inside a useEffect,
// so our patch is always in place when that useEffect fires.
// A useEffect patch can race with React Strict Mode's double-invoke cycle; this
// cannot.
if (typeof window !== "undefined") {
  const _RealBC = window.BroadcastChannel
  if (typeof _RealBC !== "undefined") {
    const _noopChannel: BroadcastChannel = {
      name: "next-auth",
      onmessage: null,
      onmessageerror: null,
      postMessage() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() { return true },
      close() {},
    }
    // Intercept only "next-auth" — every other channel name uses the real API.
    // @ts-expect-error — intentional global patch
    window.BroadcastChannel = function (name: string) {
      return name === "next-auth" ? _noopChannel : new _RealBC(name)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window.BroadcastChannel as any).prototype = _RealBC.prototype
  }
}
// ─────────────────────────────────────────────────────────────────────────────

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // refetchOnWindowFocus: false  — no jarring session refetch on tab-switch.
    // refetchInterval: 0           — no background polling.
    // Cross-tab broadcast is already neutralised by the module-level patch above.
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <ThemeProvider>
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  )
}
