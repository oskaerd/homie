import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'
import path from 'path'

const dbPath = process.env.DATABASE_URL ?? path.join(process.cwd(), 'data', 'homie.db')

const sqlite = new Database(dbPath)

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite, { schema })
