import fs from 'fs'
import path from 'path'
import { Slideshow } from '@/components/home/Slideshow'

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'])

function getSlideshowImages(): string[] {
  const dir = path.join(process.cwd(), 'public', 'slideshow')
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .map((f) => `/slideshow/${f}`)
  } catch {
    return []
  }
}

export default function HomePage() {
  const images = getSlideshowImages()
  return (
    <div className="flex h-full flex-col gap-4">
      <h1 className="text-2xl font-bold">Home</h1>
      <div className="flex-1">
        <Slideshow images={images} />
      </div>
    </div>
  )
}
