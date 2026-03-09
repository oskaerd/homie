'use client'

import { useState } from 'react'
import { Slideshow } from './Slideshow'
import { SlideshowControls } from './SlideshowControls'

interface HomeDashboardProps {
  images: string[]
}

export function HomeDashboard({ images }: HomeDashboardProps) {
  const [currentImage, setCurrentImage] = useState<string | null>(images[0] ?? null)

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Home</h1>
        <SlideshowControls currentImage={currentImage} />
      </div>
      <div className="flex-1">
        <Slideshow images={images} onCurrentChange={setCurrentImage} />
      </div>
    </div>
  )
}
