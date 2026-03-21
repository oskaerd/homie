export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requests } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { desc } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.select().from(requests).orderBy(desc(requests.createdAt))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, priority } = body
  const submitter = session.user?.name ?? session.user?.email ?? 'Unknown'

  if (!title) {
    return NextResponse.json({ error: 'title required' }, { status: 400 })
  }

  const [row] = await db
    .insert(requests)
    .values({ title, priority: priority ?? 'medium', submitter })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
