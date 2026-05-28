"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

function getTimeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1_000),
    ms: diff,
  }
}

const pad = (n: number) => n.toString().padStart(2, "0")

export function DealCountdown({ dealEndsAt }: { dealEndsAt?: string | null }) {
  const [left, setLeft] = useState(() =>
    dealEndsAt ? getTimeLeft(dealEndsAt) : null
  )

  useEffect(() => {
    if (!dealEndsAt) return
    setLeft(getTimeLeft(dealEndsAt))
    const id = setInterval(() => setLeft(getTimeLeft(dealEndsAt)), 1_000)
    return () => clearInterval(id)
  }, [dealEndsAt])

  if (!dealEndsAt || !left) return null

  const urgent = left.ms < 3_600_000 // < 1 hour — red

  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-2.5 border ${
        urgent
          ? "border-red-400/30 bg-red-400/[0.04]"
          : "border-yellow-400/25 bg-yellow-400/[0.03]"
      }`}
    >
      <Clock
        className={`h-3.5 w-3.5 shrink-0 ${urgent ? "text-red-400/70" : "text-yellow-400/65"}`}
      />
      <span
        className={`text-[9px] tracking-widest shrink-0 ${
          urgent ? "text-red-400/55" : "text-yellow-400/55"
        }`}
      >
        OFFER ENDS IN
      </span>
      <span
        className={`font-mono text-base font-bold tracking-widest ${
          urgent ? "text-red-400/85" : "text-yellow-400/85"
        }`}
      >
        {pad(left.h)}:{pad(left.m)}:{pad(left.s)}
      </span>
      {urgent && (
        <span className="ml-auto text-[8px] tracking-widest text-red-400/50 animate-pulse">
          HURRY!
        </span>
      )}
    </div>
  )
}
