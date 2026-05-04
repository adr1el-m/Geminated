# TriagePH

Health intelligence and triage platform with a public patient flow and an admin analytics dashboard.

## Stack
- React + Vite + TypeScript + Tailwind (apps/web)
- Node + Express + TypeScript (apps/api)
- PostgreSQL on Neon via Prisma (packages/db)
- Groq API for triage classification

## Setup
1. Install dependencies from the repo root:
   npm install
2. Copy environment variables:
   cp .env.example .env
3. Generate Prisma client (optional until database is ready):
   npm run db:generate
4. Start the API:
   npm run dev:api
5. Start the web app:
   npm run dev:web

## Environment Variables
- GROQ_API_KEY: Groq API key
- GROQ_MODEL: Groq model name
- DATABASE_URL: Neon/PostgreSQL connection string
- WEB_ORIGIN: Allowed web origin for CORS
- PORT: API port
