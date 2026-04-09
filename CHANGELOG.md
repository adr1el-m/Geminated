# Changelog

All notable changes to STAR-LINK are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-04-09

### Added

**Platform Features**
- Teacher profile registration with region, division, school, qualification level, gender, age bracket, years of experience, subjects taught, and STAR participation status
- Role-based access control: Teacher and Admin roles
- STAR ID generation for every registered educator (format: `STAR-YYYY-XXXXXX`)
- Action research and extension resource repository with PDF upload, moderation, and download
- Regional discussion forums with thread creation, replies, moderation, and topic tagging
- Interactive collaboration map using Leaflet and GeoJSON Philippines ADM1 boundaries
- Admin dashboard with aggregate analytics: active users, resources, forum activity, regional density
- Regional comparison charts and trend analysis via Recharts
- PDF report generation and export via jsPDF and jspdf-autotable
- Bulk educator data import via CSV
- Program delivery and feedback tracking modules
- Notification system for admin-targeted alerts on new registrations

**Security**
- App-wide security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`
- `Strict-Transport-Security` (HSTS) enabled in production builds
- `poweredByHeader: false` to suppress Next.js fingerprinting
- Email/password authentication with bcryptjs (cost factor 10)
- Session tokens stored in PostgreSQL `auth_sessions` table with 30-day TTL
- In-process rate limiting on login and registration endpoints
- Document download endpoint hardened with UUID validation, filename sanitisation, and `private/no-store` cache policy
- Input validation and allowlist enforcement for all enumerated fields (region, occupation, gender, etc.)
- Duplicate profile detection via unique index on `(lower(full_name), lower(school), region, division)`
- Audit trail logging for profile registration and updates

**Compliance**
- PDPA-aligned consent fields: data processing consent, research consent, anonymisation opt-out
- Consent version and timestamp recorded at acceptance
- Terms and Conditions page with version tracking; users prompted to re-accept on version change
- `robots.txt` disallowing admin, API, and auth routes

**Operational**
- Health probe endpoint: `GET /api/health` — checks database connectivity and returns `503` on failure
- Standalone Next.js output (`output: 'standalone'`) for containerised deployments
- `npm run ci` script: runs lint, typecheck, and build in sequence
- `.env.example` with complete variable reference and runtime behaviour documentation
- Branded 404 (`not-found.tsx`) and global error boundary (`error.tsx`) pages
- `CONTRIBUTING.md` with local setup, conventions, and branch strategy
- Light and dark mode with persistent user preference via `data-theme` attribute

---

## [0.1.0] — Initial Development

- Initial project scaffolding with Next.js 16 App Router and React 19
- Neon Postgres integration via `@neondatabase/serverless`
- Base schema: profiles, auth_sessions, forum_posts, forum_comments, resources, notifications, audit_logs, map_region_snapshots
