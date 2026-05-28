"use client"

import { AlertTriangle, CheckCircle2, Package, XCircle } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface StockBadgeProps {
  stock: number
  /** compact = product card (no icon, tighter size, no glow) */
  compact?: boolean
  className?: string
}

type Level = "out" | "critical" | "low" | "medium" | "good"

// ── Thresholds ────────────────────────────────────────────────────────────────

function getLevel(stock: number): Level {
  if (stock === 0)  return "out"
  if (stock <= 3)   return "critical"
  if (stock <= 10)  return "low"
  if (stock <= 20)  return "medium"
  return "good"
}

// ── Level config ──────────────────────────────────────────────────────────────

const LEVELS: Record<Level, {
  text:    (n: number) => string
  Icon:    React.ElementType
  pill:    string   // full badge (product page)
  chip:    string   // compact chip (product card)
  dot:     string   // dot color
  glow:    string   // subtle box-shadow (full only)
  ping:    boolean  // radar-ping dot animation
}> = {
  out: {
    text:  ()  => "Out of stock",
    Icon:  XCircle,
    pill:  "bg-red-500/[0.08] border-red-500/[0.20] text-red-400/75",
    chip:  "border-red-500/[0.20] text-red-400/65",
    dot:   "bg-red-400/50",
    glow:  "",
    ping:  false,
  },
  critical: {
    text:  (n) => `Only ${n} left`,
    Icon:  AlertTriangle,
    pill:  "bg-gradient-to-r from-red-500/[0.18] to-orange-500/[0.12] border-red-400/45 text-red-300/95",
    chip:  "border-red-400/35 text-red-400/85",
    dot:   "bg-red-400",
    glow:  "[box-shadow:0_0_12px_rgba(239,68,68,0.22)]",
    ping:  true,
  },
  low: {
    text:  (n) => `Only ${n} left`,
    Icon:  AlertTriangle,
    pill:  "bg-gradient-to-r from-orange-500/[0.14] to-amber-500/[0.10] border-orange-400/38 text-orange-300/90",
    chip:  "border-orange-400/30 text-orange-400/80",
    dot:   "bg-orange-400",
    glow:  "[box-shadow:0_0_10px_rgba(251,146,60,0.2)]",
    ping:  true,
  },
  medium: {
    text:  ()  => "Limited stock",
    Icon:  Package,
    pill:  "bg-amber-500/[0.08] border-amber-400/28 text-amber-300/85",
    chip:  "border-amber-400/24 text-amber-400/70",
    dot:   "bg-amber-400/75",
    glow:  "[box-shadow:0_0_8px_rgba(251,191,36,0.16)]",
    ping:  false,
  },
  good: {
    text:  ()  => "In stock",
    Icon:  CheckCircle2,
    pill:  "bg-green-500/[0.08] border-green-400/26 text-green-400/85",
    chip:  "border-green-400/22 text-green-400/65",
    dot:   "bg-green-400/70",
    glow:  "[box-shadow:0_0_8px_rgba(74,222,128,0.15)]",
    ping:  false,
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StockBadge({ stock, compact = false, className = "" }: StockBadgeProps) {
  const level = getLevel(stock)
  const cfg   = LEVELS[level]
  const Icon  = cfg.Icon

  // ── Compact chip (product cards) — dot + text only, no icon, no glow ────────
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-[2px] font-mono text-[7px] tracking-wide ${cfg.chip} ${className}`}>
        <span className="relative flex shrink-0 h-[5px] w-[5px]">
          {cfg.ping && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-50`} />
          )}
          <span className={`relative inline-flex rounded-full h-full w-full ${cfg.dot}`} />
        </span>
        <span>{cfg.text(stock)}</span>
      </div>
    )
  }

  // ── Full badge (product page) — dot + icon + text + glow ────────────────────
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] font-medium tracking-wide ${cfg.pill} ${cfg.glow} ${className}`}>
      <span className="relative flex shrink-0 h-[6px] w-[6px]">
        {cfg.ping && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-50`} />
        )}
        <span className={`relative inline-flex rounded-full h-full w-full ${cfg.dot}`} />
      </span>
      <Icon className="h-2.5 w-2.5 shrink-0" />
      <span>{cfg.text(stock)}</span>
    </div>
  )
}
