// "Fly to X" animations — the source image flies into the cart or wishlist
// icon. Played by <AddToCartFx />.
type FlyTarget = "cart" | "wishlist"

function fly(imageUrl: string, fromRect: DOMRect | null, target: FlyTarget) {
  if (typeof window === "undefined" || !fromRect || !imageUrl) return
  window.dispatchEvent(new CustomEvent("hao:fly", { detail: { imageUrl, fromRect, target } }))
}

export function flyToCart(imageUrl: string, fromRect: DOMRect | null) {
  fly(imageUrl, fromRect, "cart")
}

export function flyToWishlist(imageUrl: string, fromRect: DOMRect | null) {
  fly(imageUrl, fromRect, "wishlist")
}
