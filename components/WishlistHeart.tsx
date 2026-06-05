"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { useWishlist } from "@/hooks/useWishlist"

interface WishlistHeartProps {
  productId: string
  size?: "sm" | "md"
}

export function WishlistHeart({ productId, size = "sm" }: WishlistHeartProps) {
  const { data: session, status } = useSession()
  const router  = useRouter()
  const { isLiked, toggleLike, fetchLiked, initialized } = useWishlist()
  const [busy, setBusy] = useState(false)

  // Initialize liked IDs once per session
  useEffect(() => {
    if (status === "authenticated" && !initialized) fetchLiked()
  }, [status, initialized, fetchLiked])

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (status !== "authenticated") {
      toast.error("Sign in to save products", { className: "font-mono text-xs" })
      router.push("/login?callbackUrl=/wishlist")
      return
    }

    setBusy(true)
    const nowLiked = await toggleLike(productId)
    setBusy(false)

    if (nowLiked) {
      toast.success("Saved to Wishlist ❤️", {
        description: "View all saved items in your Wishlist",
        className: "font-mono text-xs",
        action: { label: "View", onClick: () => router.push("/wishlist") },
      })
    } else {
      toast("Removed from Wishlist", { className: "font-mono text-xs" })
    }
  }

  const liked = session ? isLiked(productId) : false
  const sizeClasses = size === "md"
    ? "w-8 h-8 rounded-full"
    : "w-6 h-6 rounded-full"
  const iconSize = size === "md" ? "h-4 w-4" : "h-3 w-3"

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      aria-label={liked ? "Remove from wishlist" : "Save to wishlist"}
      className={`${sizeClasses} flex items-center justify-center transition-all active:scale-90
        ${liked
          ? "bg-rose-500/20 border border-rose-500/40 text-rose-400"
          : "bg-black/30 backdrop-blur-sm border border-white/15 text-white/50 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10"
        } ${busy ? "opacity-50" : ""}`}
    >
      <Heart className={`${iconSize} ${liked ? "fill-current" : ""} transition-all`} />
    </button>
  )
}
