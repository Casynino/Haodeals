import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return `TSh ${Math.round(amount).toLocaleString("en-US")}`
}

/**
 * Returns the price the customer should actually pay right now.
 * The selling `price` is always the final purchasable price; `originalPrice`
 * is the (strikethrough) compare-at price. The deal timer is urgency only and
 * never changes the price. Single source of truth used by every page + checkout.
 */
export function getEffectivePrice(product: {
  price: number
  originalPrice?: number | null
  dealEndsAt?: string | Date | null
}): number {
  return product.price
}

/**
 * Returns true only when a deal timer is set AND has not yet expired.
 */
export function isDealActive(product: {
  dealEndsAt?: string | Date | null
}): boolean {
  if (!product.dealEndsAt) return false
  return new Date(product.dealEndsAt) > new Date()
}
