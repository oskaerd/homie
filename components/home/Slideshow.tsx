'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'

interface SlideshowProps {
  images: string[]
}

const INTERVAL_MS = 5000

export function Slideshow({ images }: SlideshowProps) {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  const goTo = useCallback(
    (index: number) => {
      setVisible(false)
      setTimeout(() => {
        setCurrent((index + images.length) % images.length)
        setVisible(true)
      }, 300)
    },
    [images.length]
  )

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => goTo(current + 1), INTERVAL_MS)
    return () => clearInterval(timer)
  }, [current, images.length, goTo])

  if (images.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <ImageOff className="h-16 w-16 opacity-30" />
        <div className="text-center">
          <p className="text-lg font-medium">No photos yet</p>
          <p className="text-sm">Add images to <code className="rounded bg-muted px-1">public/slideshow/</code> on the RPi</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-black">
      <Image
        key={images[current]}
        src={images[current]}
        alt={`Slide ${current + 1}`}
        fill
        className="object-contain"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
        priority
      />

      {images.length > 1 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 w-2 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
