# Deployment Guide

This guide covers everything you need to deploy the Global Civic Development Tracker to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (Neon)](#database-setup-neon)
3. [Vercel Deployment](#vercel-deployment)
4. [Environment Variables](#environment-variables)
5. [Initial Data Setup](#initial-data-setup)
6. [Email Setup (Resend)](#email-setup-resend)
7. [Analytics Setup](#analytics-setup)
8. [Search Engine Indexing](#search-engine-indexing)
9. [Error Monitoring (Optional)](#error-monitoring-optional)
10. [Custom Domain](#custom-domain)
11. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

- GitHub account with the repository pushed
- Vercel account (free tier works)
- Neon account (free tier works)
- OpenAI account with API credits
- (Optional) Resend account for email notifications
- (Optional) Google Analytics or Plausible account

---

## Database Setup (Neon)

1. **Create a Neon account** at [neon.tech](https://neon.tech)

2. **Create a new project**
   - Choose a region close to your users (e.g., US East for North America)
   - Note your connection string

3. **Copy the connection string**
   - Format: `postgres://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
   - This will be your `DATABASE_URL`

4. **Run database migrations** (after Vercel deployment)
   ```bash
   # From the global-civic-dev-tracker directory
   npx tsx scripts/seed.ts
   ```

---

## Vercel Deployment

1. **Import your repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your GitHub repository
   - Choose the `global-civic-dev-tracker` subdirectory as the root

2. **Configure build settings**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `global-civic-dev-tracker`
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`

3. **Add environment variables** (see next section)

4. **Deploy**

---

## Environment Variables

Add these in Vercel Dashboard > Project > Settings > Environment Variables:

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgres://user:pass@ep-xxx.neon.tech/db` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `CRON_SECRET` | Secret for cron jobs (also admin password) | Generate 32+ char random string |
| `REVALIDATION_SECRET` | Secret for ISR revalidation | Generate 32+ char random string |
| `NEXT_PUBLIC_SITE_URL` | Your production URL | `https://yourdomain.com` |

### Recommended

| Variable | Description | Example |
|----------|-------------|---------|
| `INDEXNOW_KEY` | UUID for IndexNow | `550e8400-e29b-41d4-a716-446655440000` |
| `RESEND_API_KEY` | Resend API key for emails | `re_...` |
| `ADMIN_EMAIL` | Email for lead notifications | `info@alstonanalytics.com` |

### Optional

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 ID |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible domain |
| `WASHINGTON_DC_API_TOKEN` | DC open data token |
| `NYC_API_TOKEN` | NYC open data token |
| `CHICAGO_API_TOKEN` | Chicago open data token |
| `SYDNEY_API_TOKEN` | Sydney planning portal token |

### Generate Secrets

Use these commands to generate secure secrets:

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate UUID for IndexNow
uuidgen
```

---

## Initial Data Setup

After deployment, you need to seed the database and run the initial ETL:

### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run seed script
npx tsx scripts/seed.ts

# Run initial ETL (this may take 10-15 minutes)
npx tsx scripts/etl-manual.ts

# Generate AI narratives (optional, can run later)
npx tsx scripts/generate-narratives.ts 100
```

### Option 2: Trigger via API

After deployment, trigger the ETL via the API:

```bash
curl -X POST https://yourdomain.com/api/etl/trigger \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Email Setup (Resend)

1. **Create a Resend account** at [resend.com](https://resend.com)

2. **Verify your domain**
   - Add DNS records as instructed by Resend
   - This allows sending from `@alstonanalytics.com`

3. **Create an API key**
   - Go to API Keys in Resend dashboard
   - Create a new key with "Sending access"
   - Add as `RESEND_API_KEY` in Vercel

4. **Set admin email**
   - Add `ADMIN_EMAIL=info@alstonanalytics.com` in Vercel

---

## Analytics Setup

### Google Analytics 4

1. Go to [analytics.google.com](https://analytics.google.com)
2. Create a new property
3. Set up a Web data stream
4. Copy the Measurement ID (starts with `G-`)
5. Add as `NEXT_PUBLIC_GA_ID` in Vercel

### Plausible (Privacy-Friendly Alternative)

1. Sign up at [plausible.io](https://plausible.io)
2. Add your domain
3. Add `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com` in Vercel

---

## Search Engine Indexing

### IndexNow (Bing, Yandex)

IndexNow allows instant indexing of new pages.

1. **Generate a UUID** for your key:
   ```bash
   uuidgen
   ```

2. **Add to Vercel** as `INDEXNOW_KEY`

3. **Verify ownership** by visiting:
   ```
   https://yourdomain.com/INDEXNOW_KEY.txt
   ```
   This file is automatically served by the app.

4. **Submit to Bing**:
   - Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
   - Add your site
   - IndexNow will work automatically

### Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add your property
3. Verify ownership (DNS or HTML file)
4. Submit your sitemap: `https://yourdomain.com/sitemap.xml`

### Sitemap

The app automatically generates a sitemap at `/sitemap.xml` that includes:
- All country pages
- All city pages
- All neighborhood pages
- All permit pages

---

## Error Monitoring (Optional)

### Sentry

1. Create a Sentry account at [sentry.io](https://sentry.io)

2. Install Sentry:
   ```bash
   pnpm add @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

3. Follow the wizard to configure

4. Add environment variables to Vercel:
   - `SENTRY_DSN`
   - `SENTRY_AUTH_TOKEN`

---

## Custom Domain

1. **In Vercel Dashboard**:
   - Go to Project > Settings > Domains
   - Add your custom domain

2. **Configure DNS**:
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel's nameservers for full DNS management

3. **Update environment variable**:
   - Change `NEXT_PUBLIC_SITE_URL` to your custom domain

4. **SSL**:
   - Vercel automatically provisions SSL certificates

---

## Post-Deployment Checklist

- [ ] Database seeded with countries, cities, neighborhoods
- [ ] Initial ETL completed (check `/admin/etl` for status)
- [ ] AI narratives generated for permits
- [ ] Admin dashboard accessible at `/admin/login`
- [ ] Lead form submissions working (test at any permit page)
- [ ] Email notifications configured and tested
- [ ] Analytics tracking verified
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] Robots.txt accessible at `/robots.txt`
- [ ] Privacy Policy page loads at `/privacy`
- [ ] Terms of Service page loads at `/terms`
- [ ] Google Search Console sitemap submitted
- [ ] IndexNow key verified
- [ ] Custom domain configured (if applicable)
- [ ] Cron job running (check Vercel Functions logs)

---

## Cron Job

The app includes a cron job configured in `vercel.json` that runs every 6 hours:

```json
{
  "crons": [
    {
      "path": "/api/etl/trigger",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This automatically fetches new permits from all city data sources.

To verify it's working:
1. Go to Vercel Dashboard > Project > Functions
2. Check the `/api/etl/trigger` function logs
3. Or visit `/admin/etl` to see sync status

---

## Troubleshooting

### ETL Not Running

1. Check `CRON_SECRET` is set correctly
2. Verify cron is enabled in Vercel (Pro plan required for crons)
3. Check function logs for errors

### Database Connection Issues

1. Verify `DATABASE_URL` format
2. Check Neon dashboard for connection limits
3. Ensure `?sslmode=require` is in the URL

### Email Not Sending

1. Verify domain is verified in Resend
2. Check `RESEND_API_KEY` and `ADMIN_EMAIL` are set
3. Check Resend dashboard for delivery logs

### Build Failures

1. Run `pnpm build` locally to see errors
2. Check for TypeScript errors with `pnpm lint`
3. Ensure all dependencies are in `package.json`

---

## Support

For questions or issues, contact [info@alstonanalytics.com](mailto:info@alstonanalytics.com).
