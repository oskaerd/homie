import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { meals } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekStart = req.nextUrl.searchParams.get('weekStart')
  if (!weekStart) return NextResponse.json({ error: 'weekStart required' }, { status: 400 })

  const rows = await db.select().from(meals).where(eq(meals.weekStart, weekStart))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { weekStart, day, slot, content } = body

  if (!weekStart || day === undefined || !slot || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const [row] = await db.insert(meals).values({ weekStart, day, slot, content }).returning()
  return NextResponse.json(row, { status: 201 })
}
