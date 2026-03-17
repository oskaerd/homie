export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const UPLOADS_ROOT = path.join(process.cwd(), 'data', 'uploads')

const MIME_TYPES: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { path: segments } = await params

  // Resolve and verify the path stays within UPLOADS_ROOT
  const resolved = path.resolve(UPLOADS_ROOT, ...segments)
  if (!resolved.startsWith(UPLOADS_ROOT + path.sep)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const ext = path.extname(resolved).toLowerCase()
  const contentType = MIME_TYPES[ext]
  if (!contentType) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const buffer = fs.readFileSync(resolved)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
