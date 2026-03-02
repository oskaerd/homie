import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { inventory } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.select().from(inventory).orderBy(asc(inventory.expirationDate))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, expirationDate, quantity, unit } = body

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const [row] = await db
    .insert(inventory)
    .values({ name, expirationDate, quantity: quantity ?? 1, unit })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
