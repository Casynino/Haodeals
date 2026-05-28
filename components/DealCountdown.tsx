"use client"

import { useEffect, useState } from "react"
import { Zap, Flame } from "lucide-react"

interface TimeLeft {
  d: number
  h: number
  m: number
  s: number
  ms: number
}

function getTimeLeft(endsAt: string): TimeLeft | null {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    d:  Math.floor(diff / 86_400_000),
    h:  Math.floor((diff % 86_400_000) / 3_600_000),
    m:  Math.floor((diff % 3_600_000)  / 60_000),
    s:  Math.floor((diff % 60_000)     / 1_000),
    ms: diff,
  }
}

const pad = (n: number) => n.toString().padStart(2, "0")

// ── Urgency thresholds ──────────────────────────────────────────────────────
// critical: < 1 hour   → red + pulsing
// urgent:   < 24 hours → orange
// normal:   ≥ 24 hours → yellow

type Level = "critical" | "urgent" | "normal"

function getLevel(ms: number): Level {
  if (ms < 3_600_000)   return "critical"
  if (ms < 86_400_000)  return "urgent"
  return "normal"
}

const LEVEL_STYLES: Record<Level, {
  border: string
  bg: string
  label: string
  labelColor: string
  numColor: string
  unitColor: string
  tagText: string
  tagColor: string
  Icon: React.ElementType
}> = {
  normal: {
    border:     "border-yellow-400/25",
    bg:         "bg-yellow-400/[0.03]",
    label:      "LIMITED TIME DEAL",
    labelColor: "text-yellow-400/65",
    numColor:   "text-yellow-400/90",
    unitColor:  "text-yellow-400/40",
    tagText:    "DEAL ACTIVE",
    tagColor:   "text-yellow-400/55 border-yellow-400/25",
    Icon:       Zap,
  },
  urgent: {
    border:     "border-orange-400/30",
    bg:         "bg-orange-400/[0.04]",
    label:      "DEAL ENDING SOON",
    labelColor: "text-orange-400/75",
    numColor:   "text-orange-400/95",
    unitColor:  "text-orange-400/45",
    tagText:    "24 HOURS ONLY",
    tagColor:   "text-orange-400/65 border-orange-400/30",
    Icon:       Flame,
  },
  critical: {
    border:     "border-red-400/35",
    bg:         "bg-red-400/[0.05]",
    label:      "HURRY — DEAL EXPIRING!",
    labelColor: "text-red-400/85",
    numColor:   "text-red-400/95",
    unitColor:  "text-red-400/50",
    tagText:    "LAST CHANCE",
    tagColor:   "text-red-400/70 border-red-400/35 animate-pulse",
    Icon:       Flame,
  },
}

// ── Single unit block ────────────────────────────────────────────────────────

function UnitBlock({
  value,
  label,
  numColor,
  unitColor,
  border,
}: {
  value: string
  label: string
  numColor: string
  unitColor: string
  border: string
}) {
  return (
    <div className={`flex flex-col items-center border ${border} bg-background/60 px-2.5 py-2 min-w-[46px]`}>
      <span className={`font-mono text-xl font-black leading-none tracking-widest ${numColor}`}>
        {value}
      </span>
      <span className={`text-[7px] tracking-[0.2em] mt-1 ${unitColor}`}>{label}</span>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function DealCountdown({ dealEndsAt }: { dealEndsAt?: string | null }) {
  const [left, setLeft] = useState<TimeLeft | null>(() =>
    dealEndsAt ? getTimeLeft(dealEndsAt) : null
  )

  useEffect(() => {
    if (!dealEndsAt) return
    setLeft(getTimeLeft(dealEndsAt))
    const id = setInterval(() => setLeft(getTimeLeft(dealEndsAt)), 1_000)
    return () => clearInterval(id)
  }, [dealEndsAt])

  if (!dealEndsAt || !left) return null

  const level = getLevel(left.ms)
  const s = LEVEL_STYLES[level]
  const Icon = s.Icon

  return (
    <div className={`border ${s.border} ${s.bg} p-3.5 space-y-3`}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Icon className={`h-3.5 w-3.5 ${s.labelColor} ${level === "critical" ? "animate-pulse" : ""}`} />
          <span className={`text-[9px] tracking-[0.2em] font-bold ${s.labelColor}`}>
            {s.label}
          </span>
        </div>
        <span className={`text-[8px] tracking-widest border px-2 py-0.5 ${s.tagColor}`}>
          {s.tagText}
        </span>
      </div>

      {/* Countdown blocks */}
      <div className="flex items-stretch gap-1.5">
        <UnitBlock value={pad(left.d)} label="DAYS"  numColor={s.numColor} unitColor={s.unitColor} border={s.border} />
        <div className={`flex items-center pb-3 text-lg font-bold ${s.numColor} opacity-40`}>:</div>
        <UnitBlock value={pad(left.h)} label="HRS"   numColor={s.numColor} unitColor={s.unitColor} border={s.border} />
        <div className={`flex items-center pb-3 text-lg font-bold ${s.numColor} opacity-40`}>:</div>
        <UnitBlock value={pad(left.m)} label="MIN"   numColor={s.numColor} unitColor={s.unitColor} border={s.border} />
        <div className={`flex items-center pb-3 text-lg font-bold ${s.numColor} opacity-40`}>:</div>
        <UnitBlock value={pad(left.s)} label="SEC"   numColor={s.numColor} unitColor={s.unitColor} border={s.border} />
      </div>

      {/* Urgency sub-line */}
      <p className={`text-[8px] tracking-widest ${s.unitColor}`}>
        {level === "normal"  && "Few customers will access this price. Act now."}
        {level === "urgent"  && "Deal expires in less than 24 hours — available for a short time only."}
        {level === "critical" && "This offer expires very soon. This may be your last chance."}
      </p>
    </div>
  )
}
