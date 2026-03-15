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

**On your dev machine** — build and transfer the image:

```bash
docker buildx build --platform linux/arm/v7 -t homie .
# For RPi 4 / 64-bit OS: --platform linux/arm64

docker save homie | gzip | ssh pi@raspberrypi.local 'gunzip | docker load'
scp docker-compose.yml Caddyfile scripts/ pi@raspberrypi.local:~/homie/
```

**On the RPi** — install Tailscale, then run the install script:

```bash
# Install Tailscale (if not already done)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
# Enable MagicDNS in the Tailscale admin panel, note your hostname

# Create .env with your secrets
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> ~/homie/.env

# Run install script — provisions TLS cert, sets up backup cron
cd ~/homie
TAILSCALE_HOSTNAME=raspberrypi.tail1234.ts.net ./scripts/install.sh

# Start everything
docker compose up -d
```

The app will be available at `https://raspberrypi.tail1234.ts.net` from any device running Tailscale.

To run a backup manually at any time:

```bash
docker exec homie node scripts/backup-db.js
```

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `AUTH_SECRET` | Yes | — | Random secret for Auth.js session signing. Generate with `openssl rand -base64 32` |
| `TAILSCALE_HOSTNAME` | Yes | — | MagicDNS hostname, e.g. `raspberrypi.tail1234.ts.net`. Set by `install.sh` |
| `NEXTAUTH_URL` | No | derived | Derived automatically as `https://${TAILSCALE_HOSTNAME}` |
| `DATABASE_URL` | No | `/app/data/homie.db` | Path to the SQLite database file |
| `BACKUP_DIR` | No | `./backups` | Host path for the backup bind-mount (set by `install.sh`) |

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
