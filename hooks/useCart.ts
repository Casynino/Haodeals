"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartStoreItem, Product, SelectedOption } from "@/types"

interface CartStore {
  items: CartStoreItem[]
  addItem: (product: Product, quantity?: number, selectedOptions?: SelectedOption[]) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

function variantKey(productId: string, selectedOptions?: SelectedOption[]): string {
  if (!selectedOptions?.length) return productId
  const sorted = [...selectedOptions].sort((a, b) => a.name.localeCompare(b.name))
  return `${productId}:${sorted.map((o) => `${o.name}=${o.value}`).join(",")}`
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1, selectedOptions) => {
        const items = get().items
        const id = variantKey(product.id, selectedOptions)
        const existing = items.find((i) => i.id === id)
        const rawImages = product.images
        const images = Array.isArray(rawImages)
          ? rawImages
          : (JSON.parse(rawImages as unknown as string) as string[])

        if (existing) {
          set({
            items: items.map((i) =>
              i.id === id
                ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
                : i
            ),
          })
        } else {
          set({
            items: [
              ...items,
              {
                id,
                productId: product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                image: images[0] ?? "",
                quantity,
                stock: product.stock,
                selectedOptions: selectedOptions?.length ? selectedOptions : undefined,
              },
            ],
          })
        }
      },

      removeItem: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: Math.min(quantity, i.stock) } : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "hao-deals-cart" }
  )
)
