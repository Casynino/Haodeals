"use client"

import { useEffect, useState } from "react"
import { Sparkles, Copy, Check, MessageCircle, Phone, Camera, Link2, X } from "lucide-react"
import { toast } from "sonner"

// ── Types ────────────────────────────────────────────────────────────────────

interface ShareButtonProps {
  productName: string
  productPath: string   // e.g. "/products/abc123"
}

type OptionId = "whatsapp" | "instagram" | "sms" | "copy"

// ── Share message templates (rotated randomly) ────────────────────────────────

const TEMPLATES = [
  (n: string, u: string) =>
    `🔥 Check this out!\n${n}\n\nAvailable now on Haodeals 👇\n${u}`,
  (n: string, u: string) =>
    `Hey 👀 you might like this!\n\n${n}\n\nGrab it here 👇\n${u}`,
  (n: string, u: string) =>
    `⚡ Don't miss this deal!\n\n${n}\n\nCheck it before it's gone 👇\n${u}`,
  (n: string, u: string) =>
    `✨ A product worth checking out\n\n${n}\n\nAvailable at Haodeals 👇\n${u}`,
  (n: string, u: string) =>
    `Check out this product 👇\n${n}\n${u}`,
]

function randomText(name: string, url: string): string {
  return TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)](name, url)
}

// ── Share option definitions ─────────────────────────────────────────────────

const OPTIONS: {
  id: OptionId; label: string; sub: string
  Icon: React.ElementType; iconCls: string; ringCls: string
}[] = [
  { id: "whatsapp",  label: "WhatsApp",  sub: "Send via WhatsApp",                Icon: MessageCircle, iconCls: "text-green-400/80", ringCls: "bg-green-400/[0.1]"   },
  { id: "instagram", label: "Instagram", sub: "Copy link to paste in Story or DM", Icon: Camera,        iconCls: "text-pink-400/80",  ringCls: "bg-pink-400/[0.1]"    },
  { id: "sms",       label: "SMS",       sub: "Send as a text message",            Icon: Phone,         iconCls: "text-blue-400/75",  ringCls: "bg-blue-400/[0.1]"    },
  { id: "copy",      label: "Copy Link", sub: "Email, notes, anywhere",            Icon: Copy,          iconCls: "text-foreground/50", ringCls: "bg-foreground/[0.06]" },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function ShareButton({ productName, productPath }: ShareButtonProps) {
  const [open, setOpen]       = useState(false)
  const [success, setSuccess] = useState(false)
  const [copied, setCopied]   = useState(false)
  const [fullUrl, setFullUrl] = useState("")

  useEffect(() => {
    setFullUrl(`${window.location.origin}${productPath}`)
  }, [productPath])

  // Auto-close success screen after 1.6s
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => { setOpen(false); setSuccess(false) }, 1600)
    return () => clearTimeout(t)
  }, [success])

  async function handleShareClick() {
    const url = fullUrl || `${window.location.origin}${productPath}`
    if (navigator.share) {
      try {
        await navigator.share({ title: productName, text: randomText(productName, url), url })
        toast.success("Shared! 🎉 Points coming soon", {
          description: "Earn rewards when the system launches",
        })
        return
      } catch { /* user cancelled */ }
    }
    setOpen(true)
  }

  // ── Share actions ────────────────────────────────────────────────────────

  function handleWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(randomText(productName, fullUrl))}`,
      "_blank", "noopener"
    )
    setSuccess(true)
  }

  function handleSMS() {
    window.open(
      `sms:?body=${encodeURIComponent(randomText(productName, fullUrl))}`,
      "_blank"
    )
    setSuccess(true)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      setSuccess(true)
    } catch {
      toast.error("Could not copy — try manually")
    }
  }

  function dispatch(id: OptionId) {
    if (id === "whatsapp") handleWhatsApp()
    else if (id === "sms") handleSMS()
    else handleCopy()  // "instagram" or "copy" — both copy the link
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Trigger pill ── */}
      <div className="flex flex-col items-end gap-0.5">
        <button
          type="button"
          onClick={handleShareClick}
          className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full
            bg-gradient-to-r from-violet-600/[0.14] to-indigo-600/[0.14]
            border border-violet-500/[0.26]
            hover:from-violet-600/[0.22] hover:to-indigo-600/[0.22]
            hover:border-violet-500/[0.44]
            hover:scale-[1.04] active:scale-[0.98]
            transition-all duration-200"
        >
          <Sparkles className="h-3 w-3 text-violet-400/80 group-hover:rotate-12 transition-transform duration-200" />
          <span className="text-[9px] tracking-widest font-bold text-violet-400/85">
            SHARE &amp; EARN
          </span>
        </button>
        <span className="text-[7px] tracking-wide text-foreground/25">
          Earn points when you share
        </span>
      </div>

      {/* ── Modal ── */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-[2px] flex items-end sm:items-center justify-center font-mono"
          onClick={() => !success && setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-background border-t border-x sm:border border-white/10 sm:rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {success ? (
              /* ── Success screen ── */
              <div className="py-14 px-8 flex flex-col items-center gap-4 text-center">
                <span className="text-5xl leading-none animate-bounce">🎉</span>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground/85">Shared successfully!</p>
                  <p className="text-[10px] text-foreground/38">Points coming soon 🎁</p>
                </div>
              </div>
            ) : (
              <>
                {/* ── Header ── */}
                <div className="flex items-start justify-between px-5 pt-5 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Sparkles className="h-3 w-3 text-violet-400/65" />
                      <p className="text-[8px] tracking-[0.2em] text-violet-400/58">SHARE &amp; EARN</p>
                    </div>
                    <p className="text-xs font-semibold text-foreground/78 max-w-[220px] truncate">
                      {productName}
                    </p>
                    <p className="text-[8px] text-foreground/28 mt-0.5">
                      Earn rewards every time you share
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-foreground/32 hover:text-foreground transition-colors p-1 -mr-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* ── URL strip ── */}
                <div className="mx-5 mb-3 flex items-center gap-2 border border-white/[0.07] bg-foreground/[0.018] px-3 py-2">
                  <Link2 className="h-3 w-3 text-foreground/22 shrink-0" />
                  <p className="text-[9px] text-foreground/28 truncate flex-1">{fullUrl}</p>
                </div>

                {/* ── Share options ── */}
                <div className="px-5 space-y-1.5">
                  {OPTIONS.map(({ id, label, sub, Icon, iconCls, ringCls }) => {
                    const done = copied && (id === "copy" || id === "instagram")
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => dispatch(id)}
                        className="w-full flex items-center gap-3 p-3 border border-white/[0.07] hover:border-white/16 hover:bg-foreground/[0.028] transition-all text-left"
                      >
                        <div className={`w-8 h-8 rounded-full ${ringCls} flex items-center justify-center shrink-0`}>
                          {done
                            ? <Check className="h-3.5 w-3.5 text-green-400/80" />
                            : <Icon className={`h-3.5 w-3.5 ${iconCls}`} />
                          }
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground/75">
                            {done ? "Copied!" : label}
                          </p>
                          <p className="text-[8px] text-foreground/30 mt-0.5">{sub}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* ── Points teaser ── */}
                <div className="m-5 flex items-center gap-2 border border-violet-500/[0.13] bg-violet-500/[0.04] px-3 py-2">
                  <Sparkles className="h-3 w-3 text-violet-400/50 shrink-0" />
                  <p className="text-[8px] text-violet-400/48 tracking-wide leading-relaxed">
                    Points system launching soon — your shares will be rewarded 🎁
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
