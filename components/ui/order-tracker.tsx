"use client"

import { motion } from "framer-motion"
import {
  CreditCard,
  ClipboardCheck,
  Package,
  Archive,
  Truck,
  Navigation2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  type LucideIcon,
} from "lucide-react"
import type { TrackingEvent } from "@/types"

/* ── Stage definitions ─────────────────────────────── */
interface Stage {
  key: string
  label: string
  icon: LucideIcon
  desc: string
}

const DELIVERY_STAGES: Stage[] = [
  { key: "payment_confirmed",  label: "Payment Confirmed",     icon: CreditCard,     desc: "Payment processed successfully" },
  { key: "order_received",     label: "Order Received",        icon: ClipboardCheck, desc: "Your order is in our system" },
  { key: "packaging",          label: "Packaging in Progress", icon: Package,        desc: "Items are being carefully packed" },
  { key: "ready_for_delivery", label: "Ready for Delivery",    icon: Archive,        desc: "Package is ready to ship" },
  { key: "in_transit",         label: "In Transit",            icon: Truck,          desc: "Package is on its way to you" },
  { key: "out_for_delivery",   label: "Out for Delivery",      icon: Navigation2,    desc: "Driver is heading your way" },
  { key: "delivered",          label: "Delivered",             icon: CheckCircle2,   desc: "Package has been delivered" },
]

const EXCEPTION_STATUSES: Record<string, { label: string; icon: LucideIcon; color: string; bg: string }> = {
  cancelled:         { label: "Order Cancelled",   icon: XCircle,    color: "#ef4444", bg: "rgba(239,68,68,0.08)"   },
  refund_processing: { label: "Refund Processing", icon: RefreshCw,  color: "#f97316", bg: "rgba(249,115,22,0.08)"  },
  refunded:          { label: "Refund Completed",  icon: CheckCircle2, color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
}

/* ── Helpers ──────────────────────────────────────── */
function stageIndex(status: string): number {
  return DELIVERY_STAGES.findIndex((s) => s.key === status)
}

function isException(status: string): boolean {
  return status in EXCEPTION_STATUSES
}

function formatEventTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    hour12: true,
  })
}

/* ── Props ────────────────────────────────────────── */
interface OrderTrackerProps {
  status: string
  trackingId?: string | null
  trackingEvents: TrackingEvent[]
  createdAt: string
  orderId: string
}

/* ── Component ────────────────────────────────────── */
export default function OrderTracker({
  status,
  trackingId,
  trackingEvents,
  createdAt,
  orderId,
}: OrderTrackerProps) {
  const currentIdx  = stageIndex(status)
  const isExcept    = isException(status)
  // For exception statuses, find where the order was before it got cancelled/refunded
  const lastNormalIdx = isExcept
    ? DELIVERY_STAGES.findIndex((s) => {
        const lastNormal = [...trackingEvents]
          .reverse()
          .find((e) => stageIndex(e.status) >= 0)
        return lastNormal ? s.key === lastNormal.status : false
      })
    : -1

  const exceptData = isExcept ? EXCEPTION_STATUSES[status] : null

  /* ── Animation variants ─────────────────────────── */
  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  }
  const stageVariants = {
    hidden: { opacity: 0, x: -16 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.25, 0, 0, 1] as [number, number, number, number] } },
  }

  /* ── Progress percentage for the vertical fill ──── */
  const progress = isExcept
    ? (lastNormalIdx >= 0 ? ((lastNormalIdx + 1) / DELIVERY_STAGES.length) * 100 : 0)
    : currentIdx >= 0
      ? ((currentIdx + 1) / DELIVERY_STAGES.length) * 100
      : 0

  return (
    <div className="relative font-mono overflow-hidden">
      {/* Grid dot background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none z-10 animate-tracker-scan"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(238,0,0,0.4), transparent)",
        }}
      />

      {/* Header ─ tracking ID */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-20 px-6 pt-6 pb-5 border-b border-white/10"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[9px] tracking-[0.3em] text-foreground/30 mb-1">TRACKING NUMBER</p>
            <p
              className="text-xl font-black tracking-widest"
              style={{
                color: "#ee0000",
                textShadow: "0 0 20px rgba(238,0,0,0.4), 0 0 40px rgba(238,0,0,0.15)",
              }}
            >
              {trackingId ?? `#${orderId.slice(0, 8).toUpperCase()}`}
            </p>
          </div>

          <div className="text-right space-y-1">
            <p className="text-[9px] tracking-widest text-foreground/30">
              {isExcept
                ? <span style={{ color: exceptData?.color }}>{exceptData?.label.toUpperCase()}</span>
                : currentIdx >= 0
                  ? `${currentIdx + 1} / ${DELIVERY_STAGES.length} STAGES`
                  : "PROCESSING"}
            </p>
            {status === "delivered" && (
              <p className="text-[9px] text-green-400/70 tracking-widest">COMPLETE</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-px bg-white/10 relative overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{ background: isExcept ? exceptData?.color : "linear-gradient(90deg, #ee0000, rgba(238,0,0,0.4))" }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Exception banner */}
      {isExcept && exceptData && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mx-6 mt-4 px-4 py-3 border flex items-center gap-3"
          style={{ borderColor: exceptData.color + "40", background: exceptData.bg }}
        >
          <exceptData.icon className="h-4 w-4 flex-shrink-0" style={{ color: exceptData.color }} />
          <div>
            <p className="text-[10px] font-bold tracking-widest" style={{ color: exceptData.color }}>
              {exceptData.label.toUpperCase()}
            </p>
            {trackingEvents.length > 0 && (
              <p className="text-[9px] text-foreground/50 mt-0.5">
                {trackingEvents[trackingEvents.length - 1].message}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Timeline ─────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-20 px-6 py-6"
      >
        {DELIVERY_STAGES.map((stage, idx) => {
          const isCompleted = !isExcept && currentIdx > idx
          const isCurrent   = !isExcept && currentIdx === idx
          const isPast      = isExcept && lastNormalIdx >= idx
          const isFuture    = !isCompleted && !isCurrent && !isPast

          // Find matching tracking event for timestamp
          const event = trackingEvents.find((e) => e.status === stage.key)

          return (
            <motion.div key={stage.key} variants={stageVariants} className="flex gap-4">
              {/* Left column: node + connector */}
              <div className="flex flex-col items-center flex-shrink-0 w-8">
                {/* Node */}
                <div className="relative flex items-center justify-center">
                  {/* Ping ring on current */}
                  {isCurrent && (
                    <span
                      className="absolute inline-flex h-8 w-8 animate-tracker-ping"
                      style={{ background: "rgba(238,0,0,0.15)", borderRadius: "0" }}
                    />
                  )}
                  <div
                    className="relative z-10 flex items-center justify-center w-7 h-7 transition-all duration-300"
                    style={{
                      border: `1px solid ${
                        isCurrent   ? "#ee0000"
                        : isCompleted || isPast ? "rgba(34,197,94,0.6)"
                        : "rgba(255,255,255,0.15)"
                      }`,
                      background:
                        isCurrent   ? "rgba(238,0,0,0.12)"
                        : isCompleted || isPast ? "rgba(34,197,94,0.08)"
                        : "transparent",
                      ...(isCurrent ? {
                        boxShadow: "0 0 8px rgba(238,0,0,0.5), 0 0 16px rgba(238,0,0,0.2)",
                        animation: "tracker-glow 2s ease-in-out infinite",
                      } : {}),
                    }}
                  >
                    <stage.icon
                      className="h-3 w-3"
                      style={{
                        color: isCurrent   ? "#ee0000"
                               : isCompleted || isPast ? "rgba(34,197,94,0.8)"
                               : "rgba(255,255,255,0.2)",
                      }}
                    />
                  </div>
                </div>

                {/* Connector line */}
                {idx < DELIVERY_STAGES.length - 1 && (
                  <div className="relative w-px flex-1 my-1" style={{ minHeight: "32px", background: "rgba(255,255,255,0.08)" }}>
                    {(isCompleted || isPast) && (
                      <motion.div
                        className="absolute inset-x-0 top-0"
                        style={{ background: "rgba(34,197,94,0.4)" }}
                        initial={{ height: "0%" }}
                        animate={{ height: "100%" }}
                        transition={{ duration: 0.5, delay: idx * 0.08 + 0.4 }}
                      />
                    )}
                    {isCurrent && (
                      <div
                        className="absolute inset-x-0 top-0 h-full"
                        style={{
                          background: "linear-gradient(to bottom, rgba(238,0,0,0.3), transparent)",
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Right column: content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className="text-[11px] tracking-wider font-bold leading-tight"
                      style={{
                        color: isCurrent   ? "#ee0000"
                               : isCompleted || isPast ? "rgba(255,255,255,0.8)"
                               : "rgba(255,255,255,0.2)",
                      }}
                    >
                      {stage.label.toUpperCase()}
                    </p>
                    <p
                      className="text-[9px] mt-0.5 leading-relaxed"
                      style={{
                        color: isCurrent   ? "rgba(238,0,0,0.6)"
                               : isCompleted || isPast ? "rgba(255,255,255,0.3)"
                               : "rgba(255,255,255,0.1)",
                      }}
                    >
                      {event?.message ?? (isFuture ? stage.desc : stage.desc)}
                    </p>
                  </div>
                  {event && (
                    <p className="text-[8px] text-foreground/25 flex-shrink-0 text-right leading-tight mt-0.5">
                      {formatEventTime(event.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Recent events log ──────────────────────────── */}
      {trackingEvents.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="border-t border-white/10 px-6 py-5"
        >
          <p className="text-[8px] tracking-[0.3em] text-foreground/30 mb-3">EVENT LOG</p>
          <div className="space-y-2">
            {[...trackingEvents].reverse().map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <span className="text-[8px] text-foreground/20 flex-shrink-0 mt-0.5 w-28 leading-tight">
                  {formatEventTime(event.createdAt)}
                </span>
                <span className="text-[9px] text-foreground/50 leading-relaxed">{event.message}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
