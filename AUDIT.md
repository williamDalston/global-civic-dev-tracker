# Full Site Audit — Global Civic Development Tracker

---

## 1. PROJECT IDENTITY & PURPOSE

**What this site IS**: A programmatic SEO web application that aggregates municipal building permit data from 6 major cities worldwide (Washington DC, NYC, Chicago, London, Sydney, Toronto), normalizes it into a unified schema, and publishes thousands of SEO-optimized pages organized by country > city > neighborhood > permit. It monetizes through contractor lead generation — when homeowners discover a permit near them, they can request quotes from local contractors.

**Target audience**: Homeowners researching nearby construction activity (35-65, desktop-heavy), real estate investors tracking development trends (30-55, mixed devices), contractors seeking new leads (25-55, mobile-heavy), and urban planning enthusiasts (25-45, desktop). Estimated 60/40 desktop/mobile split given the data-dense nature of permit tables and maps.

**Core value proposition**: The only site that aggregates and normalizes building permit data across 6 cities in 4 countries into a single searchable, browsable interface with AI-generated analysis and neighborhood-level intelligence. Government open data portals are fragmented, use different schemas, and lack neighborhood context.

**Competitive landscape**:
- **BuildZoom** — US-only, contractor-focused, less SEO-oriented, no international coverage
- **Permitium** — Government SaaS for permit processing, not consumer-facing
- **Local government portals** — Raw data only, no cross-city comparison, no AI analysis, terrible UX

What makes this different: Multi-city/multi-country aggregation, AI narratives per permit, neighborhood-level intelligence, programmatic SEO at scale, and contractor lead gen monetization.

---

## 2. ARCHITECTURE OVERVIEW

**Tech stack**:
- Framework: Next.js 16.1.6 (App Router, React 19, Turbopack)
- Language: TypeScript 5
- Styling: Tailwind CSS 4 (CSS-based config, `@theme` directive)
- Hosting: Vercel (with cron jobs)
- Database: Neon PostgreSQL (via `@neondatabase/serverless` + Drizzle ORM)
- AI: OpenAI GPT-4o-mini (narrative generation)
- Email: Resend (lead notifications)
- Maps: Leaflet + react-leaflet (OpenStreetMap tiles)
- Charts: Recharts 3
- Validation: Zod 4
- Analytics: Google Analytics 4 + Plausible (both optional)

**File/folder structure**:
```
global-civic-dev-tracker/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── (marketing)/            # Homepage, privacy, terms
│   │   ├── [country]/[city]/...    # Dynamic permit pages (4 levels deep)
│   │   ├── admin/                  # Admin dashboard (cookie-auth protected)
│   │   ├── api/                    # 7 API routes (ETL, leads, revalidate, indexnow, admin)
│   │   ├── sitemap.ts              # Dynamic XML sitemap generation
│   │   └── robots.ts               # SEO robots.txt
│   ├── components/
│   │   ├── ui/                     # Primitives (Card, Badge, Button, Input, Textarea, Pagination, Skeleton)
│   │   ├── permits/                # PermitCard
│   │   ├── maps/                   # Leaflet maps (PermitMap, NeighborhoodMap, dynamic wrappers)
│   │   ├── charts/                 # Recharts (CategoryChart, TrendChart, dynamic wrappers)
│   │   ├── navigation/             # Header, Footer, Breadcrumbs
│   │   ├── lead-generation/        # CTA banner, Lead form
│   │   ├── seo/                    # JsonLd component
│   │   └── analytics/              # GA4 + Plausible script loader
│   ├── lib/
│   │   ├── db/                     # Drizzle schema, connection, queries (admin, cities, leads, neighborhoods, permits)
│   │   ├── etl/                    # Pipeline orchestrator, 6 city adapters, transformers, loaders, AI narrator
│   │   ├── seo/                    # Meta builders, structured data, IndexNow client
│   │   ├── email/                  # Resend lead notification
│   │   ├── auth/                   # Admin session (cookie-based)
│   │   ├── config/                 # Cities, countries, constants, env validation
│   │   └── utils/                  # Rate limiter, retry, slugify, pagination, cn, format
│   ├── proxy.ts                    # Middleware (rate limiting, admin auth, method enforcement)
│   └── types/                      # TypeScript type definitions
├── scripts/                        # seed.ts, etl-manual.ts, generate-narratives.ts, prune-pages.ts
├── tests/
│   ├── unit/                       # 16 test files, 138 tests (vitest)
│   └── e2e/                        # 4 Playwright specs
├── drizzle/                        # Migration output
├── vercel.json                     # Cron config (ETL every 6h)
└── package.json
```

**Data flow**:
1. Vercel cron hits `GET /api/etl/trigger` every 6 hours
2. `runFullETL()` iterates 6 city adapters, each fetching from government APIs
3. Raw records → `transformToUniversal()` → `normalizePermit()` → `ensureValidCategory()`
4. Batch upsert to PostgreSQL `permits` table via Drizzle ORM
5. Sync state watermarked in `etl_sync_state` table
6. Separate script generates AI narratives for permits missing them
7. ISR revalidation triggered for affected pages
8. New URLs submitted to IndexNow for fast indexing
9. Users browse pages → find permits → submit lead form → saved to `leads` table → email notification sent

**Database schema** (7 tables):

| Table | Key Fields | Relationships |
|-------|-----------|---------------|
| `countries` | id, name, slug, code (2-char) | → cities |
| `cities` | id, countryId, name, slug, timezone, centerLat/Lng, apiSource, etlEnabled | → neighborhoods, permits |
| `neighborhoods` | id, cityId, name, slug, clusterId, centerLat/Lng | → permits |
| `permits` | id (bigserial), globalPermitId, cityId, neighborhoodId, issueDate, propertyAddress, workDescription, permitCategory, permitType, status, estimatedCost, lat/lng, slug, aiNarrative, rawData (JSONB), noindex | FK → city, neighborhood |
| `etl_sync_state` | id, cityId (unique), lastSyncAt, lastOffset, recordsSynced, status, errorMessage | FK → city |
| `leads` | id (bigserial), permitId, cityId, name, email, phone, message, workType, status, routedTo (JSONB), sourceUrl, utmSource/Medium | FK → city, permit |
| `sitemap_tracking` | id, urlPath (unique), pageType, lastModified, indexnowSent | — |

**API routes**:

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/etl/trigger` | GET | CRON_SECRET Bearer | Trigger full ETL pipeline |
| `/api/leads/capture` | POST | None (rate-limited) | Lead form submission |
| `/api/revalidate` | POST | REVALIDATION_SECRET Bearer | ISR cache invalidation |
| `/api/indexnow` | POST | REVALIDATION_SECRET Bearer | Submit URLs to search engines |
| `/api/admin/auth` | POST/DELETE | None (login) / Cookie (logout) | Admin session management |
| `/api/admin/leads` | GET/PATCH | Cookie session | Lead listing + status update |
| `/api/admin/etl/trigger` | POST | Cookie session | Admin ETL trigger |

**Third-party integrations**:
- OpenAI (GPT-4o-mini) — AI narrative generation
- Resend — Lead notification emails
- OpenStreetMap — Map tiles (free, no API key)
- IndexNow/Bing — Fast search indexing
- Google Analytics 4 — Traffic analytics (optional)
- Plausible — Privacy-friendly analytics (optional)
- Neon — Serverless PostgreSQL

**State management**: Minimal — React 19 `useState` in 4 client components (login form, lead form, ETL trigger button, lead status dropdown). Everything else is Server Components.

---

## 3. CURRENT STYLING & DESIGN AUDIT

### Color Palette

**Dark mode (active — `class="dark"` on html)**:
| Role | HSL | Hex (approx) |
|------|-----|------|
| Background | 222 47% 5% | `#0B1120` |
| Foreground | 210 40% 98% | `#F8FAFC` |
| Card | 222 47% 7% | `#111827` |
| Border | 217 33% 17% | `#2D3748` |
| Muted | 217 33% 12% | `#1E293B` |
| Muted foreground | 215 20% 65% | `#94A3B8` (bumped from 55% for WCAG AA) |
| Primary | 217 91% 60% | `#60A5FA` |
| Primary foreground | 222 47% 5% | `#0B1120` |
| Destructive | 0 63% 31% | `#7F1D1D` |
| Success | 142 70% 45% | `#4ADE80` |
| Warning | 38 92% 50% | `#FBBF24` |
| Ring | 224 76% 48% | `#6366F1` |

### Typography
- **Primary font**: Geist (Google Font, sans-serif)
- **Monospace**: Geist Mono
- **Heading sizes**: `text-5xl` (48px) hero → `text-3xl` (30px) section headers → `text-2xl` (24px) subsections → `text-lg` (18px) card titles
- **Body**: `text-sm` (14px) default, `text-base` (16px) for descriptions
- **Weights**: 500 (medium), 600 (semibold), 700 (bold)
- **Tracking**: `-0.025em` (tight) on headings, `0.1em` (widest) on section labels

### Border Radius
- Base: `0.5rem` (8px) — `--radius`
- Cards: `rounded-xl` (12px)
- Badges: `rounded-full` (pill)
- Buttons: `rounded-lg` (8px)
- Inputs: `rounded-lg` (8px)

### Spacing System
Tailwind 4 scale — consistent use of `p-4` (16px), `p-6` (24px), `gap-4` (16px), `gap-6` (24px). Page containers use `max-w-7xl px-4 py-8 sm:px-6 lg:px-8`. Section spacing: `mt-16` (64px) between major sections.

### Shadow Usage
- Cards: `shadow-sm` base
- Hover: Custom glow — `0 8px 25px -5px hsl(primary/0.08)`
- Header logo hover: `shadow-md shadow-primary/30`
- Decorative: `.glow-blue` (20px + 60px blur), `.glow-dot` (8px blur on status dots)

### Button Styles
- Default: `bg-primary text-primary-foreground rounded-lg h-10 px-4 text-sm font-semibold`
- Hover: `bg-primary/90`
- Sizes: sm (h-8), md (h-10), lg (h-12)
- Variants: default, secondary, outline, ghost, destructive

### Card/Container Styles
- `rounded-xl border border-border bg-card shadow-sm`
- Hover: `card-hover-lift` class with transform + glow shadow
- Content padding: `p-6`

### Navigation
- **Header**: Sticky top, `h-16` (64px), `backdrop-blur-xl`, `bg-background/80`
- **Footer**: 4-column grid (md+), links with hover, bottom copyright bar
- **Breadcrumbs**: SVG chevron separators, hover backgrounds
- **Mobile**: Header collapses to logo + minimal links

### Responsive Breakpoints
- `sm` (640px) — 2-column grids, increased padding
- `md` (768px) — 4-column footer
- `lg` (1024px) — 3-column permit grids, 4-column stat cards

### Animations
9 custom keyframe animations: fade-in-up, fade-in, slide-in-right, pulse-glow, shimmer, gradient-shift, float, count-up, grid-fade. Stagger delays (75ms increments). Gradient text effect with 6s animation cycle.

### Dark Mode
Always on — `class="dark"` hardcoded on `<html>`. Complete dark theme with all variables defined.

### Icon System
Inline SVG icons throughout — no icon library. Consistent `h-5 w-5` or `h-6 w-6` sizing.

### Image Handling
No raster images used. Only inline SVGs, emoji flags, and dynamically generated OG images via `next/og`.

---

## 4. TARGET AUDIENCE PSYCHOLOGY & STYLING RECOMMENDATIONS

### Visual Language Expected
This audience (homeowners, investors, contractors) expects **trustworthy, data-forward, professional** design. Think Bloomberg Terminal meets Zillow. The current dark theme is strong — it feels like a premium data product. Key expectations:
- Clean data tables with clear hierarchy
- Maps that feel precise, not playful
- Trust signals (data source attribution, update frequency, city count)
- Professional typography (Geist is excellent for this)

### Specific Styling Changes

1. **Increase body text contrast** — `text-muted-foreground` at HSL 215 20% 55% is slightly low contrast on the dark background. Bump to `215 20% 65%` for WCAG AA compliance on `text-sm`.

2. **Add data freshness indicators** — Show "Last updated 2h ago" on city pages with a green dot. The infrastructure exists (etl_sync_state) but isn't surfaced to users.

3. **Improve permit card information density** — Cards currently show 5 fields. Add a subtle "Estimated cost" bar or tag when available — cost is the #1 thing homeowners care about.

4. **Add search/filter to neighborhood pages** — Currently just a paginated list. Add category filter pills (like admin leads page) and address search. This dramatically improves time-on-site.

5. **Mobile touch targets** — Nav links and filter pills should be minimum 44px tall. Current `h-10` (40px) buttons are close but breadcrumb links are too small on mobile.

6. **CTA button prominence** — The "Get 3 Quotes" CTA should use a contrasting warm color (amber/orange) against the blue primary. Blue on blue doesn't pop enough.

7. **Add "neighborhood at a glance" summary cards** — Before the permit list on neighborhood pages, show 3-4 stat cards (total permits, avg cost, most common type, recent activity) like the city page does.

### Conversion Psychology
- CTA banner now appears on permit detail, neighborhood, and city pages — good funnel coverage
- Sticky bottom CTA bar on mobile for permit pages (scrolls to form)
- Trust signals on CTA: green checkmarks for "Free, no obligation" and "Licensed pros"
- Inline form expansion (click to reveal) reduces friction vs. navigating to separate page
- Amber button color contrasts with blue primary for maximum CTA visibility
- **Still needed**: Social proof ("X contractors in this area"), progress indicator on form

---

## 5. DOMAIN NAME RECOMMENDATIONS

| Rank | Domain | Why It Works | TLD | Availability | SEO Keywords |
|------|--------|-------------|-----|-------------|-------------|
| 1 | **civictracker.com** | Already referenced in codebase as default. Short, memorable, brandable. "Civic" conveys government data authority. | .com | Likely available (niche term) | civic, tracker |
| 2 | **permitwatch.com** | Direct keyword match for "building permits." Implies monitoring/alerting. Easy to remember. | .com | Possibly taken — check immediately | permit, watch |
| 3 | **buildpermits.co** | Keyword-rich, action-oriented. .co is accepted for startups. | .co | Likely available | build, permits |
| 4 | **neighborhoodpermits.com** | Long but extremely keyword-rich. Matches the site's neighborhood-level value prop. Great for SEO. | .com | Likely available (very specific) | neighborhood, permits |
| 5 | **permitdata.io** | Clean, data-focused brand. .io signals tech/data product. | .io | Likely available | permit, data |

---

## 6. MONETIZATION PLAN

### Critical Bug Found & Fixed (Feb 25, 2026)

**The entire revenue pipeline was broken.** The `LeadForm` component existed but was never rendered on any page. The `CTABanner`'s "Get Free Quotes" button called `onGetQuotes` which was never passed as a prop — clicking it did nothing. Every organic visitor landed on a dead end with no way to convert.

**Conversion funnel before fix:**
| Page Type | Organic Traffic | Lead Form | Result |
|-----------|----------------|-----------|--------|
| Homepage | High | None | Dead end — bottom CTA just links to "Browse permits" |
| Country pages | Medium | None | Dead end — no CTA at all |
| City pages | High (SEO hubs) | None | Dead end — no CTA at all |
| Neighborhood pages | High (SEO hubs) | None | Dead end — no CTA at all |
| Permit detail pages | Highest (millions) | Button does nothing | **BROKEN** — `onGetQuotes` was undefined |

**Fixes applied:**
1. **CTABanner** — Rewritten to expand and show `LeadForm` inline when "Get Quotes" is clicked. Removed dead `onGetQuotes` prop. Added trust signals ("Free, no obligation" + "Licensed pros" with green checkmarks).
2. **Permit detail pages** — CTABanner now works (was broken). Added `permitId` prop for lead attribution. Added bottom padding so sticky mobile bar doesn't cover content.
3. **Neighborhood pages** — Added CTABanner after the permit list. High-intent users browsing local permits now see a clear conversion path.
4. **City pages** — Added CTABanner after the Recent Permits section.
5. **Homepage** — Bottom CTA rewritten from "Ready to track development?" (browse-only) to "Planning a Construction or Renovation Project?" with amber "Find Contractors in {city}" buttons leading to city pages with CTAs.
6. **LeadForm submit button** — Styled with amber color to match CTA banner for visual consistency across the conversion funnel.
7. **Sticky mobile CTA** — Now scrolls to a working CTABanner (was scrolling to a non-functional button).

**Conversion funnel after fix:**
| Page Type | Lead Form | Path to Revenue |
|-----------|-----------|-----------------|
| Homepage | Via city links → CTABanner | "Find Contractors" → city page → expand form |
| Country pages | None (too high in funnel) | Users navigate to city pages |
| City pages | CTABanner at bottom | Expand → fill form → lead captured |
| Neighborhood pages | CTABanner at bottom | Expand → fill form → lead captured |
| Permit detail pages | CTABanner in sidebar + sticky mobile | Expand → fill form → lead captured |

### Current Monetization
Lead capture form implemented on permit detail, neighborhood, and city pages. CTA banner with contextual work-type matching and inline form expansion. Leads stored in DB with UTM tracking. Email notifications via Resend. Admin dashboard for lead management.

### Primary Revenue Model: Contractor Lead Generation
Sell qualified leads to local contractors. Charge per lead ($15-50 depending on project size/type). New construction leads are worth more than signage leads. The site already captures work type, location, and contact info.

### Secondary Revenue Streams
1. **Premium data API** — License aggregated permit data to real estate platforms, investment firms, and insurance companies. Charge $500-2000/mo based on query volume.
2. **Display advertising** — AdSense on neighborhood pages and permit listings (high volume, lower intent). Estimated $5-15 RPM for real estate/construction audience.

### AdSense Readiness
Site structure is suitable for ads. Best placements:
- Sidebar on permit detail pages (sticky, 300x600)
- Between permit cards on neighborhood listing (native in-feed)
- Above the fold on city pages (leaderboard 728x90)

Content policies: Site is informational/factual (government data). No policy concerns. Need privacy policy and terms (both already exist at `/privacy` and `/terms`).

### Pricing Strategy (Lead Gen)
- **Basic leads** (general inquiry, signage, electrical): $15-25/lead
- **Mid-tier leads** (renovation, plumbing, HVAC, roofing): $25-40/lead
- **Premium leads** (new construction, demolition): $40-75/lead
- Sell to 2-3 contractors per lead to maximize revenue

### Implementation Steps Remaining
1. Build contractor onboarding flow (sign up, select service area + categories)
2. Add lead routing logic (match by city + work type → assigned contractors)
3. Integrate payment (Stripe) for contractor subscriptions or per-lead billing
4. Add contractor profile pages (SEO value + trust signal)

---

## 7. FEATURES — CURRENT STATE

| Feature | Status | Works | Doesn't Work | Missing |
|---------|--------|-------|-------------|---------|
| Homepage | Complete | Hero, stats bar, city grid, how-it-works, conversion CTA | — | Dynamic permit count needs DB data |
| Country pages (4) | Complete | City listing, breadcrumbs, meta | — | — |
| City pages (6) | Complete | Stats, map, charts, neighborhoods, recent permits, data freshness, CTABanner | — | — |
| Neighborhood pages | Complete | Permit list, search/filter, stat cards, pagination, map, CTABanner | — | — |
| Permit detail pages | Complete | Key facts, map, narrative, related permits, working CTABanner + inline LeadForm, sticky mobile CTA | — | AI narratives need generation |
| Admin dashboard | Complete | Stats cards, ETL status table, leads count | — | — |
| Admin leads | Complete | Table, filters, status update, pagination, CSV export | — | Bulk actions |
| Admin ETL | Complete | Per-city status, manual trigger button | — | — |
| Admin login | Complete | Password form, cookie session | — | — |
| ETL pipeline | Complete | 6 city adapters, batch upsert, delta sync, post-run quality report | Needs DB/API connectivity to verify | — |
| Data quality monitoring | Complete | Per-city metrics (geocode/neighborhood/description/cost/narrative rates), anomaly alerts with configurable thresholds, auto-runs after ETL | — | — |
| AI narratives | Complete | 4 templates, quality gate, retry logic, auto-trigger after ETL | — | — |
| Lead capture | Complete | Zod validation, honeypot, consent checkbox, disposable email block, phone normalization, duplicate detection (24h window), DB save, email notification | — | — |
| Sitemaps | Complete | Dynamic XML, 45K URL partitioning, noindex filtering | — | — |
| IndexNow | Complete | Batch URL submission, key file, auto-triggered after ETL | — | — |
| ISR revalidation | Complete | Path-based revalidation API, auto-triggered after ETL | — | — |
| OG images | Complete | Dynamic 1200x630 per permit | — | — |
| Rate limiting | Complete | 20 req/min per IP on leads endpoint | — | — |
| Error boundaries | Complete | Homepage, country, city, neighborhood, permit levels | — | — |
| Loading states | Complete | Skeleton loaders on all pages | — | — |
| Privacy/Terms | Complete | Static pages with legal content | — | — |
| Analytics | Partial | GA4 + Plausible script loader | — | No GA ID or Plausible domain configured |
| Page pruning | Complete | Script marks 0-impression pages noindex | — | GSC credentials needed |
| Search/filter | Complete | Address search + category pills on neighborhood pages | — | Date range filter |
| Contractor profiles | Not started | — | — | Entire feature |
| User auth | Not started | — | — | Per-user accounts, contractor login |
| Email drip | Not started | — | — | Follow-up sequences after lead capture |

---

## 8. SEO & DISCOVERABILITY

### Current Meta Tags
Every page has unique `<title>` and `<meta name="description">` via templated meta builders. OpenGraph and Twitter Card tags on all pages. Canonical URLs set on all pages.

### Structured Data (JSON-LD)
- **Homepage**: WebSite schema with SearchAction
- **All pages**: BreadcrumbList
- **City pages**: CollectionPage with geo coordinates
- **Permit pages**: GovernmentPermit schema with address, cost, status, dates

### Sitemap
Dynamic `sitemap.ts` with `generateSitemaps()`:
- Sitemap 0: Static pages (home, countries, cities, neighborhoods)
- Sitemap 1+: Permit pages in 45K URL batches
- Change frequencies: daily (home/cities) → weekly (neighborhoods) → monthly (permits)
- Priority values: 1.0 (home) → 0.5 (permits)
- Noindex permits excluded

### robots.txt
- Allow: `/`
- Disallow: `/api/`, `/admin/`
- Sitemap declared

### Content Strategy
Target keywords per page type:
- City: "building permits in [city]", "[city] construction activity", "[city] development tracker"
- Neighborhood: "[neighborhood] building permits", "construction near [neighborhood]"
- Permit: "[address] building permit", "[permit type] permit [city]"

AI narratives per permit add 500+ unique words of content — critical for long-tail SEO at scale.

### Page Speed Concerns
- Leaflet maps loaded dynamically (`ssr: false`) — good
- Recharts loaded dynamically — good
- No raster images to optimize
- Font loading via `next/font/google` (optimal)
- Potential concern: Large permit lists without virtualization

### Accessibility
- Skip-to-content link ✓
- `aria-label` on nav ✓
- `aria-current="page"` on pagination ✓
- `aria-invalid` + `aria-describedby` on form inputs ✓
- Focus ring styling ✓
- Missing: `alt` text not applicable (no images), color contrast on muted text could be improved

---

## 9. ENVIRONMENT VARIABLES & SECRETS

| Variable | Where Used | Purpose | Set? | How to Get |
|----------|-----------|---------|------|-----------|
| `DATABASE_URL` | db/index.ts, safe-query.ts, drizzle.config.ts, scripts | Neon PostgreSQL connection | Check .env.local | [neon.tech](https://neon.tech) → Create project → Connection string |
| `NEXT_PUBLIC_SITE_URL` | layout.tsx, constants.ts, email | Base URL for meta/sitemaps | Check .env.local | Your deployed domain |
| `OPENAI_API_KEY` | generate-narrative.ts | GPT-4o-mini narratives | Check .env.local | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `CRON_SECRET` | proxy.ts, etl/trigger, admin/auth | ETL auth + admin password | Check .env.local | Generate: `openssl rand -hex 32` |
| `REVALIDATION_SECRET` | revalidate, indexnow routes | ISR + IndexNow auth | Check .env.local | Generate: `openssl rand -hex 32` |
| `INDEXNOW_KEY` | indexnow.ts, indexnow route | Search engine indexing | Check .env.local | Generate UUID: `uuidgen` |
| `RESEND_API_KEY` | send-lead-notification.ts | Lead email alerts | Check .env.local | [resend.com](https://resend.com) → API Keys |
| `ADMIN_EMAIL` | send-lead-notification.ts | Lead notification recipient | Check .env.local | Your email address |
| `ETL_DEBUG` | etl/logger.ts | Verbose ETL logging | Optional | Set to `"true"` |
| `NEXT_PUBLIC_GA_ID` | analytics.tsx | Google Analytics 4 | Optional | [analytics.google.com](https://analytics.google.com) → Admin → Data Streams |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | analytics.tsx | Plausible Analytics | Optional | [plausible.io](https://plausible.io) |
| `NODE_ENV` | admin/auth route | Production cookie security | Auto-set | Set by Vercel/Node |
| `WASHINGTON_DC_API_TOKEN` | ETL pipeline | DC API rate limit increase | Optional | [opendata.dc.gov](https://opendata.dc.gov) |
| `NYC_API_TOKEN` | ETL pipeline | NYC API rate limit | Optional | [opendata.cityofnewyork.us](https://opendata.cityofnewyork.us) |
| `CHICAGO_API_TOKEN` | ETL pipeline | Chicago API rate limit | Optional | [data.cityofchicago.org](https://data.cityofchicago.org) |
| `SYDNEY_API_TOKEN` | ETL pipeline | Sydney API rate limit | Optional | [planningportal.nsw.gov.au](https://www.planningportal.nsw.gov.au) |

---

## 10. MANUAL SETUP TASKS REMAINING

- [ ] **Neon Database** — Create project at neon.tech, copy connection string to `DATABASE_URL`, run `pnpm drizzle-kit push` to create tables, run `npx tsx scripts/seed.ts` to seed countries/cities/neighborhoods
- [ ] **Vercel Deployment** — Connect repo, add all env vars from Section 9 in Vercel dashboard (Settings → Environment Variables)
- [ ] **Domain & DNS** — Purchase domain (e.g. civictracker.com), add to Vercel project, configure DNS (CNAME or nameservers)
- [ ] **Resend Email** — Sign up at resend.com, verify sending domain (add DNS records), copy API key to `RESEND_API_KEY`
- [ ] **OpenAI API** — Add billing at platform.openai.com, copy API key, run `npx tsx scripts/generate-narratives.ts 100` to generate initial batch
- [ ] **IndexNow Key File** — Generate UUID, save to `INDEXNOW_KEY` env var, create `public/[key].txt` containing the key
- [ ] **Run Initial ETL** — After DB is seeded, run `npx tsx scripts/etl-manual.ts` to pull initial permit data from all 6 cities
- [ ] **Google Analytics** — Create GA4 property, add Measurement ID to `NEXT_PUBLIC_GA_ID`
- [ ] **Google Search Console** — Verify domain ownership, submit sitemap URL (`https://yourdomain.com/sitemap-index.xml`)
- [ ] **Bing Webmaster Tools** — Verify domain, confirm IndexNow key
- [ ] **AdSense Application** — Apply after site has 30+ days of content and organic traffic. Need unique content on permit pages (AI narratives)
- [ ] **Legal Review** — Review existing `/privacy` and `/terms` pages for compliance with your jurisdiction. Add cookie consent banner if targeting EU users.

---

## 11. PRIORITY ACTION LIST

### MUST DO BEFORE LAUNCH (blocking)

1. **Set up Neon database and run migrations + seed** — No data = empty pages. Run `drizzle-kit push` then `scripts/seed.ts`. ~30 min.
2. **Run initial ETL for at least 1-2 cities** — Need real permit data to verify everything works end-to-end. Run `scripts/etl-manual.ts washington-dc`. ~15 min.
3. **Configure all required env vars on Vercel** — DATABASE_URL, CRON_SECRET, REVALIDATION_SECRET, OPENAI_API_KEY, NEXT_PUBLIC_SITE_URL. ~10 min.
4. **Deploy to Vercel and verify routes render** — Confirm ISR works, sitemap generates, admin login works. ~20 min.
5. **Purchase and configure domain** — Set NEXT_PUBLIC_SITE_URL to production domain. Update Vercel. ~15 min.

### SHOULD DO BEFORE LAUNCH (quality)

1. **Generate AI narratives for initial permit batch** — Run `scripts/generate-narratives.ts`. Permits without narratives show placeholder text. Critical for SEO uniqueness. ~2h (API calls).
2. **Set up Resend for lead notifications** — Without email alerts, leads sit unseen in DB. ~20 min.
3. **Configure Google Analytics or Plausible** — Need traffic data from day one. ~10 min.
4. **Submit sitemap to Google Search Console** — Kick off indexing immediately. ~10 min.
5. ~~Add permit search/filter UI to neighborhood pages~~ — **DONE** (category pills + address search)
6. ~~Auto-trigger narrative generation + IndexNow after ETL~~ — **DONE** (post-ETL hooks in `src/lib/etl/post-run.ts`)
7. ~~Increase muted-foreground contrast~~ — **DONE** (55% → 65%)
8. ~~Fix lead capture — CTA button did nothing, form never rendered~~ — **DONE** (CTABanner now expands to show inline LeadForm)

### DO AFTER LAUNCH (optimization)

1. ~~**Contractor onboarding flow**~~ — **DONE** (Signup, service area, category preferences, Stripe billing)
2. ~~**Lead routing/matching**~~ — **DONE** (Auto-assign leads to contractors by city + work type)
3. **Permit search with address autocomplete** — Full-text search across all permits.
4. **AdSense integration** — Apply after 30+ days of content. Add ad slots to neighborhood + permit pages.
5. ~~**Email drip campaigns**~~ — **DONE** (Automated sequences for contractor onboarding)
6. **Data API for enterprise** — REST API with auth + rate limiting for B2B data licensing.
7. **GSC integration for auto-pruning** — Wire up `scripts/prune-pages.ts` to run on cron with real GSC data.
8. **Contractor review system** — Ratings + reviews on contractor profiles.

---

## 12. HARDENING CHANGELOG (Feb 27, 2026)

Based on executive review identifying 6 risk areas, the following hardening was implemented:

### Lead Spam Hardening
- **Disposable email blocking**: 23 known disposable domains rejected at API level (`src/lib/utils/lead-validation.ts`)
- **Email domain validation**: Rejects emails without proper TLD structure
- **Phone normalization**: Strips formatting, validates 7-15 digit range, stores digits-only
- **Duplicate detection**: Same email + same city within 24h silently deduped (no duplicate DB rows)
- **Consent checkbox**: Required UI checkbox + server-side enforcement — GDPR/CCPA compliant

### Data Quality Monitoring
- **Quality report**: Auto-generates after every ETL run (`src/lib/etl/quality-report.ts`)
- **Metrics tracked per city**: geocode rate, neighborhood assignment rate, description rate, cost rate, narrative rate, noindex count
- **Alert thresholds**: geocode < 70%, neighborhood < 60%, description < 50%, ETL error rate > 10%
- **Structured logging**: All metrics logged in parseable format for Vercel log monitoring

### Compliance Improvements
- **Consent checkbox on lead form**: "I agree to be contacted by local contractors" with Privacy Policy link
- **Server-side consent enforcement**: API rejects submissions without `consent: true`
- **Privacy policy already covers**: data collection, sharing with contractors, GDPR rights, CCPA rights, data retention (2 years), deletion process

### Smoke Testing
- **Automated smoke test script**: `scripts/smoke-test.sh` — validates all page routes, API auth, lead validation, method enforcement, SEO files
- **Pass/fail output**: Color-coded terminal output with summary counts

### Test Coverage
- Test count: 138 → 151 (13 new tests for lead validation utilities)
- New test coverage: disposable email detection, phone normalization, email domain validation, consent field schema

### Launch Readiness Checklist v2
- Full checklist with 40 pass/fail criteria: **`LAUNCH-CHECKLIST.md`**
- Includes: smoke test scripts, production QA steps, 30-day KPI targets, incident response playbook (ETL/DB/email/maps/AI/spam), risk register, operational procedures

---

## 13. CONTRACTOR MARKETPLACE (Feb 28, 2026)

Full self-service contractor marketplace implemented for "set it and forget it" monetization:

### Self-Service Contractor Portal
- **Landing pages**: `/for-contractors` + `/for-contractors/[city]` — SEO-optimized pages for contractor acquisition
- **Self-signup**: Contractors create accounts, select service areas + categories
- **Auto-approval**: Contractors automatically activated when they add a payment method (Stripe webhook)
- **Profile editor**: Self-service profile management at `/contractors/dashboard/profile`
- **Public profiles**: SEO-friendly pages at `/contractor/[slug]`

### Automated Lead Routing
- **Real-time matching**: Leads auto-routed to contractors by city + work type
- **Per-lead billing**: Contractors charged $15-75 per lead via Stripe
- **Email notifications**: Instant lead delivery to contractor email
- **Lead management**: Dashboard for contractors to track + update lead status

### AI Automation
- **AI dispute resolution**: GPT-4o-mini analyzes lead quality disputes, auto-refunds spam/fake leads (`src/lib/ai/dispute-resolver.ts`)
- **AI contractor outreach**: Finds contractors via Google Places API, generates personalized outreach emails (`src/lib/ai/contractor-outreach.ts`)
- **Admin outreach API**: `/api/admin/outreach` — trigger AI-powered contractor acquisition campaigns

### Automated Email Sequences
- **Welcome email**: Sent immediately on signup
- **24h reminder**: "Homeowners are looking for contractors like you"
- **72h reminder**: "Last chance to complete setup"
- **7-day win-back**: Addresses common objections
- **Cron job**: `/api/cron/email-sequences` runs hourly to process sequences

### Environment Variables Added
| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe API for billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe |
| `GOOGLE_PLACES_API_KEY` | Optional: AI contractor discovery |

### Operational Model
This system is designed to be hands-off:
1. Contractors find the site via SEO/ads → self-signup
2. Auto-approved when payment method added
3. Leads auto-routed and charged
4. AI handles dispute resolution
5. Email sequences nurture incomplete signups
6. Admin can optionally run AI outreach campaigns to bootstrap supply

---

## 14. ONE-LINE SITE SUMMARY

"Civic Tracker is a programmatic SEO platform for homeowners, investors, and contractors that aggregates building permit data from 6 global cities into neighborhood-level intelligence, monetized via contractor lead generation."
