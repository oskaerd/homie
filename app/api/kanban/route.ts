import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tickets } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.select().from(tickets).orderBy(desc(tickets.createdAt))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, priority, status, dueDate, reporter, assignee } = body

  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const [row] = await db
    .insert(tickets)
    .values({ title, description, priority, status, dueDate, reporter, assignee })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
