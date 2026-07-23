# wohnschreiber

App that helps you apply to WG-Gesucht room listings faster: paste a listing URL, it scrapes the
key facts (rent, address, contact name) and generates a tailored application (cover letter,
Selbstauskunft) using Mistral AI, backed by your saved profile and documents.

## Stack

SvelteKit (TypeScript), Tailwind CSS, Drizzle ORM (PostgreSQL), better-auth, Paraglide (i18n:
en/de), Playwright + Vitest, Mistral AI.

## Setup

```sh
bun install
```

Copy `.env.example` to `.env` and fill in the values:

- `DATABASE_URL` — PostgreSQL connection string
- `ORIGIN` — public origin of the app (needed by better-auth)
- `BETTER_AUTH_SECRET` — high-entropy secret (32+ chars in production)
- `MISTRAL_API_KEY` — Mistral AI API key, used to generate applications
- `UPLOAD_DIR` — local directory for uploaded documents/portraits

Start the database (Docker) and push the schema:

```sh
bun run db:start
bun run db:push
```

## Developing

```sh
bun run dev

# or start the server and open the app in a new browser tab
bun run dev -- --open
```

## Building

```sh
bun run build
```

Preview the production build with `bun run preview`.

## Testing & linting

```sh
bun run test        # unit tests + e2e (Playwright)
bun run test:unit    # unit tests only
bun run lint         # prettier + eslint
```

## Deploying (Coolify)

The app ships with a `Dockerfile` (multi-stage, bun-based) building the `adapter-node` output.

1. In Coolify, create a new resource from this git repo — it will detect the `Dockerfile` automatically.
2. Set env vars: `DATABASE_URL`, `ORIGIN` (public URL, e.g. `https://yourapp.example.com`), `BETTER_AUTH_SECRET` (32+ random chars), `MISTRAL_API_KEY`, `UPLOAD_DIR` (e.g. `/app/uploads`).
3. Mount a persistent volume at `UPLOAD_DIR` so uploaded documents survive redeploys.
4. Point `DATABASE_URL` at a Postgres instance (a Coolify-managed Postgres service works fine), then run the schema once against it: `bun run db:push` (or `db:migrate` if you generate migrations) from a machine/shell that can reach that database.
5. The container listens on port `3000` (`HOST=0.0.0.0`, `PORT=3000`, both set in the image) — point Coolify's proxy at that port.

## Database

```sh
bun run db:generate  # generate a new migration from schema changes
bun run db:migrate   # apply migrations
bun run db:studio    # open Drizzle Studio
```
