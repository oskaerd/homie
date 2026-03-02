import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { ALLOWED_EMAILS } from '@/config/allowed-users'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  if (!ALLOWED_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Email not allowed' }, { status: 403 })
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).get()
  if (existing) {
    return NextResponse.json({ error: 'Account already exists' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await db.insert(users).values({
    id: randomUUID(),
    email,
    name: name ?? email.split('@')[0],
    hashedPassword,
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
