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
          <div key={i} className="relative w-full flex-shrink-0 glass">
            <div className={`absolute inset-0 pointer-events-none ${s.gradient}`} />
            <div className="gold-glow absolute -top-24 -right-16 w-[26rem] h-[26rem] rounded-full pointer-events-none" />
            <div className="relative grid md:grid-cols-2 gap-6 items-center p-6 md:p-10 min-h-[16rem] md:min-h-[20rem]">
              {/* Copy */}
              <div>
                <span className="inline-block text-[12px] tracking-[0.2em] uppercase text-gold mb-3">{s.eyebrow}</span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-[1.08] text-foreground mb-3">
                  {s.title}
                </h2>
                <p className="text-sm md:text-base text-foreground/55 leading-relaxed mb-6 max-w-md">{s.subtitle}</p>
                <Link href={s.href}>
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-black text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_12px_34px_-12px_var(--gold-soft)]">
                    {s.cta} <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>

              {/* Image */}
              {s.image && (
                <div className="relative hidden md:block aspect-[4/3] rounded-3xl overflow-hidden glass-soft">
                  <Image src={s.image} alt="" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
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
