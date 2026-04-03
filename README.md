## Geminated

## STAR-LINK: Community Collaboration Hub for STEM Educators

STAR-LINK is a community-driven collaboration hub designed to complement and enrich e-STAR.ph.

While e-STAR.ph serves as a static repository of lesson exemplars and training materials, STAR-LINK adds a dynamic social layer where educators can:

- Share action research and extension projects
- Discuss implementation challenges with peers
- Build mentorship and cross-school support networks

The goal is to transform isolated innovations into nationally shared assets for continuous STEM education improvement.

## 1. Objective

Build a collaboration hub that enables STEM teachers to contribute, connect, and co-develop practices around the e-STAR.ph ecosystem.

Primary outcomes:

- Increase educator participation in knowledge-sharing
- Support region-specific problem solving
- Provide evidence-based insights for STAR program planning

## 2. UI/UX Alignment with e-STAR.ph

Even though the current e-STAR.ph portal is not publicly accessible, STAR-LINK will follow a design language consistent with typical DOST-SEI resource portals: clear, professional, and usability-focused.

### 2.1 Visual Direction

- Color palette: blue/green/white aligned with DOST-SEI branding
- Typography: professional, accessible sans-serif stack
- Accessibility: strong contrast, readable type scale, and keyboard-friendly navigation

### 2.2 Navigation Model

- Preferred: add a new Community section within the existing e-STAR.ph menu
- Fallback: standalone STAR-LINK site with a persistent header link back to e-STAR.ph
- Experience goal: both platforms should feel like one ecosystem

### 2.3 Responsive Strategy

- Mobile-first layouts for low-bandwidth and smartphone-heavy usage contexts
- Progressive enhancement for tablet/desktop dashboards and data views

## 3. Core MVP Features

### 3.1 Teacher Profiles

- Sign-up via DepEd email or standard email registration
- Profile fields:
  - Region
  - School
  - Subjects taught
  - Years of experience
  - Optional e-STAR.ph account link
- Role support: teacher and admin

### 3.2 Action Research and Extension Repository

- Upload action research papers (PDF)
- Capture metadata: title, abstract, keywords
- Upload extension project entries (e.g., science fair, training module, community outreach)
- Tagging and filtering:
  - Region
  - Subject
  - Grade level

### 3.3 Regional Discussion Forums

- Dedicated forum spaces by region (or division, when needed)
- Features:
  - Thread creation and replies
  - Topic tagging
  - Trending topics view
- Value: surfaces urgent field needs for program managers

### 3.4 Collaboration Map

- Map view of interaction clusters among educators and schools
- Track collaboration density by geography
- Detect isolated schools with low activity for Twinning intervention targeting

### 3.5 Admin Dashboard

- Aggregate analytics:
  - Active users
  - Most downloaded/shared resources
  - Most discussed topics
  - Collaboration density by region
- Exportable reports for annual planning and resource allocation

## 4. Technical Approach

### 4.1 Frontend

- React (recommended) or Vue
- Component library and theme tokens aligned to e-STAR.ph visual identity
- Key priorities:
  - Fast loading on mobile networks
  - Accessible forms and forum interactions
  - Search and filter usability

### 4.2 Backend

- Node.js + Express (recommended) or Django REST Framework
- REST API for profiles, resources, forums, analytics, and map data

### 4.3 Database

- PostgreSQL as primary data store
- PostGIS extension for collaboration map and geospatial analytics

### 4.4 Authentication and Authorization

- Email/password authentication
- Role-based access control:
  - Teacher
  - Admin

## 4.5 Current Tech Stack (Implemented)

- Framework: Next.js 16 (App Router)
- UI Library: React 19
- Language: TypeScript
- Styling: CSS Modules + global CSS
- Authentication: Custom email/password auth + session cookies
- Password Hashing: bcryptjs
- Database: Neon Postgres (PostgreSQL)
- Query Layer: `@neondatabase/serverless` + `drizzle-orm`
- File Storage:
  - Binary documents in PostgreSQL (`bytea`) for current uploads
  - `@vercel/blob` available for blob storage integration
- Maps and Geospatial UI: Leaflet + React Leaflet
- Optional Auth Integration Available: NextAuth v5 beta (installed)
- Optional Backend Integration Available: Supabase JS SDK (installed)
- Tooling:
  - ESLint 9 + `eslint-config-next`
  - TypeScript 5
  - Drizzle Kit (schema/migration tooling)
  - npm scripts: `dev`, `build`, `start`, `lint`, `seed`

## 5. Success Metrics

### 5.1 Adoption

- Number of registered teachers
- Monthly active contributors to repository and forums

### 5.2 Collaboration

- Growth in cross-school interactions
- Increase in mentorship requests and fulfilled collaborations

### 5.3 Insights

- Number and quality of admin-generated reports
- Demonstrated impact of dashboard insights on STAR annual planning

## 6. Suggested MVP Delivery Phases

### Phase 1: Foundation

- User registration/login
- Teacher profiles
- Basic resource upload and listing

### Phase 2: Community Layer

- Regional forums
- Trending topics
- Moderation basics

### Phase 3: Intelligence Layer

- Collaboration map
- Admin analytics dashboard
- Report export workflows

## 7. Production and Commercial Readiness

### 7.1 Security Hardening Included

- App-wide security headers via Next.js config:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` locks camera/mic/geolocation
  - `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`
  - `Strict-Transport-Security` in production
- Auth and community server actions protected with rate limiting
- Document download endpoint hardened with:
  - UUID validation
  - download rate limiting
  - filename sanitization
  - private/no-store caching

### 7.2 Environment and Configuration

- Use `.env.example` as the baseline for required deployment variables.
- `DATABASE_URL` is required.
- Supabase public env vars are required in production.

### 7.3 Operational Health and Deploy Checks

- Health probe endpoint: `GET /api/health`
- CI-safe scripts:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run ci` (runs all checks above)

### 7.4 Go-Live Checklist

- Configure HTTPS and secure domain.
- Rotate and store secrets in your cloud secret manager.
- Run database backups and restore drills.
- Add centralized error monitoring and uptime alerts.
- Load test critical flows (login, upload, forum, admin moderation).
- Configure legal/compliance pages (terms, privacy, data retention).

## Team

<div align="center">
  <table border="0" cellpadding="14" cellspacing="0" style="border-collapse: collapse;">
    <tr>
      <td align="center" style="border: 1px solid #30363d; width: 220px;">
        <img src="public/img/janel.jpeg" alt="Janel Rose Trongcoso" width="120" height="120" style="object-fit: cover;"><br><br>
        <strong>Janel Rose Trongcoso</strong><br>
        <a href="https://www.linkedin.com/in/janel-rose-trongcoso-24467b23a/">
          <img src="https://img.shields.io/badge/LINKEDIN-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
        </a>
      </td>
      <td align="center" style="border: 1px solid #30363d; width: 220px;">
        <img src="public/img/gem.jpeg" alt="Gem Christian Lazo" width="120" height="120" style="object-fit: cover;"><br><br>
        <strong>Gem Christian Lazo</strong><br>
        <a href="https://www.linkedin.com/in/gemchristianolazo/">
          <img src="https://img.shields.io/badge/LINKEDIN-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
        </a>
      </td>
      <td align="center" style="border: 1px solid #30363d; width: 220px;">
        <img src="public/img/adriel.jpg" alt="Adriel Magalona" width="120" height="120" style="object-fit: cover;"><br><br>
        <strong>Adriel Magalona</strong><br>
        <a href="https://www.linkedin.com/in/adr1el/">
          <img src="https://img.shields.io/badge/LINKEDIN-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
        </a>
      </td>
    </tr>
  </table>

  <table border="0" cellpadding="14" cellspacing="0" style="border-collapse: collapse; margin-top: 12px;">
    <tr>
      <td align="center" style="border: 1px solid #30363d; width: 220px;">
        <img src="public/img/marti.jpeg" alt="Marti Kier Trance" width="120" height="120" style="object-fit: cover;"><br><br>
        <strong>Marti Kier Trance</strong><br>
        <a href="https://www.linkedin.com/in/marti-kier-trance-125371370/">
          <img src="https://img.shields.io/badge/LINKEDIN-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
        </a>
      </td>
      <td align="center" style="border: 1px solid #30363d; width: 220px;">
        <img src="public/img/christine.jpeg" alt="Christine Rio" width="120" height="120" style="object-fit: cover;"><br><br>
        <strong>Christine Rio</strong><br>
        <a href="https://www.linkedin.com/in/riochristine/">
          <img src="https://img.shields.io/badge/LINKEDIN-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
        </a>
      </td>
    </tr>
  </table>
</div>