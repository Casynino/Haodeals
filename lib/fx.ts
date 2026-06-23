// Fire a one-off "added to bag" celebration (played by <AddToCartFx />).
export function celebrateAddToCart() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hao:add-to-cart"))
  }
}
