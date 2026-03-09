# Homie

A household management app for two. Runs locally on a Raspberry Pi, accessible from any browser on the home network.

## Features

- **Kanban board** — shared task/chore tracking with drag-and-drop (todo, in progress, blocked, QA, done)
- **Inventory** — food/drink storage tracker with expiry dates
- **Meal planner** — weekly view (Mon–Sun) with 5 meal slots per day
- **Calendar** — household events and appointments

## Stack

- Next.js 16 (App Router) + TypeScript
- SQLite + Drizzle ORM — data stored in a single local file (`./data/homie.db`)
- Auth.js v5 — email/password login, invite-only via allowlist
- Tailwind CSS v4 + shadcn/ui
- Docker + docker-compose for RPi deployment

## Data persistence

All data is stored in a SQLite file on disk. In development this is `./data/homie.db`. In Docker it lives in a named volume (`homie_data`) mounted at `/app/data`, so it survives container restarts and image updates.

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

## Database scripts

```bash
npm run db:generate   # Generate migrations after schema changes
npm run db:migrate    # Apply pending migrations
npm run db:studio     # Open Drizzle Studio (browser UI for the DB)
npm run reset-password  # Reset a user's password via CLI
```

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out the [Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
