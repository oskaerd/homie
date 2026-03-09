#!/usr/bin/env node
// Usage: node scripts/reset-password.js <email> <new-password>

const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')

const [, , email, password] = process.argv

if (!email || !password) {
  console.error('Usage: node scripts/reset-password.js <email> <new-password>')
  process.exit(1)
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters')
  process.exit(1)
}

const dbPath = process.env.DATABASE_URL ?? path.join(__dirname, '..', 'data', 'homie.db')
const db = new Database(dbPath)

const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
if (!user) {
  console.error(`No user found with email: ${email}`)
  process.exit(1)
}

const hashed = bcrypt.hashSync(password, 12)
db.prepare('UPDATE users SET hashed_password = ? WHERE email = ?').run(hashed, email)

console.log(`Password updated for ${email}`)
