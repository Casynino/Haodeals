"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  CreditCard, Package, Truck, Home,
  CheckCircle2, XCircle, RefreshCw,
} from "lucide-react"
import type { TrackingEvent } from "@/types"
import { statusToDisplayStage } from "@/lib/order-labels"

/* ── Display stage definitions ─────────────────────────────────── */
const STAGES = [
  { id: "payment",   label: "Payment Confirmed",     sublabel: "Order accepted",       icon: CreditCard },
  { id: "packaging", label: "Packaging",             sublabel: "Preparing your order", icon: Package },
  { id: "transit",   label: "In Transit",            sublabel: "On the way to you",    icon: Truck },
  { id: "delivered", label: "Delivered",             sublabel: "Enjoy your order!",    icon: Home },
]

/* ── Exception states ──────────────────────────────────────────── */
const EXCEPTIONS: Record<string, { label: string; color: string; bg: string }> = {
  cancelled:         { label: "Order Cancelled",   color: "#ef4444", bg: "rgba(239,68,68,0.06)"  },
  refund_processing: { label: "Refund Processing", color: "#f97316", bg: "rgba(249,115,22,0.06)" },
  refunded:          { label: "Refund Completed",  color: "#22c55e", bg: "rgba(34,197,94,0.06)"  },
}

/* ── Stage scene components ────────────────────────────────────── */

function PaymentScene() {
  return (
    <motion.div
      key="payment"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-4 py-6"
    >
      <div className="relative">
        {/* Outer pulse ring */}
        <motion.div
          className="absolute inset-0 border border-blue-400/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="w-16 h-16 border border-blue-400/40 flex items-center justify-center bg-blue-400/5"
          animate={{ boxShadow: ["0 0 0 rgba(96,165,250,0)", "0 0 20px rgba(96,165,250,0.3)", "0 0 0 rgba(96,165,250,0)"] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <CheckCircle2 className="w-8 h-8 text-blue-400/80" />
        </motion.div>
      </div>
      <div className="text-center">
        <p className="text-[13px] font-bold text-blue-400/90 tracking-wider">PAYMENT RECEIVED</p>
        <p className="text-[12px] text-foreground/40 mt-1 leading-relaxed max-w-[220px] mx-auto">
          Great news! We have received your payment and your order is confirmed.
        </p>
      </div>
    </motion.div>
  )
}

function PackagingScene() {
  return (
    <motion.div
      key="packaging"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-4 py-6"
    >
      <div className="relative w-16 h-16">
        {/* Box with packing animation */}
        <motion.div
          className="w-16 h-16 border border-yellow-400/40 flex items-center justify-center bg-yellow-400/5"
          animate={{ rotate: [-2, 2, -2], scale: [1, 1.04, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Package className="w-8 h-8 text-yellow-400/80" />
        </motion.div>
        {/* Floating sparkles */}
        {[
          { top: "10%",  left: "-20%", delay: 0    },
          { top: "-5%",  left: "85%",  delay: 0.5  },
          { top: "70%",  left: "95%",  delay: 1.0  },
          { top: "80%",  left: "-15%", delay: 1.5  },
        ].map((s, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-yellow-400/70"
            style={{ top: s.top, left: s.left }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: s.delay }}
          />
        ))}
      </div>
      <div className="text-center">
        <p className="text-[13px] font-bold text-yellow-400/90 tracking-wider">PACKAGING</p>
        <div className="flex items-center justify-center gap-0.5 mt-1">
          <span className="text-[12px] text-foreground/40">Your order is being packed</span>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="text-yellow-400/60 text-[13px] font-bold"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
            >
              .
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function TransitScene() {
  return (
    <motion.div
      key="transit"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-4 py-4"
    >
      {/* Road with moving vehicle */}
      <div className="w-full relative h-20 overflow-hidden">
        {/* Sky gradient */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(168,85,247,0.04) 100%)" }} />

        {/* Road surface */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-foreground/[0.04] border-t border-white/5" />

        {/* Road center dashes */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center px-4 gap-3">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="flex-1 h-px bg-foreground/10" />
          ))}
        </div>

        {/* Moving truck */}
        <motion.div
          className="absolute bottom-2 flex items-end gap-1"
          animate={{ x: ["-80px", "110%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        >
          {/* Speed lines */}
          <div className="flex flex-col gap-0.5 mb-1 opacity-50">
            <motion.div
              className="h-px bg-purple-400/60"
              animate={{ width: ["12px", "6px", "12px"] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            <motion.div
              className="h-px bg-purple-400/40"
              animate={{ width: ["8px", "4px", "8px"] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
            />
          </div>
          {/* Truck bouncing while it drives */}
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Truck className="w-8 h-8 text-purple-400/90" />
          </motion.div>
        </motion.div>

        {/* Destination pin (right side) */}
        <div className="absolute bottom-2 right-6 flex flex-col items-center gap-0.5">
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Home className="w-5 h-5 text-foreground/20" />
          </motion.div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[13px] font-bold text-purple-400/90 tracking-wider">IN TRANSIT</p>
        <p className="text-[12px] text-foreground/40 mt-1">Your package is on its way to you!</p>
      </div>
    </motion.div>
  )
}

function DeliveredScene() {
  const stars = [
    { tx: "18px",  ty: "-22px", delay: 0    },
    { tx: "-20px", ty: "-18px", delay: 0.25 },
    { tx: "22px",  ty: "10px",  delay: 0.5  },
    { tx: "-16px", ty: "14px",  delay: 0.15 },
    { tx: "4px",   ty: "-28px", delay: 0.4  },
    { tx: "28px",  ty: "-6px",  delay: 0.6  },
  ]

  return (
    <motion.div
      key="delivered"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
      className="flex flex-col items-center gap-4 py-6"
    >
      <div className="relative w-16 h-16">
        <motion.div
          className="w-16 h-16 border border-green-400/40 flex items-center justify-center bg-green-400/5"
          animate={{ boxShadow: ["0 0 0 rgba(74,222,128,0)", "0 0 24px rgba(74,222,128,0.35)", "0 0 0 rgba(74,222,128,0)"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Home className="w-8 h-8 text-green-400/80" />
        </motion.div>

        {/* Burst stars */}
        {stars.map((s, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-green-400/80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ ["--tx" as string]: s.tx, ["--ty" as string]: s.ty } as React.CSSProperties}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: [0, parseInt(s.tx)], y: [0, parseInt(s.ty)] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: s.delay }}
          />
        ))}

        {/* Badge */}
        <motion.div
          className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-background border border-green-400/50 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        </motion.div>
      </div>

      <div className="text-center">
        <p className="text-[13px] font-bold text-green-400/90 tracking-wider">DELIVERED!</p>
        <p className="text-[12px] text-foreground/40 mt-1">
          Your order has been delivered. Thank you for shopping with us!
        </p>
      </div>
    </motion.div>
  )
}

/* ── Exception scene ───────────────────────────────────────────── */
function ExceptionScene({ status }: { status: string }) {
  const exc = EXCEPTIONS[status]
  const isRefunded = status === "refunded"

  return (
    <motion.div
      key="exception"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-3 py-5 px-4"
    >
      <div
        className="w-14 h-14 border flex items-center justify-center"
        style={{ borderColor: exc?.color + "40", background: exc?.bg }}
      >
        {isRefunded
          ? <CheckCircle2 className="w-7 h-7" style={{ color: exc?.color }} />
          : status === "refund_processing"
          ? <RefreshCw className="w-7 h-7 animate-spin" style={{ color: exc?.color }} />
          : <XCircle className="w-7 h-7" style={{ color: exc?.color }} />
        }
      </div>
      <div className="text-center">
        <p className="text-[13px] font-bold tracking-wider" style={{ color: exc?.color }}>
          {exc?.label.toUpperCase()}
        </p>
      </div>
    </motion.div>
  )
}

/* ── Timeline dots ─────────────────────────────────────────────── */
function Timeline({ currentStage, isException }: { currentStage: number; isException: boolean }) {
  return (
    <div className="flex items-center justify-between px-6 pb-5 relative">
      {/* Track line */}
      <div className="absolute left-6 right-6 top-3.5 h-px bg-white/8" />
      {/* Fill */}
      <motion.div
        className="absolute left-6 top-3.5 h-px"
        style={{ background: "linear-gradient(90deg, #22c55e, rgba(238,0,0,0.5))" }}
        initial={{ width: "0%" }}
        animate={{
          width: isException ? "25%" : currentStage < 0 ? "0%" :
            `${Math.min(100, (currentStage / (STAGES.length - 1)) * 100)}%`,
        }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
      />

      {STAGES.map((stage, idx) => {
        const isCompleted = !isException && currentStage > idx
        const isCurrent   = !isException && currentStage === idx

        return (
          <div key={stage.id} className="relative z-10 flex flex-col items-center gap-1.5">
            {/* Node */}
            <div
              className="w-7 h-7 border flex items-center justify-center transition-all duration-300"
              style={{
                borderColor:
                  isCurrent   ? "#ee0000"
                  : isCompleted ? "rgba(34,197,94,0.6)"
                  : "rgba(255,255,255,0.12)",
                background:
                  isCurrent   ? "rgba(238,0,0,0.12)"
                  : isCompleted ? "rgba(34,197,94,0.08)"
                  : "transparent",
                boxShadow: isCurrent ? "0 0 10px rgba(238,0,0,0.4)" : "none",
              }}
            >
              {isCompleted
                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400/80" />
                : <stage.icon className="w-3 h-3" style={{ color: isCurrent ? "#ee0000" : "rgba(255,255,255,0.2)" }} />
              }
              {isCurrent && (
                <span
                  className="absolute w-7 h-7 animate-tracker-ping"
                  style={{ background: "rgba(238,0,0,0.08)" }}
                />
              )}
            </div>
            {/* Label */}
            <p
              className="text-[10px] tracking-wide text-center leading-tight"
              style={{
                color: isCurrent ? "#ee0000" : isCompleted ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.18)",
                maxWidth: "56px",
              }}
            >
              {stage.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

/* ── Event log (collapsed) ─────────────────────────────────────── */
function EventLog({ events }: { events: TrackingEvent[] }) {
  if (events.length === 0) return null

  return (
    <div className="border-t border-white/8 px-5 py-4">
      <p className="text-[10px] tracking-[0.3em] text-foreground/25 mb-3">UPDATES</p>
      <div className="space-y-3">
        {[...events].reverse().map((event) => {
          const d = new Date(event.createdAt)
          const time = d.toLocaleString("en-US", {
            month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
            hour12: true,
          })
          return (
            <div key={event.id} className="flex gap-3">
              <span className="text-[10px] text-foreground/20 flex-shrink-0 w-28 leading-snug pt-px">{time}</span>
              <p className="text-[12px] text-foreground/55 leading-relaxed">{event.message}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Main component ────────────────────────────────────────────── */
interface OrderTrackerProps {
  status: string
  trackingId?: string | null
  trackingEvents: TrackingEvent[]
  createdAt: string
  orderId: string
}

export default function OrderTracker({
  status,
  trackingId,
  trackingEvents,
  orderId,
}: OrderTrackerProps) {
  const displayStage = statusToDisplayStage(status)
  const isExcept = displayStage === -1

  const sceneKey = isExcept ? "exception" :
    displayStage === 0 ? "payment" :
    displayStage === 1 ? "packaging" :
    displayStage === 2 ? "transit" : "delivered"

  return (
    <div className="relative overflow-hidden">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none z-10 animate-tracker-scan"
        style={{ background: "linear-gradient(90deg, transparent, rgba(238,0,0,0.35), transparent)" }}
      />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 px-5 pt-5 pb-4 border-b border-white/8"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-foreground/25 mb-0.5">TRACKING NUMBER</p>
            <p
              className="text-lg font-black tracking-widest"
              style={{
                color: "#ee0000",
                textShadow: "0 0 16px rgba(238,0,0,0.4)",
              }}
            >
              {trackingId ?? `#${orderId.slice(0, 8).toUpperCase()}`}
            </p>
          </div>
          <div className="text-right mt-1">
            <p className="text-[11px] text-foreground/30 tracking-wider">
              {isExcept
                ? <span style={{ color: EXCEPTIONS[status]?.color }}>
                    {EXCEPTIONS[status]?.label}
                  </span>
                : displayStage >= 0
                  ? `${displayStage + 1} of ${STAGES.length}`
                  : "Processing"
              }
            </p>
            {!isExcept && displayStage >= 0 && (
              <p className="text-[10px] text-foreground/20 mt-0.5">{STAGES[displayStage]?.sublabel}</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-px bg-white/8 relative overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{
              background: isExcept
                ? EXCEPTIONS[status]?.color
                : "linear-gradient(90deg, #22c55e, #ee0000)",
            }}
            initial={{ width: "0%" }}
            animate={{
              width: isExcept ? "25%" :
                displayStage < 0 ? "2%" :
                `${Math.round(((displayStage + 1) / STAGES.length) * 100)}%`,
            }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        </div>
      </motion.div>

      {/* ── Stage scene ── */}
      <div className="relative z-20 min-h-[148px] flex items-center justify-center border-b border-white/8 bg-foreground/[0.01] px-5">
        <AnimatePresence mode="wait">
          {isExcept
            ? <ExceptionScene key="exc" status={status} />
            : sceneKey === "payment"   ? <PaymentScene />
            : sceneKey === "packaging" ? <PackagingScene />
            : sceneKey === "transit"   ? <TransitScene />
            : <DeliveredScene />
          }
        </AnimatePresence>
      </div>

      {/* ── Timeline dots ── */}
      {!isExcept && (
        <div className="relative z-20 pt-5 border-b border-white/8">
          <Timeline currentStage={displayStage} isException={isExcept} />
        </div>
      )}

      {/* ── Event log ── */}
      <div className="relative z-20">
        <EventLog events={trackingEvents} />
      </div>
    </div>
  )
}
