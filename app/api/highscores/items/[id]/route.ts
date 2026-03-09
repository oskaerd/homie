import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { highscoreItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { title, description, location, imageUrl } = await req.json()
  const [row] = await db.update(highscoreItems).set({ title, description, location, imageUrl }).where(eq(highscoreItems.id, Number(id))).returning()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.delete(highscoreItems).where(eq(highscoreItems.id, Number(id)))
  return NextResponse.json({ ok: true })
}
