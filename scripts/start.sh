#!/bin/sh
# Create upload directories (persisted in the data volume)
mkdir -p /app/data/uploads/slideshow /app/data/uploads/inventory /app/data/uploads/highscores /app/data/uploads/cookbook /app/data/backups

# Run migrations then start the app
node -e "
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
const path = require('path');

const dbPath = process.env.DATABASE_URL || '/app/data/homie.db';
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: '/app/lib/db/migrations' });
console.log('Migrations applied');
"
exec node server.js
