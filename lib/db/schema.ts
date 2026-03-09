import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core'

// ─── Auth ────────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image'),
  hashedPassword: text('hashed_password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s','now'))`),
})

export const accounts = sqliteTable('accounts', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
})

export const sessions = sqliteTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
})

export const verificationTokens = sqliteTable('verificationTokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
})

// ─── Kanban ───────────────────────────────────────────────────────────────────

export const tickets = sqliteTable('tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }).notNull().default('medium'),
  status: text('status', { enum: ['todo', 'in_progress', 'blocked', 'qa', 'done'] }).notNull().default('todo'),
  dueDate: text('due_date'),
  completionDate: text('completion_date'),
  reporter: text('reporter'),
  assignee: text('assignee'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s','now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s','now'))`),
})

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  expirationDate: text('expiration_date'),
  quantity: real('quantity').notNull().default(1),
  unit: text('unit'),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s','now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s','now'))`),
})

// ─── Meals ────────────────────────────────────────────────────────────────────

export const meals = sqliteTable('meals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  weekStart: text('week_start').notNull(), // ISO date string (Monday)
  day: integer('day').notNull(), // 0=Mon … 6=Sun
  slot: text('slot', { enum: ['breakfast', '2nd_breakfast', 'lunch', 'dinner', 'snacks'] }).notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s','now'))`),
})

// ─── Highscores ───────────────────────────────────────────────────────────────

export const highscoreCategories = sqliteTable('highscore_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s','now'))`),
})

export const highscoreItems = sqliteTable('highscore_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').notNull().references(() => highscoreCategories.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location').notNull(),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s','now'))`),
})

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export const wishlist = sqliteTable('wishlist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  owner: text('owner', { enum: ['natalia', 'oskar'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s','now'))`),
})

// ─── Calendar ─────────────────────────────────────────────────────────────────

export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  location: text('location'),
  submitter: text('submitter'),
  startTime: text('start_time').notNull(), // ISO datetime string
  endTime: text('end_time').notNull(),     // ISO datetime string
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s','now'))`),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type Ticket = typeof tickets.$inferSelect
export type NewTicket = typeof tickets.$inferInsert
export type InventoryItem = typeof inventory.$inferSelect
export type NewInventoryItem = typeof inventory.$inferInsert
export type Meal = typeof meals.$inferSelect
export type NewMeal = typeof meals.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type HighscoreCategory = typeof highscoreCategories.$inferSelect
export type HighscoreItem = typeof highscoreItems.$inferSelect
export type NewHighscoreItem = typeof highscoreItems.$inferInsert
export type WishlistItem = typeof wishlist.$inferSelect
export type NewWishlistItem = typeof wishlist.$inferInsert
