"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

export interface PromoSlide {
  eyebrow: string
  title: string
  subtitle: string
  cta: string
  href: string
  image?: string | null
  /** optional looping background video (e.g. /banners/clip.mp4) — takes priority over image */
  video?: string | null
  /** image-only slide (artwork has its own text) — no overlay, whole slide links */
  bare?: boolean
  /** tailwind gradient classes for the slide background */
  gradient: string
}

export function PromoCarousel({ slides }: { slides: PromoSlide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-advance every 5s unless paused or only one slide
  useEffect(() => {
    if (count <= 1 || paused) return
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), 5000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [count, paused])

  const go = (i: number) => setIndex(((i % count) + count) % count)

  if (count === 0) return null

  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Track */}
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div key={i} className="relative w-full flex-shrink-0">
            {/* 46.25vw matches the 1525×704 banner (2.166:1). Works on all iOS (vw since Safari 6).
                Container ratio (1.99:1) ≈ image ratio (2.166:1) → object-cover crops only ~4% per side. */}
            <div
              className="relative overflow-hidden"
              style={{ height: "46.25vw", maxHeight: "420px", minHeight: "180px" }}
            >
              {s.bare ? (
                /* Image-only bare banner — same object-cover as overlay slides; the matched
                   aspect ratio means artwork text is never meaningfully cropped. */
                <Link href={s.href} className="absolute inset-0 block">
                  {s.image && (
                    <Image src={s.image} alt="Deals" fill priority={i === 0} className="object-cover" />
                  )}
                </Link>
              ) : (
                <>
                  {/* Full-bleed banner: looping video if provided, else image with Ken Burns drift */}
                  {s.video ? (
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      src={s.video}
                      autoPlay
                      muted
                      loop
                      playsInline
                      poster={s.image ?? undefined}
                    />
                  ) : s.image ? (
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      priority={i === 0}
                      className={`object-cover ${i === index ? "animate-kenburns" : ""}`}
                    />
                  ) : null}
                  {/* Readability scrim + gold tint */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
                  <div className={`absolute inset-0 pointer-events-none ${s.gradient}`} />

                  {/* Overlay copy — text block max 55% wide so it never sits on top of product imagery */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="px-5 sm:px-8 md:px-12" style={{ maxWidth: "min(100%, 480px)" }}>
                      <span className="inline-block text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-gold mb-1.5 sm:mb-2">{s.eyebrow}</span>
                      <h2 className="text-[17px] sm:text-2xl md:text-4xl font-bold tracking-tight leading-[1.1] text-white mb-2 sm:mb-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                        {s.title}
                      </h2>
                      <p className="hidden sm:block text-sm md:text-base text-white/75 leading-relaxed mb-4 max-w-sm">{s.subtitle}</p>
                      <Link href={s.href}>
                        <button className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gold text-black text-[12px] sm:text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_12px_34px_-12px_rgba(0,0,0,0.6)]">
                          {s.cta} <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Prev / next */}
      {count > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => go(index + 1)}
            aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-gold" : "w-1.5 bg-foreground/25 hover:bg-foreground/45"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
