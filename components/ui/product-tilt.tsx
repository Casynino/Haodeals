"use client"

import { useRef, useCallback } from "react"

interface ProductTiltProps {
  children: React.ReactNode
  className?: string
  intensity?: number
}

export function ProductTilt({ children, className = "", intensity = 14 }: ProductTiltProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const shineRef = useRef<HTMLDivElement>(null)

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current
      const inner = innerRef.current
      const shine = shineRef.current
      if (!el || !inner || !shine) return

      const rect = el.getBoundingClientRect()
      const x = (e.clientY - rect.top) / rect.height - 0.5   // –0.5 → +0.5
      const y = (e.clientX - rect.left) / rect.width - 0.5

      inner.style.transform = `rotateX(${-x * intensity}deg) rotateY(${y * intensity}deg) scale3d(1.04, 1.04, 1.04)`
      inner.style.transition = "transform 0.08s linear"
      shine.style.background = `radial-gradient(ellipse at ${(y + 0.5) * 100}% ${(x + 0.5) * 100}%, rgba(255,255,255,0.22) 0%, transparent 60%)`
      shine.style.opacity = "1"
    },
    [intensity],
  )

  const onLeave = useCallback(() => {
    const inner = innerRef.current
    const shine = shineRef.current
    if (!inner || !shine) return
    inner.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1,1,1)"
    inner.style.transition = "transform 0.65s cubic-bezier(0.23, 1, 0.32, 1)"
    shine.style.opacity = "0"
  }, [])

  return (
    <div
      ref={containerRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: "700px", perspectiveOrigin: "50% 50%", isolation: "isolate" }}
      className={className}
    >
      <div
        ref={innerRef}
        style={{ transformStyle: "preserve-3d", width: "100%", height: "100%", position: "relative", willChange: "transform" }}
      >
        {children}
        {/* Moving glare */}
        <div
          ref={shineRef}
          style={{ opacity: 0, transition: "opacity 0.35s ease", pointerEvents: "none", position: "absolute", inset: 0, zIndex: 30 }}
        />
      </div>
    </div>
  )
}
