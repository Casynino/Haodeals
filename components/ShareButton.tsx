"use client"

import { useEffect, useState } from "react"
import { Share2, Copy, Check, MessageCircle, Phone, Camera, Link2, X } from "lucide-react"
import { toast } from "sonner"

interface ShareButtonProps {
  productName: string
  productPath: string   // e.g. "/products/abc123"
}

type OptionId = "whatsapp" | "instagram" | "sms" | "copy"

interface ShareOption {
  id: OptionId
  label: string
  sub: string
  Icon: React.ElementType
  iconCls: string
  ringCls: string
}

const OPTIONS: ShareOption[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    sub: "Send via WhatsApp",
    Icon: MessageCircle,
    iconCls: "text-green-400/80",
    ringCls: "bg-green-400/[0.1]",
  },
  {
    id: "instagram",
    label: "Instagram",
    sub: "Copy link to paste in Story or DM",
    Icon: Camera,
    iconCls: "text-pink-400/80",
    ringCls: "bg-pink-400/[0.1]",
  },
  {
    id: "sms",
    label: "SMS",
    sub: "Send as a text message",
    Icon: Phone,
    iconCls: "text-blue-400/75",
    ringCls: "bg-blue-400/[0.1]",
  },
  {
    id: "copy",
    label: "Copy Link",
    sub: "Email, notes, anywhere",
    Icon: Copy,
    iconCls: "text-foreground/50",
    ringCls: "bg-foreground/[0.06]",
  },
]

export function ShareButton({ productName, productPath }: ShareButtonProps) {
  const [open, setOpen]     = useState(false)
  const [copied, setCopied] = useState(false)
  const [fullUrl, setFullUrl] = useState("")

  useEffect(() => {
    setFullUrl(`${window.location.origin}${productPath}`)
  }, [productPath])

  const shareText = `Check out this deal 🔥\n${productName}\n\nAvailable at Haodeals 👇`

  async function handleShareClick() {
    const url = fullUrl || `${window.location.origin}${productPath}`
    if (navigator.share) {
      try {
        await navigator.share({ title: productName, text: shareText, url })
        return
      } catch {
        // user cancelled or unsupported — fall through to modal
      }
    }
    setOpen(true)
  }

  function handleWhatsApp() {
    const url = fullUrl
    const msg = encodeURIComponent(`${shareText}\n${url}`)
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener")
    setOpen(false)
  }

  function handleSMS() {
    const url = fullUrl
    const msg = encodeURIComponent(`${shareText}\n${url}`)
    window.open(`sms:?body=${msg}`, "_blank")
    setOpen(false)
  }

  async function handleCopy(closeModal = true) {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast.success("Link copied to clipboard")
      if (closeModal) setOpen(false)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error("Could not copy — try manually")
    }
  }

  function dispatch(id: OptionId) {
    if (id === "whatsapp") handleWhatsApp()
    else if (id === "sms") handleSMS()
    else if (id === "instagram") handleCopy(true)
    else if (id === "copy") handleCopy(true)
  }

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={handleShareClick}
        className="flex items-center gap-1 text-[9px] tracking-widest text-foreground/38 hover:text-foreground/65 border border-white/10 hover:border-white/22 px-2 py-1 transition-colors shrink-0"
      >
        <Share2 className="h-3 w-3" />
        <span>SHARE</span>
      </button>

      {/* ── Share modal (bottom-sheet on mobile, centered on desktop) ── */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-[2px] flex items-end sm:items-center justify-center font-mono"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-background border-t border-x sm:border border-white/10 sm:rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <p className="text-[8px] tracking-[0.2em] text-foreground/28 mb-0.5">SHARE THIS DEAL</p>
                <p className="text-xs font-semibold text-foreground/78 max-w-[220px] truncate">{productName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-foreground/32 hover:text-foreground transition-colors p-1 -mr-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* URL strip */}
            <div className="mx-5 mb-3 flex items-center gap-2 border border-white/[0.07] bg-foreground/[0.018] px-3 py-2">
              <Link2 className="h-3 w-3 text-foreground/22 shrink-0" />
              <p className="text-[9px] text-foreground/28 truncate flex-1 font-mono">{fullUrl}</p>
            </div>

            {/* Share options */}
            <div className="px-5 pb-6 space-y-1.5">
              {OPTIONS.map(({ id, label, sub, Icon, iconCls, ringCls }) => {
                const isCopyDone = copied && (id === "copy" || id === "instagram")
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => dispatch(id)}
                    className="w-full flex items-center gap-3 p-3 border border-white/[0.07] hover:border-white/16 hover:bg-foreground/[0.028] transition-all text-left"
                  >
                    <div className={`w-8 h-8 rounded-full ${ringCls} flex items-center justify-center shrink-0`}>
                      {isCopyDone
                        ? <Check className="h-3.5 w-3.5 text-green-400/80" />
                        : <Icon className={`h-3.5 w-3.5 ${iconCls}`} />
                      }
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground/75">
                        {isCopyDone ? "Copied!" : label}
                      </p>
                      <p className="text-[8px] text-foreground/30 mt-0.5">{sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
