"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Heart, Plus, Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useWishlist } from "@/hooks/useWishlist"

const COLOR_DOT: Record<string, string> = {
  violet:  "bg-violet-500",
  rose:    "bg-rose-500",
  amber:   "bg-amber-500",
  emerald: "bg-emerald-500",
  blue:    "bg-blue-500",
  orange:  "bg-orange-500",
}

interface WishlistHeartProps {
  productId:   string
  productName: string
}

export function WishlistHeart({ productId, productName }: WishlistHeartProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const {
    isLiked, toggleLike, fetchLiked, initialized,
    lists, listsLoaded, fetchLists, isInList, addToList, removeFromList,
  } = useWishlist()

  const [showPicker, setShowPicker] = useState(false)
  const [busy, setBusy]             = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Init liked state + lists once authenticated
  useEffect(() => {
    if (status === "authenticated") {
      if (!initialized) fetchLiked()
      if (!listsLoaded)  fetchLists()
    }
  }, [status, initialized, listsLoaded, fetchLiked, fetchLists])

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setShowPicker(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [showPicker])

  const liked = status === "authenticated" ? isLiked(productId) : false

  /* ── Heart button clicked ── */
  function handleHeartClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (status !== "authenticated") {
      toast.error("Sign in to save products", { className: "font-mono text-xs" })
      router.push("/login?callbackUrl=/products")
      return
    }
    // If user has custom lists → show picker
    const customLists = lists.filter((l) => !l.isDefault)
    if (customLists.length > 0) {
      setShowPicker(true)
    } else {
      // No custom lists → quick save to default
      quickSaveDefault()
    }
  }

  async function quickSaveDefault() {
    setBusy(true)
    const nowLiked = await toggleLike(productId)
    setBusy(false)
    if (nowLiked) {
      toast.success(`Saved to Wishlist ❤️`, {
        description: productName.slice(0, 40),
        className: "font-mono text-xs",
        action: { label: "View", onClick: () => router.push("/wishlist") },
      })
    } else {
      toast("Removed from Wishlist", { className: "font-mono text-xs" })
    }
  }

  async function handleListToggle(e: React.MouseEvent, listId: string, listName: string, isDefault: boolean) {
    e.preventDefault()
    e.stopPropagation()
    const inList = isInList(listId, productId)
    if (inList) {
      await removeFromList(listId, productId)
      toast(`Removed from "${listName}"`, { className: "font-mono text-xs" })
    } else {
      await addToList(listId, productId)
      toast.success(`Added to "${listName}" ✓`, {
        className: "font-mono text-xs",
        action: { label: "View", onClick: () => router.push("/wishlist") },
      })
    }
  }

  return (
    <>
      {/* ── Heart button ── */}
      <button
        onClick={handleHeartClick}
        disabled={busy}
        aria-label={liked ? "Saved" : "Save to wishlist"}
        className={`
          w-7 h-7 rounded-full flex items-center justify-center
          transition-all duration-150 active:scale-90
          ${liked
            ? "bg-rose-500/25 border border-rose-500/50 text-rose-400"
            : "bg-black/35 backdrop-blur-sm border border-white/20 text-white/65 hover:text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/35"
          }
          ${busy ? "opacity-50" : ""}
        `}
      >
        {busy
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Heart className={`h-3 w-3 transition-all ${liked ? "fill-current" : ""}`} />
        }
      </button>

      {/* ── List picker bottom sheet ── */}
      {showPicker && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPicker(false) }}
        >
          <div
            className="w-full max-w-sm bg-background rounded-t-3xl border-t border-x border-white/10 p-5 pb-8 space-y-4"
            style={{ animation: "slideUp 0.22s cubic-bezier(0.22,1,0.36,1)" }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto -mt-1" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground/80">Save to list</p>
                <p className="text-[10px] text-foreground/35 font-mono mt-0.5 truncate max-w-[200px]">{productName}</p>
              </div>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPicker(false) }}
                className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Lists */}
            <div className="space-y-2">
              {lists.map((list) => {
                const inList  = isInList(list.id, productId)
                const dotCls  = COLOR_DOT[list.color] ?? "bg-violet-500"
                return (
                  <button
                    key={list.id}
                    onClick={(e) => handleListToggle(e, list.id, list.name, list.isDefault)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl border transition-all active:scale-[0.98]
                      ${inList
                        ? "border-rose-500/25 bg-rose-500/[0.06]"
                        : "border-white/8 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15"
                      }`}
                  >
                    {/* Color dot + emoji */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${dotCls} bg-opacity-20`}>
                      <span className="text-lg">{list.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground/80 truncate">{list.name}</p>
                      <p className="text-[10px] text-foreground/35 font-mono">
                        {list.isDefault ? "Default list" : `${list.items.length} item${list.items.length !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                    {inList
                      ? <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-rose-400" />
                        </div>
                      : <div className="w-6 h-6 rounded-full border border-white/15 flex items-center justify-center flex-shrink-0 text-foreground/30">
                          <Plus className="h-3 w-3" />
                        </div>
                    }
                  </button>
                )
              })}
            </div>

            {/* Create new goal link */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPicker(false); router.push("/wishlist") }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-dashed border-white/12 text-[11px] font-mono text-foreground/35 hover:text-foreground/60 hover:border-white/20 transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Create new goal
            </button>
          </div>
        </div>
      )}

      {/* Bottom sheet slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
