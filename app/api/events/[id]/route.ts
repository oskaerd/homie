export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { title, location, startTime, endTime } = body

  if (!title || !startTime) {
    return NextResponse.json({ error: 'title, startTime required' }, { status: 400 })
  }

  if (endTime && endTime < startTime) {
    return NextResponse.json({ error: 'endTime must not be before startTime' }, { status: 400 })
  }

  const [row] = await db
    .update(events)
    .set({ title, location, startTime, endTime: endTime || null })
    .where(eq(events.id, Number(id)))
    .returning()

  return NextResponse.json(row)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.delete(events).where(eq(events.id, Number(id)))
  return NextResponse.json({ ok: true })
}
