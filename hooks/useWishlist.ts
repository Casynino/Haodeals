"use client"

import { create } from "zustand"

export interface WishlistBrief {
  id: string
  name: string
  emoji: string
  color: string
  isDefault: boolean
  items: Array<{ product: { id: string } }>
}

interface WishlistStore {
  // Default "Saved Items" liked IDs (heart state)
  likedIds:     Set<string>
  initialized:  boolean
  loading:      boolean

  // All lists for the picker
  lists:        WishlistBrief[]
  listsLoaded:  boolean

  fetchLiked:       () => Promise<void>
  fetchLists:       () => Promise<void>
  toggleLike:       (productId: string) => Promise<boolean>
  isLiked:          (productId: string) => boolean
  isInList:         (wishlistId: string, productId: string) => boolean
  addToList:        (wishlistId: string, productId: string) => Promise<boolean>
  removeFromList:   (wishlistId: string, productId: string) => Promise<void>
}

export const useWishlist = create<WishlistStore>((set, get) => ({
  likedIds:    new Set(),
  initialized: false,
  loading:     false,
  lists:       [],
  listsLoaded: false,

  /* ── Fetch liked IDs for the default list (heart state) ── */
  fetchLiked: async () => {
    if (get().initialized) return
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

  /* ── Fetch all lists for the picker ── */
  fetchLists: async () => {
    if (get().listsLoaded) return
    try {
      const res = await fetch("/api/wishlist")
      if (res.ok) {
        const data: WishlistBrief[] = await res.json()
        set({ lists: data, listsLoaded: true })
      }
    } catch { /* ignore */ }
  },

  /* ── Toggle product in the default list ── */
  toggleLike: async (productId: string) => {
    const prev     = get().likedIds
    const next     = new Set(prev)
    const nowLiked = !next.has(productId)
    nowLiked ? next.add(productId) : next.delete(productId)
    set({ likedIds: next })
    try {
      const res = await fetch("/api/wishlist/toggle", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ productId }),
      })
      if (!res.ok) { set({ likedIds: prev }); return !nowLiked }
      // Refresh lists so isInList stays accurate
      set({ listsLoaded: false })
      return (await res.json()).liked as boolean
    } catch {
      set({ likedIds: prev })
      return !nowLiked
    }
  },

  isLiked: (productId) => get().likedIds.has(productId),

  isInList: (wishlistId, productId) => {
    const list = get().lists.find((l) => l.id === wishlistId)
    return list?.items.some((i) => i.product.id === productId) ?? false
  },

  /* ── Add product to a specific list ── */
  addToList: async (wishlistId: string, productId: string) => {
    // Optimistic: update local lists state
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === wishlistId && !l.items.some((i) => i.product.id === productId)
          ? { ...l, items: [...l.items, { product: { id: productId } }] }
          : l
      ),
    }))
    // Also update likedIds if this is the default list
    const defaultList = get().lists.find((l) => l.isDefault)
    if (defaultList?.id === wishlistId) {
      const next = new Set(get().likedIds)
      next.add(productId)
      set({ likedIds: next })
    }
    try {
      const res = await fetch(`/api/wishlist/${wishlistId}/items`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ productId }),
      })
      return res.ok || res.status === 409 // 409 = already in list (ok)
    } catch { return false }
  },

  /* ── Remove product from a specific list ── */
  removeFromList: async (wishlistId: string, productId: string) => {
    set((s) => ({
      lists: s.lists.map((l) =>
        l.id === wishlistId
          ? { ...l, items: l.items.filter((i) => i.product.id !== productId) }
          : l
      ),
    }))
    // Also update likedIds if this is the default list
    const defaultList = get().lists.find((l) => l.isDefault)
    if (defaultList?.id === wishlistId) {
      const next = new Set(get().likedIds)
      next.delete(productId)
      set({ likedIds: next })
    }
    await fetch(`/api/wishlist/${wishlistId}/items/${productId}`, { method: "DELETE" })
  },
}))
