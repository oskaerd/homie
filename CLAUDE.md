# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow rule

At the end of every resolved prompt if there is a code change to commit, create a git commit with a concise message summarising the changes made. Stage only the files that were modified as part of the task.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (also type-checks)
npm run lint         # ESLint
npm run db:generate  # Generate Drizzle migrations after schema changes
npm run db:migrate   # Apply pending migrations
npm run db:studio    # Open Drizzle Studio UI
npm run reset-password  # Node.js script to reset a user's password
```

There are no automated tests in this project.

## Architecture

### Route layout
- `app/(app)/` — protected pages (kanban, inventory, meals, calendar); all require auth
- `app/(auth)/` — public pages (login, register, reset-password)
- `app/api/` — REST API routes; every route checks `auth()` and returns 401 if unauthenticated
- `app/page.tsx` — redirects to `/kanban`

### Auth
- Auth.js v5 (`next-auth@beta`) with Credentials provider + JWT sessions + DrizzleAdapter
- `lib/auth.ts` exports `{ handlers, auth, signIn, signOut }`
- `proxy.ts` is the Next.js 16 middleware replacement (replaces `middleware.ts`); always runs in Node.js runtime — do not add `export const runtime` to it
- `config/allowed-users.ts` holds the email allowlist (`ALLOWED_EMAILS`). This file is gitignored. Copy from `config/allowed-users.template.ts` to create it. Both login and registration check this list.

### Database
- SQLite at `./data/homie.db` (dev) or `/app/data/homie.db` (Docker), driven by Drizzle ORM + `better-sqlite3`
- `lib/db/index.ts` — singleton with WAL mode enabled
- `lib/db/schema.ts` — all table definitions and exported TypeScript types (`Ticket`, `InventoryItem`, `Meal`, `Event`, `User`, etc.)
- After any schema change: `npm run db:generate` then `npm run db:migrate`
- Date/timestamp columns use `integer({ mode: 'timestamp' })` — Drizzle expects `Date` objects, not strings. API routes must **not** pass raw JSON-parsed bodies directly into `.set()`; whitelist and type-cast fields explicitly.

### Data flow pattern
Pages under `app/(app)/` are **Server Components** that fetch data from the DB and pass it as props to a `'use client'` component. The client component manages local state and calls API routes for mutations.

**Kanban exception**: `KanbanBoard` uses `@dnd-kit/core` for drag-and-drop, which causes SSR hydration mismatches. It is imported via a `KanbanBoardClient` wrapper that uses `dynamic(..., { ssr: false })`. Any future component using dnd-kit must follow the same pattern.

### Adding a new feature/page
1. Add table(s) to `lib/db/schema.ts` → `npm run db:generate && npm run db:migrate`
2. Add API routes under `app/api/[feature]/route.ts` and `app/api/[feature]/[id]/route.ts`
3. Add page at `app/(app)/[feature]/page.tsx` (Server Component fetching data)
4. Add client component(s) under `components/[feature]/`
5. Add nav link in `components/Sidebar.tsx`

### Docker / RPi deployment
- Build: `docker buildx build --platform linux/arm64 -t homie .` (64-bit RPi 4)
- `docker-compose.yml` at repo root; mounts `homie_data` volume to `/app/data`
- `scripts/start.sh` runs Drizzle migrate then starts the Next.js standalone server
- `scripts/install.sh` sets up TLS certs, backup cron, and env config on the Pi
- `scripts/backup-db.js` backs up SQLite DB (baked into Docker image)
- Required env vars: `AUTH_SECRET`, `NEXTAUTH_URL`, `TAILSCALE_HOSTNAME`
- `next.config.ts` uses `output: 'standalone'` and `serverExternalPackages: ['better-sqlite3']`
