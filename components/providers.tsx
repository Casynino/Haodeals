"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

// ---------------------------------------------------------------------------
// BroadcastChannel isolation — module-level patch (second line of defence
// after the beforeInteractive script in app/layout.tsx).
//
// WHY THIS WORKS: next-auth creates BroadcastChannel("next-auth") LAZILY
// inside a useEffect (not at module initialisation). All ES `import`
// statements are hoisted and evaluated first, so next-auth's module code
// runs before this block — but at that point it only writes
// `let broadcastChannel = null`. The actual `new BroadcastChannel(…)` call
// happens later, inside the SessionProvider useEffect, which runs AFTER
// this module-level code. So our replacement is always in place first.
// ---------------------------------------------------------------------------
if (typeof window !== "undefined" && window.BroadcastChannel) {
  const _w = window as typeof window & { __bcPatched?: boolean }
  if (!_w.__bcPatched) {
    const _Orig = window.BroadcastChannel
    const _noop = {
      name: "next-auth",
      onmessage: null,
      onmessageerror: null,
      postMessage() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() { return true },
      close() {},
    } as unknown as BroadcastChannel
    window.BroadcastChannel = function (n: string) {
      return n === "next-auth" ? _noop : new _Orig(n)
    } as unknown as typeof BroadcastChannel
    window.BroadcastChannel.prototype = _Orig.prototype
    _w.__bcPatched = true
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // refetchOnWindowFocus: false — no jarring session refetch on tab-switch.
    // refetchInterval: 0          — no background polling.
    // BroadcastChannel is neutralised above + by the layout.tsx script.
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <ThemeProvider>
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  )
}
