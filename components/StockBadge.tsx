"use client"

import { AlertTriangle, CheckCircle2, Package, XCircle } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface StockBadgeProps {
  stock: number
  /** compact = product card; default = product page (full glow + ping) */
  compact?: boolean
  className?: string
}

type Level = "out" | "critical" | "low" | "medium" | "good"

// ── Thresholds ────────────────────────────────────────────────────────────────

function getLevel(stock: number): Level {
  if (stock === 0)   return "out"
  if (stock <= 3)    return "critical"
  if (stock <= 10)   return "low"
  if (stock <= 20)   return "medium"
  return "good"
}

// ── Level config ──────────────────────────────────────────────────────────────

const LEVELS: Record<Level, {
  text:    (n: number) => string
  Icon:    React.ElementType
  pill:    string          // full badge classes (bg + border + text)
  compact: string          // compact variant classes
  dot:     string          // dot color
  glow:    string          // box-shadow arbitrary class (full only)
  ping:    boolean         // show radar-ping animation on dot
}> = {
  out: {
    text:    ()  => "OUT OF STOCK",
    Icon:    XCircle,
    pill:    "bg-red-500/[0.08] border-red-500/[0.22] text-red-400/75",
    compact: "bg-red-500/[0.07] border-red-500/[0.18] text-red-400/70",
    dot:     "bg-red-400/55",
    glow:    "",
    ping:    false,
  },
  critical: {
    text:    (n) => `ONLY ${n} LEFT`,
    Icon:    AlertTriangle,
    pill:    "bg-gradient-to-r from-red-500/[0.22] to-orange-600/[0.16] border-red-400/50 text-red-300",
    compact: "bg-gradient-to-r from-red-500/[0.16] to-orange-500/[0.12] border-red-400/38 text-red-300/90",
    dot:     "bg-red-400",
    glow:    "[box-shadow:0_0_18px_rgba(239,68,68,0.32),inset_0_0_10px_rgba(239,68,68,0.06)]",
    ping:    true,
  },
  low: {
    text:    (n) => `ONLY ${n} LEFT`,
    Icon:    AlertTriangle,
    pill:    "bg-gradient-to-r from-orange-500/[0.18] to-amber-500/[0.13] border-orange-400/42 text-orange-300",
    compact: "bg-gradient-to-r from-orange-500/[0.12] to-amber-500/[0.09] border-orange-400/30 text-orange-300/85",
    dot:     "bg-orange-400",
    glow:    "[box-shadow:0_0_14px_rgba(251,146,60,0.28),inset_0_0_8px_rgba(251,146,60,0.05)]",
    ping:    true,
  },
  medium: {
    text:    ()  => "LIMITED STOCK",
    Icon:    Package,
    pill:    "bg-gradient-to-r from-amber-500/[0.14] to-yellow-500/[0.10] border-amber-400/30 text-amber-300/90",
    compact: "bg-gradient-to-r from-amber-500/[0.10] to-yellow-500/[0.07] border-amber-400/24 text-amber-300/80",
    dot:     "bg-amber-400/80",
    glow:    "[box-shadow:0_0_10px_rgba(251,191,36,0.22)]",
    ping:    false,
  },
  good: {
    text:    ()  => "IN STOCK",
    Icon:    CheckCircle2,
    pill:    "bg-gradient-to-r from-green-500/[0.14] to-emerald-500/[0.10] border-green-400/30 text-green-300/90",
    compact: "bg-gradient-to-r from-green-500/[0.10] to-emerald-500/[0.07] border-green-400/24 text-green-300/80",
    dot:     "bg-green-400/75",
    glow:    "[box-shadow:0_0_10px_rgba(74,222,128,0.2)]",
    ping:    false,
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StockBadge({ stock, compact = false, className = "" }: StockBadgeProps) {
  const level = getLevel(stock)
  const cfg   = LEVELS[level]
  const Icon  = cfg.Icon

  const pillCls = compact ? cfg.compact : cfg.pill
  const glowCls = compact ? ""           : cfg.glow

  return (
    <div className={`
      inline-flex items-center gap-1.5 rounded-full border font-mono font-semibold tracking-wider
      ${compact ? "px-2 py-[3px] text-[8px]" : "px-3 py-1.5 text-[10px]"}
      ${pillCls} ${glowCls} ${className}
    `}>
      {/* ── Ping dot ── */}
      <span className="relative flex shrink-0" style={{ width: compact ? 6 : 7, height: compact ? 6 : 7 }}>
        {cfg.ping && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-55`} />
        )}
        <span className={`relative inline-flex rounded-full h-full w-full ${cfg.dot}`} />
      </span>

      {/* ── Icon ── */}
      <Icon className={compact ? "h-2.5 w-2.5 shrink-0" : "h-3 w-3 shrink-0"} />

      {/* ── Label ── */}
      <span>{cfg.text(stock)}</span>
    </div>
  )
}
