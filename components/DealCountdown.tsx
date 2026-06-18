"use client"

import { useEffect, useState } from "react"

// ── Types ────────────────────────────────────────────────────────────────────

interface TimeLeft {
  d: number; h: number; m: number; s: number; ms: number
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
type Level = "critical" | "urgent" | "normal"

function getLevel(ms: number): Level {
  if (ms < 3_600_000)  return "critical"
  if (ms < 86_400_000) return "urgent"
  return "normal"
}

// ── Level config — very restrained, no heavy colours ─────────────────────────

type LevelCfg = {
  dot: string; pulse: boolean; border: string
  num: string; unitLbl: string; lbl: string; lblTxt: string
}

const LEVEL: Record<Level, LevelCfg> = {
  normal: {
    dot: "bg-emerald-400", pulse: false,
    border: "border-white/[0.07]",
    num: "text-foreground/90",
    unitLbl: "text-foreground/28",
    lbl: "text-foreground/35",
    lblTxt: "Deal Ends In",
  },
  urgent: {
    dot: "bg-amber-400", pulse: false,
    border: "border-amber-400/[0.18]",
    num: "text-foreground/90",
    unitLbl: "text-amber-400/40",
    lbl: "text-amber-400/55",
    lblTxt: "Deal Ends In",
  },
  critical: {
    dot: "bg-red-400", pulse: true,
    border: "border-red-500/[0.22]",
    num: "text-foreground/95",
    unitLbl: "text-red-400/45",
    lbl: "text-red-400/65",
    lblTxt: "Ends Soon",
  },
}

// ── Single digit cell ─────────────────────────────────────────────────────────

function DigitUnit({
  value, label, numCls, labelCls,
}: {
  value: string; label: string; numCls: string; labelCls: string
}) {
  return (
    <div className="flex flex-col items-center gap-[5px]">
      <span className={`font-mono text-[20px] font-semibold tabular-nums leading-none tracking-tight ${numCls}`}>
        {value}
      </span>
      <span className={`text-[7.5px] tracking-[0.13em] uppercase font-medium ${labelCls}`}>
        {label}
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

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

  const cfg = LEVEL[getLevel(left.ms)]

  return (
    <div
      className={`
        flex items-center justify-between
        rounded-xl border ${cfg.border}
        bg-foreground/[0.018]
        px-4 py-3
      `}
    >
      {/* Live indicator + label */}
      <div className="flex items-center gap-2">
        <span
          className={`
            h-[6px] w-[6px] rounded-full shrink-0
            ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}
          `}
        />
        <span className={`text-[12px] tracking-[0.16em] font-medium uppercase ${cfg.lbl}`}>
          {cfg.lblTxt}
        </span>
      </div>

      {/* Thin divider */}
      <div className="mx-4 h-5 w-px bg-white/[0.07] shrink-0" />

      {/* Digit units */}
      <div className="flex items-center gap-4">
        <DigitUnit value={pad(left.d)} label="Days"  numCls={cfg.num} labelCls={cfg.unitLbl} />
        <DigitUnit value={pad(left.h)} label="Hours" numCls={cfg.num} labelCls={cfg.unitLbl} />
        <DigitUnit value={pad(left.m)} label="Min"   numCls={cfg.num} labelCls={cfg.unitLbl} />
        <DigitUnit value={pad(left.s)} label="Sec"   numCls={cfg.num} labelCls={cfg.unitLbl} />
      </div>
    </div>
  )
}
