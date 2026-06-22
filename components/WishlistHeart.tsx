"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Heart, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useWishlist } from "@/hooks/useWishlist"

interface Props {
  productId:   string
  productName: string
}

export function WishlistHeart({ productId, productName }: Props) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isLiked, toggleLike, fetchLiked, initialized } = useWishlist()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (status === "authenticated" && !initialized) fetchLiked()
  }, [status, initialized, fetchLiked])

  const liked = status === "authenticated" ? isLiked(productId) : false

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (status !== "authenticated") {
      toast.error("Sign in to save products", { className: " text-xs" })
      router.push("/login?callbackUrl=/products")
      return
    }

    setBusy(true)
    try {
      const nowLiked = await toggleLike(productId)
      if (nowLiked) {
        toast.success("Added to Wishlist ❤️", {
          description: productName.slice(0, 42),
          className: " text-xs",
          action: { label: "View", onClick: () => router.push("/wishlist") },
        })
      } else {
        toast("Removed from Wishlist", { className: " text-xs" })
      }
    } catch {
      toast.error("Something went wrong", { className: " text-xs" })
    } finally {
      // Always stop the spinner — no matter what happened
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      aria-label={liked ? "Remove from wishlist" : "Save to wishlist"}
      className={`
        w-7 h-7 rounded-full flex items-center justify-center
        transition-all duration-150 active:scale-90
        ${liked
          ? "bg-rose-500/20 border border-rose-500/45 text-rose-500 dark:text-rose-400"
          : "bg-background/70 backdrop-blur-sm border border-foreground/15 text-foreground/50 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30"
        }
        ${busy ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {busy
        ? <Loader2 className="h-3 w-3 animate-spin" />
        : <Heart className={`h-3 w-3 transition-all ${liked ? "fill-current" : ""}`} />
      }
    </button>
  )
}
