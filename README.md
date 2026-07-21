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

## Database

```sh
bun run db:generate  # generate a new migration from schema changes
bun run db:migrate   # apply migrations
bun run db:studio    # open Drizzle Studio
```
