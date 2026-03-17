export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { inventory } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, expirationDate, quantity, unit, imageUrl } = body

  if (quantity <= 0) {
    await db.delete(inventory).where(eq(inventory.id, Number(id)))
    return NextResponse.json({ deleted: true })
  }

  const [row] = await db
    .update(inventory)
    .set({ name, expirationDate, quantity, unit, imageUrl, updatedAt: new Date() })
    .where(eq(inventory.id, Number(id)))
    .returning()

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.delete(inventory).where(eq(inventory.id, Number(id)))
  return NextResponse.json({ ok: true })
}
