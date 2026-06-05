"use client"

import { create } from "zustand"

interface WishlistStore {
  likedIds:    Set<string>
  initialized: boolean
  loading:     boolean
  fetchLiked:  () => Promise<void>
  toggleLike:  (productId: string) => Promise<boolean>  // returns new liked state
  isLiked:     (productId: string) => boolean
}

export const useWishlist = create<WishlistStore>((set, get) => ({
  likedIds:    new Set(),
  initialized: false,
  loading:     false,

  fetchLiked: async () => {
    if (get().initialized) return   // fetch only once per session
    set({ loading: true })
    try {
      const res = await fetch("/api/wishlist/liked")
      if (res.ok) {
        const ids: string[] = await res.json()
        set({ likedIds: new Set(ids) })
      }
    } finally {
      set({ loading: false, initialized: true })
    }
  },

  toggleLike: async (productId: string) => {
    // Optimistic update
    const prev   = get().likedIds
    const next   = new Set(prev)
    const nowLiked = !next.has(productId)
    nowLiked ? next.add(productId) : next.delete(productId)
    set({ likedIds: next })

    try {
      const res = await fetch("/api/wishlist/toggle", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ productId }),
      })
      if (!res.ok) {
        // Roll back on error
        set({ likedIds: prev })
        return !nowLiked
      }
      const data = await res.json()
      return data.liked as boolean
    } catch {
      set({ likedIds: prev })
      return !nowLiked
    }
  },

  isLiked: (productId: string) => get().likedIds.has(productId),
}))
