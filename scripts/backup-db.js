#!/usr/bin/env node
// Usage: node scripts/backup-db.js [--keep <n>]
//   --keep <n>  number of most-recent backups to retain (default: keep all)
//
// Env vars:
//   DATABASE_URL   path to source DB (default: ./data/homie.db)
//   BACKUP_DIR     destination directory (default: ./data/backups)

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const keepIndex = args.indexOf('--keep')
const keep = keepIndex !== -1 ? parseInt(args[keepIndex + 1], 10) : null

if (keep !== null && (isNaN(keep) || keep < 1)) {
  console.error('--keep must be a positive integer')
  process.exit(1)
}

const dbPath = process.env.DATABASE_URL ?? path.join(__dirname, '..', 'data', 'homie.db')
const backupDir = process.env.BACKUP_DIR ?? path.join(__dirname, '..', 'data', 'backups')

fs.mkdirSync(backupDir, { recursive: true })

const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19)
const backupPath = path.join(backupDir, `homie_${timestamp}.db`)

const db = new Database(dbPath, { readonly: true })

db.backup(backupPath)
  .then(() => {
    db.close()
    console.log(`Backup saved: ${backupPath}`)

    if (keep !== null) {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('homie_') && f.endsWith('.db'))
        .sort()
      const toDelete = files.slice(0, Math.max(0, files.length - keep))
      for (const f of toDelete) {
        fs.unlinkSync(path.join(backupDir, f))
        console.log(`Removed old backup: ${f}`)
      }
    }
  })
  .catch(err => {
    db.close()
    console.error('Backup failed:', err.message)
    process.exit(1)
  })
