"use client"

import { useEffect, useState } from "react"
import { RotateCw } from "lucide-react"

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
    <button
      role="status"
      aria-live="polite"
      onClick={() => window.location.reload()}
      className="fixed top-4 right-4 z-[9999] flex items-center gap-2.5
                 bg-background border border-foreground/10 rounded-2xl
                 px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.14)]
                 hover:bg-foreground/[0.03] active:scale-[0.98] transition-all cursor-pointer"
    >
      <span className="text-[13px] font-medium text-foreground/70 whitespace-nowrap">
        New update is up
      </span>
      <RotateCw className="h-3.5 w-3.5 text-foreground/40 flex-shrink-0" />
    </button>
  )
}
