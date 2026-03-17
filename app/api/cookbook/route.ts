export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recipes } from '@/lib/db/schema'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(recipes).orderBy(recipes.createdAt)
  return NextResponse.json(rows.map(r => ({ ...r, ingredients: JSON.parse(r.ingredients) })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { title, description, ingredients, portionCount, imageUrl, label, calories, protein, fat, sugar, fiber } = await req.json()
  const [row] = await db.insert(recipes).values({
    title, description, portionCount, imageUrl, label, calories, protein, fat, sugar, fiber,
    ingredients: JSON.stringify(ingredients ?? []),
  }).returning()
  return NextResponse.json({ ...row, ingredients: JSON.parse(row.ingredients) })
}
