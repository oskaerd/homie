export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recipes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { title, description, ingredients, portionCount, imageUrl, label, calories, protein, fat, sugar, fiber } = await req.json()
  const [row] = await db.update(recipes).set({
    title, description, portionCount, imageUrl, label, calories, protein, fat, sugar, fiber,
    ingredients: JSON.stringify(ingredients ?? []),
    updatedAt: new Date(),
  }).where(eq(recipes.id, Number(id))).returning()
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...row, ingredients: JSON.parse(row.ingredients) })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.delete(recipes).where(eq(recipes.id, Number(id)))
  return NextResponse.json({ ok: true })
}
