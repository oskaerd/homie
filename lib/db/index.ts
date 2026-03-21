import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'

const dbPath = process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'homie.db')

const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

const sqlite = new Database(dbPath)

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL')
// Allow waiting up to 5s when DB is locked (fixes concurrent build workers)
sqlite.pragma('busy_timeout = 5000')

export const db = drizzle(sqlite, { schema })
