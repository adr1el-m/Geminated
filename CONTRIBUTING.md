# Contributing to STAR-LINK

Thank you for your interest in contributing to STAR-LINK. This document covers local setup, project conventions, and how to submit changes.

---

## Prerequisites

| Tool | Minimum Version |
|:-----|:----------------|
| Node.js | 18.x |
| npm | 9.x |
| PostgreSQL | 14.x (Neon recommended) |

---

## Local Development Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-org/geminated.git
cd geminated
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and set at minimum:

```
DATABASE_URL=postgres://user:password@host:5432/database
```

See `.env.example` for the full reference of available variables.

### 3. Initialise the database

Run the schema migration against your Neon database:

```bash
psql "$DATABASE_URL" -f src/lib/db/schema.sql
```

Then seed with sample data:

```bash
npm run seed
```

### 4. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Project Structure

| Path | Purpose |
|:-----|:--------|
| `src/app/` | Next.js App Router pages, layouts, and server actions |
| `src/components/` | Shared React components |
| `src/lib/` | Core logic, database queries, and utility functions |
| `src/lib/db/schema.sql` | Canonical database schema (DDL) |
| `public/` | Static assets served at the root |
| `scripts/` | One-off scripts (database seeding, etc.) |

---

## Code Conventions

- **Language**: TypeScript throughout. Run `npm run typecheck` before committing.
- **Styling**: CSS Modules for component-scoped styles; `globals.css` for design tokens and utility classes.
- **Server actions**: All mutations go in `src/app/actions/`. Client components import from there.
- **Database queries**: Raw Neon SQL via the `db` tagged template. No ORM for queries; Drizzle Kit is used for schema management only.
- **Validation**: All server action inputs are validated server-side before touching the database. Never trust FormData values without validation.
- **Error handling**: Use `toMessage(error)` for user-facing error strings. Never expose internal error messages to the client.

---

## Branch Strategy

| Branch | Purpose |
|:-------|:--------|
| `main` | Production-ready code. Protected. Merge via PR only. |
| `dev` | Integration branch. All feature branches target this. |
| `feature/<name>` | Individual feature development. |
| `fix/<name>` | Bug fixes. |

---

## Quality Checks

Before opening a pull request, ensure all checks pass:

```bash
npm run lint       # ESLint — zero errors required
npm run typecheck  # TypeScript — zero type errors required
npm run build      # Production build — must succeed cleanly
```

Or run all at once:

```bash
npm run ci
```

---

## Database Schema Changes

1. Add the migration SQL to `src/lib/db/schema.sql` using `ADD COLUMN IF NOT EXISTS` or equivalent idempotent DDL.
2. Apply to your local database: `psql "$DATABASE_URL" -f src/lib/db/schema.sql`
3. Update any affected TypeScript types in `src/lib/auth.ts` or the relevant `src/lib/*.ts` file.
4. Update `scripts/seed-neon.mjs` if the seed data needs to reflect the new schema.

---

## Reporting Issues

Open an issue describing:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Relevant environment details (Node version, database version, deployment context)
