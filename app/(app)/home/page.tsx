import fs from 'fs'
import path from 'path'
import { HomeDashboard } from '@/components/home/HomeDashboard'

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
  return <HomeDashboard images={images} />
}
