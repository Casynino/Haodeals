"use client"

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
