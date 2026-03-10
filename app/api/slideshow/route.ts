import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const SLIDESHOW_DIR = path.join(process.cwd(), 'data', 'uploads', 'slideshow')
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'])
const MAX_SIZE = 15 * 1024 * 1024 // 15 MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]

  if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 })

  fs.mkdirSync(SLIDESHOW_DIR, { recursive: true })

  const saved: string[] = []

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) continue
    if (file.size > MAX_SIZE) continue

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    fs.writeFileSync(path.join(SLIDESHOW_DIR, filename), buffer)
    saved.push(`/api/uploads/slideshow/${filename}`)
  }

  return NextResponse.json({ saved })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filename } = await req.json()
  if (!filename || typeof filename !== 'string') {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  const safe = path.basename(filename)
  const filepath = path.join(SLIDESHOW_DIR, safe)
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath)

  return NextResponse.json({ ok: true })
}
