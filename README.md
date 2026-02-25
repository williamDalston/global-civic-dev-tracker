# Global Civic Development Tracker

A Next.js application that aggregates building permit data from government open data portals across major cities worldwide, enriches it with AI-generated analysis, and presents it in a searchable, SEO-optimized format with lead generation capabilities.

## Features

- **Multi-city permit tracking** — 6 cities across 4 countries (US, UK, AU, CA)
- **Automated ETL pipeline** — Pulls data from government open data APIs (Socrata, CKAN, custom portals)
- **AI-powered narratives** — GPT-4o-mini generated analysis for each permit
- **Interactive maps** — Leaflet maps showing neighborhoods and individual permits
- **Data visualization** — Charts for category distribution and monthly trends
- **Lead generation** — CTA banners and forms to connect users with local contractors
- **SEO optimization** — JSON-LD structured data, dynamic meta tags, sitemap, IndexNow
- **Admin dashboard** — Lead management, ETL monitoring, manual triggers

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Database | Neon PostgreSQL (serverless) |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS 4 |
| Maps | Leaflet + React-Leaflet |
| Charts | Recharts |
| AI | OpenAI GPT-4o-mini |
| Email | Resend |
| Validation | Zod |
| Testing | Vitest (unit), Playwright (E2E) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Neon PostgreSQL account
- OpenAI API key

### 1. Clone and Install

```bash
git clone https://github.com/williamDalston/Global-Civic-Development-Tracker.git
cd Global-Civic-Development-Tracker/global-civic-dev-tracker
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key for narrative generation |
| `CRON_SECRET` | Secret for cron job authentication (also used as admin password) |
| `REVALIDATION_SECRET` | Secret for on-demand ISR revalidation |
| `NEXT_PUBLIC_SITE_URL` | Your production URL (e.g., `https://yourdomain.com`) |

Optional variables:

| Variable | Description |
|----------|-------------|
| `INDEXNOW_KEY` | UUID for IndexNow search engine submission |
| `RESEND_API_KEY` | Resend API key for lead notification emails |
| `ADMIN_EMAIL` | Email address for lead notifications |
| `WASHINGTON_DC_API_TOKEN` | DC open data API token (increases rate limits) |
| `NYC_API_TOKEN` | NYC open data API token |
| `CHICAGO_API_TOKEN` | Chicago open data API token |
| `SYDNEY_API_TOKEN` | Sydney planning portal API token |
| `GOOGLE_SEARCH_CONSOLE_CREDENTIALS` | GSC credentials for page pruning |

### 3. Set Up Database

Create a Neon PostgreSQL database, then run the seed script:

```bash
npx tsx scripts/seed.ts
```

This populates the database with countries, cities, neighborhoods, and ETL sync states.

### 4. Run Initial ETL

Pull permit data from all 6 cities:

```bash
npx tsx scripts/etl-manual.ts
```

Or for a specific city:

```bash
npx tsx scripts/etl-manual.ts washington-dc
```

### 5. Generate AI Narratives

Generate AI descriptions for permits:

```bash
npx tsx scripts/generate-narratives.ts
```

Optional: specify batch size (default 50):

```bash
npx tsx scripts/generate-narratives.ts 100
```

### 6. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |
| `pnpm test:watch` | Run unit tests in watch mode |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm test:e2e:ui` | Run Playwright tests with UI |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

The `vercel.json` configures:
- Cron job to run ETL every 6 hours (`/api/etl/trigger`)
- Extended function timeout (300s) for ETL operations

### Manual Deployment

Build and start:

```bash
pnpm build
pnpm start
```

## Admin Dashboard

Access the admin dashboard at `/admin/login`. The password is your `CRON_SECRET` environment variable.

Features:
- View and manage leads
- Monitor ETL sync status
- Manually trigger ETL runs

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leads/capture` | POST | Capture lead form submissions |
| `/api/etl/trigger` | POST | Trigger ETL (requires auth) |
| `/api/revalidate` | POST | On-demand ISR revalidation |
| `/api/indexnow` | POST | Submit URLs to IndexNow |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (marketing)/        # Public marketing pages
│   ├── [country]/          # Dynamic country/city/neighborhood routes
│   ├── admin/              # Admin dashboard
│   └── api/                # API routes
├── components/             # React components
│   ├── charts/             # Recharts visualizations
│   ├── lead-generation/    # Lead forms and CTAs
│   ├── maps/               # Leaflet maps
│   ├── navigation/         # Header, footer, breadcrumbs
│   ├── permits/            # Permit cards and lists
│   ├── seo/                # JSON-LD structured data
│   └── ui/                 # Base UI components
├── lib/                    # Business logic
│   ├── ai/                 # OpenAI narrative generation
│   ├── auth/               # Admin authentication
│   ├── config/             # App configuration
│   ├── db/                 # Drizzle ORM schema and queries
│   ├── email/              # Resend email notifications
│   ├── etl/                # ETL pipeline and adapters
│   └── seo/                # SEO utilities
├── types/                  # TypeScript types
scripts/                    # CLI scripts
tests/                      # Unit and E2E tests
```

## Cities Supported

| City | Country | Data Source |
|------|---------|-------------|
| Washington DC | US | Socrata Open Data |
| New York City | US | Socrata Open Data |
| Chicago | US | Socrata Open Data |
| London | UK | Planning Portal |
| Sydney | AU | NSW Planning Portal |
| Toronto | CA | CKAN Open Data |

## License

MIT

## Contact

For questions or support, contact [info@alstonanalytics.com](mailto:info@alstonanalytics.com).
