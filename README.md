# Homie

A household management app for two. Runs locally on a Raspberry Pi, accessible from any browser on the home network.

## Features

- **Kanban board** — shared task/chore tracking with drag-and-drop (todo, in progress, blocked, QA, done)
- **Inventory** — food/drink storage tracker with expiry dates, auto-delete on zero quantity
- **Meal planner** — weekly view (Mon–Sun) with 5 meal slots per day
- **Calendar** — household events and appointments
- **Wishlist** — two-column wishlist (one per person)
- **Highscores** — personal records by category with optional photo and description
- **Cookbook** — recipes with ingredients, macros, and label filters

## Stack

- Next.js 16 (App Router) + TypeScript
- SQLite + Drizzle ORM — data stored in a single local file (`./data/homie.db`)
- Auth.js v5 — email/password login, invite-only via allowlist
- Tailwind CSS v4 + shadcn/ui
- Docker + docker-compose for RPi deployment

## Getting started

### 1. Configure allowed users

```bash
cp config/allowed-users.template.ts config/allowed-users.ts
# Edit config/allowed-users.ts and add your email addresses
```

### 2. Run locally

```bash
npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register with one of the allowed emails, and you're in.

### 3. Deploy to Raspberry Pi

Build the image on your dev machine (adjust platform for your RPi model):

```bash
docker buildx build --platform linux/arm/v7 -t homie .
# For RPi 4 / 64-bit OS:
# docker buildx build --platform linux/arm64 -t homie .
```

Copy `docker-compose.yml` to the RPi, set environment variables, and start:

```bash
AUTH_SECRET=<random-secret> NEXTAUTH_URL=http://<rpi-ip>:3000 docker-compose up -d
```

The app will be available at `http://<rpi-ip>:3000` from any device on the local network.

### 4. Set up automated backups (on the RPi)

Run the install script once after deployment:

```bash
# Default — backups go to ./backups next to docker-compose.yml
./scripts/install.sh

# Custom location (path must already exist)
BACKUP_DIR=/mnt/nas/homie-backups ./scripts/install.sh
```

This creates the backup directory, writes `BACKUP_DIR` to `.env`, and installs a cron job that backs up the database every 30 minutes (keeping the last 48 snapshots — 24 hours of coverage). Then restart the container to apply the new bind-mount:

```bash
docker compose up -d
```

To run a backup manually at any time:

```bash
docker exec homie node scripts/backup-db.js
```

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `AUTH_SECRET` | Yes | — | Random secret for Auth.js session signing |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | Public base URL of the app |
| `DATABASE_URL` | No | `/app/data/homie.db` | Path to the SQLite database file |
| `BACKUP_DIR` | No | `./backups` | Host path for the backup bind-mount (set by `install.sh`) |
| `SLIDESHOW_DIR` | No | `./public/slideshow` | Host path for slideshow photos |

## Data persistence

All data is stored in a SQLite file on disk. In development this is `./data/homie.db`. In Docker it lives in a named volume (`homie_data`) mounted at `/app/data`, so it survives container restarts and image updates.

Uploaded files (inventory photos, highscore images, etc.) are stored in `./data/uploads/` inside the same volume.

## Scripts

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build (also type-checks)
npm run lint             # ESLint
npm run db:generate      # Generate Drizzle migrations after schema changes
npm run db:migrate       # Apply pending migrations
npm run db:studio        # Open Drizzle Studio (browser UI for the DB)
npm run db:backup        # Take a manual DB backup (dev)
npm run reset-password   # Reset a user's password: node scripts/reset-password.js <email> <password>
```
