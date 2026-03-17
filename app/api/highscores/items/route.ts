export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { highscoreItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const categoryId = req.nextUrl.searchParams.get('categoryId')
  const rows = categoryId
    ? await db.select().from(highscoreItems).where(eq(highscoreItems.categoryId, Number(categoryId)))
    : await db.select().from(highscoreItems)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { categoryId, title, description, location, imageUrl } = await req.json()
  const [row] = await db.insert(highscoreItems).values({ categoryId, title, description, location, imageUrl }).returning()
  return NextResponse.json(row)
}
