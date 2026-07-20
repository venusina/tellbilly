# TellBilly

TellBilly is a voice-driven job, invoice, and expense tracker for tradespeople — built with [Expo](https://expo.dev) (React Native + TypeScript) and [Supabase](https://supabase.com).

This document is developer/contractor setup — for the in-app experience, see the app itself.

## Prerequisites

- Node.js 20 LTS or newer
- npm (ships with Node)
- A [Supabase](https://supabase.com) project (free tier is fine)
- For native builds: Xcode (iOS) and/or Android Studio (Android) — not required for web or Expo Go

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) if you don't already have one for this app.

3. **Apply the database schema.** Open your project's SQL editor in the Supabase dashboard and run [`supabase/schema.sql`](supabase/schema.sql) — it creates the `clients`, `jobs`, `expenses`, and `invoices` tables plus row-level security policies scoping every row to its owning user. Alternatively, if you have the [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your project:

   ```bash
   supabase db push
   ```

4. **Configure environment variables.** Copy the template and fill in your project's values (Supabase dashboard → Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

   See [Environment variables](#environment-variables) below for what each key is and where to find it. `.env.local` is gitignored — never commit real keys.

5. **Start the dev server**

   ```bash
   npm start
   ```

   From the Expo CLI output you can open the app in:
   - [Expo Go](https://expo.dev/go) (fastest way to try it on a physical device)
   - an iOS simulator (`npm run ios`) or Android emulator (`npm run android`)
   - a web browser (`npm run web`)

## Environment variables

See [`.env.example`](.env.example) for the full template. Summary:

| Variable | Required for | Where to find it |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Running the app | Supabase dashboard → Project Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Running the app | Supabase dashboard → Project Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Only `npm run seed` | Supabase dashboard → Project Settings → API → `service_role` key |

`EXPO_PUBLIC_*` variables are inlined into the app bundle at build time and are visible to anyone using the app — only ever put public-safe values there. The service role key bypasses row-level security entirely; it's used solely by the local seed script (never shipped in the app) and must stay out of version control.

## Project structure

```
src/
  app/            Expo Router routes (file-based) — screens are wired here
  screens/        Screen components rendered by routes in src/app/
  components/     Shared UI components (Button, Input, Card, ErrorBoundary, ...)
  hooks/          Data hooks (useJob, useInvoice, useExpense, useClient)
  services/       Supabase client + framework-free DB helpers
  context/        Cross-cutting React context (active job, voice confirmation state)
  theme/          Design tokens (colors, typography, spacing, radius)
  types/          Shared domain types (Client, Job, Expense, Invoice, VoiceCommand)
  utils/          Pure helper functions (invoice numbering/totals, etc.)
supabase/
  schema.sql      Database schema + row-level security policies
scripts/
  seed.mjs        Seeds a test account with sample clients/jobs/expenses/invoices
```

## Useful scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run ios` / `npm run android` / `npm run web` | Start the dev server targeting a specific platform |
| `npm run lint` | Lint the project |
| `npm run seed` | Seed a test account with sample data (see below) |

## Seeding sample data

`npm run seed` creates (or reuses) a test account and populates it with sample clients, jobs, expenses, and invoices — useful for trying out the app or writing tests without manually entering data every time.

Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (see [Environment variables](#environment-variables)). Optionally set `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` to control the test account's credentials; otherwise defaults are used and printed at the end of the run. See [`scripts/seed.mjs`](scripts/seed.mjs) for what gets created.

```bash
npm run seed
```

Re-running it is safe — it clears out that seed user's previous data before re-inserting, so you always end up with a consistent, known dataset.
