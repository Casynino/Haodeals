"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Global "added to bag" celebration — plays /public/add-to-cart.mp4 as a brief
 * overlay whenever celebrateAddToCart() fires the "hao:add-to-cart" event.
 */
export function AddToCartFx() {
  const [visible, setVisible] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onCelebrate() {
      setVisible(true)
      const v = videoRef.current
      if (v) {
        try { v.currentTime = 0 } catch {}
        v.play().catch(() => {})
      }
      if (timerRef.current) clearTimeout(timerRef.current)
      // auto-dismiss (cap so it never lingers too long)
      timerRef.current = setTimeout(() => setVisible(false), 3200)
    }
    window.addEventListener("hao:add-to-cart", onCelebrate)
    return () => {
      window.removeEventListener("hao:add-to-cart", onCelebrate)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      aria-hidden={!visible}
    >
      <div
        className={`absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setVisible(false)}
      />
      <div className={`relative transition-all duration-300 ${visible ? "scale-100 translate-y-0" : "scale-90 translate-y-3"}`}>
        <div className="relative w-[min(64vw,230px)] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/15 bg-black">
          <video
            ref={videoRef}
            src="/add-to-cart.mp4"
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            onEnded={() => setVisible(false)}
          />
        </div>
        <p className="mt-3 text-center text-white font-semibold text-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          Added to your bag ✓
        </p>
      </div>
    </div>
  )
}
