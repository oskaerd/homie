export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { ALLOWED_EMAILS } from '@/config/allowed-users'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Only allowlisted emails can reset
    if (!ALLOWED_EMAILS.includes(email)) {
      return NextResponse.json({ error: 'Email not recognised' }, { status: 403 })
    }

    const user = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).get()
    if (!user) {
      return NextResponse.json({ error: 'No account found for that email' }, { status: 404 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    await db.update(users).set({ hashedPassword }).where(eq(users.email, email))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('reset-password error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
