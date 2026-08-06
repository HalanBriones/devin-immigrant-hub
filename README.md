# Immigrant Community Hub

A web platform helping newcomers settle in Canada: community support, marketplace listings, local
events and trusted peer guidance in one place.

This repository is being built in **vertical slices** (schema → server logic → UI), one module at a
time. Shipped so far:

- **Phase 1 — Core schema:** Postgres + Drizzle, Canadian provinces/cities, languages, interests
- **Phase 2 — Auth & Profiles (Modules 1 & 2):** registration, login, password reset, email and
  phone verification badges, profile editing and public profile pages with reputation

Next up: communities & discussions, marketplace, events, notifications & moderation.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, server actions) + TypeScript |
| Database | PostgreSQL via Drizzle ORM (`postgres` driver) |
| Auth | Email/password with bcrypt, DB-backed sessions in an httpOnly cookie |
| Styling | Tailwind CSS v4 |
| Validation | Zod |

Email and SMS delivery sit behind the `EmailSender` / `SmsSender` interfaces in `src/lib/notify`;
the default adapters log to the server console so verification works locally without a provider.

## Getting started

```bash
# 1. Start Postgres (any Postgres 14+ works)
docker run -d --name ich-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=immigrant_hub -p 5432:5432 postgres:16

# 2. Configure the environment
cp .env.example .env.local

# 3. Install, migrate, seed
npm install
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev
```

Open http://localhost:3000, create an account, then check the terminal running `npm run dev` for
the email verification link and the SMS verification code.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev, production build, production server |
| `npm run lint` / `typecheck` | ESLint, `tsc --noEmit` |
| `npm run db:generate` | Generate a SQL migration from the Drizzle schema |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed provinces, cities, languages and interests |
| `npm run db:studio` | Browse the database with Drizzle Studio |

## Layout

```
src/
  app/                    routes: (auth) public auth pages, (app) signed-in pages, /u/[handle]
  modules/                vertical slices — each owns schema, server actions, queries and UI
    auth/  profiles/  geo/
  db/                     Drizzle client, aggregated schema, seed script
  lib/                    session/password/token helpers, notification adapters, shared utils
  components/ui/          shared presentational primitives
drizzle/                  generated SQL migrations
```

## Data model (current slices)

- `users` — credentials, role, `email_verified_at`, `phone_verified_at`
- `sessions` — hashed session tokens with expiry
- `verification_tokens` — hashed email links, phone codes and password reset tokens
- `profiles` — handle, display name, bio, origin country, province/city, occupation, reputation
- `profile_languages`, `profile_interests` — many-to-many with seeded reference tables
- `reputation_events` — append-only audit trail; `profiles.reputation_score` is the running sum
- `provinces`, `cities`, `languages`, `interests` — seeded reference data (Canada)

## Out of scope for V1

Private messaging, payments, native mobile apps, AI assistants, and organization/business profiles.
