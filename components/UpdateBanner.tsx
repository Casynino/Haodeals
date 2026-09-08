"use client"

import { useEffect, useState } from "react"

// Baked into the JS bundle at build time by Vercel.
// In local dev this is undefined → banner never shows.
const BUILD_VERSION =
  process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID ?? "local"

// Check every 5 minutes — quiet background poll, doesn't hammer the server.
const INTERVAL_MS = 5 * 60 * 1000

export function UpdateBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Skip in local dev — no deployments to detect.
    if (BUILD_VERSION === "local") return

    const check = async () => {
      try {
        const res = await fetch("/api/app-version", { cache: "no-store" })
        if (!res.ok) return
        const { version } = (await res.json()) as { version: string }
        if (version && version !== BUILD_VERSION) setShow(true)
      } catch {
        // Network hiccup — stay silent, try again next interval.
      }
    }

    // First check after 5 min — no annoying flash on fresh load.
    const id = setInterval(check, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  if (!show) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex items-center gap-3
                 bg-background border border-foreground/10 rounded-2xl
                 px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.14)]"
    >
      <span className="text-[13px] font-medium text-foreground/70 whitespace-nowrap">
        New update is up.
      </span>
      <button
        onClick={() => window.location.reload()}
        className="px-3.5 py-1 rounded-full bg-[#5cb85c] text-white
                   text-[12px] font-semibold tracking-wide
                   hover:brightness-110 active:scale-95 transition-all"
      >
        Update now
      </button>
    </div>
  )
}
