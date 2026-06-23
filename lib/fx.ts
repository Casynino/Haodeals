// Fire a "fly to cart" animation: the product image flies from `fromRect`
// into the cart icon. Played by <AddToCartFx />.
export function flyToCart(imageUrl: string, fromRect: DOMRect | null) {
  if (typeof window === "undefined" || !fromRect || !imageUrl) return
  window.dispatchEvent(new CustomEvent("hao:fly-to-cart", { detail: { imageUrl, fromRect } }))
}
