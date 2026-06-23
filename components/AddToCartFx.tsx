"use client"

import { useEffect, useState } from "react"

interface Flight {
  id: number
  imageUrl: string
  from: { x: number; y: number }
  to: { x: number; y: number }
}

/** Returns the on-screen rect of the currently-visible target icon. */
function getTargetRect(selector: string): DOMRect | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector))
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) return r
  }
  return els[0]?.getBoundingClientRect() ?? null
}

/** Quick pop on the target icon when an item lands. */
function popTarget(selector: string) {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
    el.classList.remove("animate-cart-pop")
    void el.offsetWidth // force reflow so the animation can re-trigger
    el.classList.add("animate-cart-pop")
    setTimeout(() => el.classList.remove("animate-cart-pop"), 450)
  }
}

export function AddToCartFx() {
  const [flights, setFlights] = useState<Flight[]>([])

  useEffect(() => {
    function onFly(e: Event) {
      const detail = (e as CustomEvent).detail as { imageUrl: string; fromRect: DOMRect; target?: "cart" | "wishlist" }
      const selector = detail?.target === "wishlist" ? "[data-wishlist-target]" : "[data-cart-target]"
      const dest = getTargetRect(selector)
      if (!dest || !detail?.fromRect) return
      const from = { x: detail.fromRect.left + detail.fromRect.width / 2, y: detail.fromRect.top + detail.fromRect.height / 2 }
      const to = { x: dest.left + dest.width / 2, y: dest.top + dest.height / 2 }
      const id = Date.now() + Math.random()
      setFlights((f) => [...f, { id, imageUrl: detail.imageUrl, from, to }])
      setTimeout(() => popTarget(selector), 650)
      setTimeout(() => setFlights((f) => f.filter((x) => x.id !== id)), 850)
    }
    window.addEventListener("hao:fly", onFly)
    return () => window.removeEventListener("hao:fly", onFly)
  }, [])

  return (
    <>
      {flights.map((fl) => (
        <FlyingThumb key={fl.id} flight={fl} />
      ))}
    </>
  )
}

function FlyingThumb({ flight }: { flight: Flight }) {
  const SIZE = 60
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "fixed",
    left: 0,
    top: 0,
    width: SIZE,
    height: SIZE,
    transform: `translate(${flight.from.x - SIZE / 2}px, ${flight.from.y - SIZE / 2}px) scale(1)`,
    opacity: 1,
    zIndex: 70,
    pointerEvents: "none",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 14px 36px rgba(0,0,0,0.32)",
    // ease-in on transform gives a subtle "accelerate into the cart" arc feel
    transition: "transform 0.75s cubic-bezier(0.55,-0.2,0.45,1), opacity 0.75s ease-in",
    willChange: "transform, opacity",
  })

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setStyle((s) => ({
        ...s,
        transform: `translate(${flight.to.x - SIZE / 2}px, ${flight.to.y - SIZE / 2}px) scale(0.18)`,
        opacity: 0.35,
      }))
    })
    return () => cancelAnimationFrame(raf)
  }, [flight])

  return (
    <div style={style} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={flight.imageUrl} alt="" className="w-full h-full object-cover" />
    </div>
  )
}
