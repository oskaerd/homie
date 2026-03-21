export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'
import { and, gte, lte } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const conditions = []
  if (from) conditions.push(gte(events.startTime, from))
  if (to) conditions.push(lte(events.startTime, to))

  const rows = conditions.length
    ? await db.select().from(events).where(and(...conditions))
    : await db.select().from(events)

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, location, startTime, endTime } = body
  const submitter = session.user?.name ?? session.user?.email ?? 'Unknown'

  if (!title || !startTime) {
    return NextResponse.json({ error: 'title, startTime required' }, { status: 400 })
  }

  if (endTime && endTime < startTime) {
    return NextResponse.json({ error: 'endTime must not be before startTime' }, { status: 400 })
  }

  const [row] = await db
    .insert(events)
    .values({ title, location, submitter, startTime, endTime: endTime || null })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
