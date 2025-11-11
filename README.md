## Overview

Vercel-hosted Next.js app that will power the “one-number AI receptionist” MVP. The frontend dashboard lives in the App Router while backend responsibilities (Twilio webhooks, Supabase writes, Gemini orchestration) run through Express-based API routes.

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (Postgres + Auth + Storage)
- Twilio account/number
- Gemini API key

## Environment

Copy the example file and fill in keys from Supabase/Twilio/Gemini:

```bash
cp .env.local.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client for RLS-protected dashboard queries. |
| `SUPABASE_SERVICE_ROLE_KEY` | Used by Express handlers for Twilio + Gemini operations (never expose to client). |
| `SUPABASE_DB_URL` | Optional connection string for local scripts/migrations. |
| `GEMINI_API_KEY` / `GEMINI_FILE_SEARCH_LOCATION` | Gemini 2.5 Flash + File Search operations. |
| `TWILIO_*` | Voice webhook configuration + originating number. |

## Database Schema

All tables, triggers, and RLS policies live under `supabase/migrations/0001_init.sql`. To apply them to a Supabase instance:

```bash
supabase db push  # or psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_init.sql
```

Core objects:

- `bots`, `bot_members` — bot metadata + membership/roles.
- `calls`, `call_transcripts`, `call_summaries` — Twilio call lifecycle + AI summaries.
- `leads` — structured lead info extracted per call.
- `kb_files` — uploaded KB files linked to Gemini File Search.

Row-Level Security is enabled everywhere. Dashboard traffic uses Supabase Auth (respecting policies) while the Express backend uses the Service Role key for privileged operations (e.g., Twilio webhooks).

### Seeding baseline data

After running the migration, you can seed an owner user + demo bot:

1. Add the following to `.env.local` (or export before running):
   - `SEED_OWNER_EMAIL`
   - `SEED_OWNER_PASSWORD`
   - `SEED_OWNER_NAME`
   - `SEED_BOT_NAME`
   - `SEED_BOT_FORWARDING_NUMBER`
2. Run `npm run seed`.

The script will:
- Create (or fetch) a Supabase Auth user using the service role key.
- Insert a demo bot with the provided forwarding number.
- Link the user to the bot as `owner`.

You can then sign in to the dashboard using the seeded email/password.

## Supabase Clients

`src/lib/supabase/clients.ts` provides:

- `createSupabaseBrowserClient()` → use inside client components/hooks.
- `createSupabaseServerComponentClient()` → server components/actions bound to the caller’s session (RLS aware).
- `createSupabaseServiceRoleClient()` → only for trusted server-side handlers (Twilio/Gemini API routes, KB ingestion, seed scripts).

Both helpers assert that required environment variables are present so misconfiguration is caught early.

## Knowledge Base uploads

- Visit `/dashboard/bots` to view each bot and its associated documents.
- Uploads store the file in the Supabase bucket defined by `SUPABASE_KB_BUCKET` and insert a row into `kb_files`.
- Each bot gets a dedicated Gemini File Search store (created automatically if needed). Files are ingested via the [`uploadToFileSearchStore`](https://ai.google.dev/api/file-search/file-search-stores#method:-media.uploadtofilesearchstore) API described in `gemini-file-search-doc.md`.
- File status moves from `processing` → `ready` (or `failed`, with error surfaced in the UI). File uploads are limited to 4 MB to stay within serverless body size limits.

## Authentication flow

- Sign-ups are disabled; create users manually via Supabase Auth UI or the seed script.
- `middleware.ts` guards every `/dashboard/*` route and redirects unauthenticated visitors to `/login`.
- `/login` is a simple password form backed by a server action that calls `supabase.auth.signInWithPassword`. Successful logins redirect to `/dashboard/calls`.

## Local Development

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Twilio Webhooks on Vercel

- Voice webhook: `POST /api/twilio/voice`
- Gather action: `POST /api/twilio/voice/gather`
- Status callback: `POST /api/twilio/voice/status`

When running locally, expose your dev server via `ngrok http 3000` and point Twilio to the ngrok URLs. In production (Vercel), these routes are deployed automatically as serverless functions.

## Deployment

1. Create a Vercel project and import this repo.
2. Add the environment variables from `.env.local` to Vercel.
3. Link the project to your Supabase instance (service role key stays server-side only).
4. Point your Twilio webhook to the deployed `/api/twilio/voice` endpoint once it exists.
