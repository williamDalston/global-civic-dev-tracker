# Launch Readiness Checklist v2

**Last updated:** February 27, 2026
**Launch target:** Soft launch (8.5/10 readiness)

---

## 1. PASS/FAIL CRITERIA

Every item below must show **PASS** before go-live. Items marked **WARN** are acceptable for soft launch but must be resolved within 14 days.

### 1.1 Infrastructure

| # | Check | How to verify | Status |
|---|-------|--------------|--------|
| 1 | Neon DB connected + schema migrated | `pnpm drizzle-kit push` succeeds, `SELECT count(*) FROM cities` returns 6 | ☐ |
| 2 | All required env vars set on Vercel | Dashboard → Settings → Environment Variables — confirm DATABASE_URL, CRON_SECRET, REVALIDATION_SECRET, OPENAI_API_KEY, NEXT_PUBLIC_SITE_URL, RESEND_API_KEY, ADMIN_EMAIL, INDEXNOW_KEY all present | ☐ |
| 3 | Production build succeeds | `pnpm build` exits 0, 26 routes listed | ☐ |
| 4 | Vercel deployment live | Visit production URL → homepage renders dark-theme with "Civic Tracker" in header | ☐ |
| 5 | Custom domain configured + HTTPS | `curl -I https://yourdomain.com` → 200, `Strict-Transport-Security` header present | ☐ |
| 6 | ETL cron registered | Vercel dashboard → Cron Jobs → `/api/etl/trigger` listed, schedule `0 */6 * * *` | ☐ |

### 1.2 Data Pipeline

| # | Check | How to verify | Status |
|---|-------|--------------|--------|
| 7 | Seed data loaded | `SELECT count(*) FROM countries` = 4, `SELECT count(*) FROM cities` = 6, neighborhoods seeded for all cities | ☐ |
| 8 | ETL runs for at least 2 cities | `npx tsx scripts/etl-manual.ts washington-dc new-york-city` → 0 exit code, `SELECT city_id, count(*) FROM permits GROUP BY city_id` shows records | ☐ |
| 9 | Geocode rate > 70% per city | Run quality report, check `geocodeRate` per city — pipeline auto-logs this | ☐ |
| 10 | Neighborhood assignment > 60% | Quality report `neighborhoodRate` per city | ☐ |
| 11 | AI narratives generated | `npx tsx scripts/generate-narratives.ts 100` → `SELECT count(*) FROM permits WHERE ai_narrative IS NOT NULL` > 0 | ☐ |
| 12 | Zero ETL errors on clean run | ETL trigger response JSON shows `errors: 0` for each city | ☐ |

### 1.3 Pages & SEO

| # | Check | How to verify | Status |
|---|-------|--------------|--------|
| 13 | Homepage renders with real data | Visit `/` → "Building Permits Tracked" stat shows actual count, not 0 | ☐ |
| 14 | City pages show permits | Visit `/us/washington-dc` → Recent Permits section populated | ☐ |
| 15 | Neighborhood pages list permits | Visit any neighborhood → permit cards render with addresses | ☐ |
| 16 | Permit detail pages render | Visit any permit → key facts, map, narrative sections all populate | ☐ |
| 17 | robots.txt accessible | `curl https://yourdomain.com/robots.txt` → contains `Sitemap:` directive | ☐ |
| 18 | Sitemap XML valid | `curl https://yourdomain.com/sitemap/0.xml` → valid XML with `<urlset>` | ☐ |
| 19 | JSON-LD on all page types | View source on homepage, city, neighborhood, permit → `<script type="application/ld+json">` present | ☐ |
| 20 | OG image generates | Visit `/us/washington-dc/bloomingdale/any-permit/opengraph-image` → 1200x630 image | ☐ |
| 21 | Canonical URLs set | View source → `<link rel="canonical">` on all pages | ☐ |

### 1.4 Revenue Pipeline

| # | Check | How to verify | Status |
|---|-------|--------------|--------|
| 22 | CTABanner renders on permit pages | Visit any permit detail → "Planning a Similar Project?" banner visible | ☐ |
| 23 | CTABanner renders on city pages | Visit city page → CTA at bottom with "Get Free {category} Quotes" | ☐ |
| 24 | CTABanner renders on neighborhood pages | Visit neighborhood → CTA after permit list | ☐ |
| 25 | Lead form expands on click | Click "Get Free Quotes" → inline form appears with name/email/phone/message/consent | ☐ |
| 26 | Consent checkbox required | Submit form without checking consent → "You must agree" error | ☐ |
| 27 | Lead saved to DB | Submit test lead → `SELECT * FROM leads ORDER BY created_at DESC LIMIT 1` shows it | ☐ |
| 28 | Email notification fires | Submit test lead → check ADMIN_EMAIL inbox for "New Lead" email | ☐ |
| 29 | Disposable email rejected | Submit with `test@mailinator.com` → "Please use a permanent email" error | ☐ |
| 30 | Duplicate detection works | Submit same email + city twice within 24h → second silently accepted, only 1 DB row | ☐ |
| 31 | Rate limiting works | Send 21 POST requests in 60s → 21st returns HTTP 429 | ☐ |

### 1.5 Admin

| # | Check | How to verify | Status |
|---|-------|--------------|--------|
| 32 | Admin login works | Visit `/admin/login`, enter CRON_SECRET password → redirected to dashboard | ☐ |
| 33 | Admin dashboard shows stats | Dashboard shows leads count, ETL sync status per city | ☐ |
| 34 | Admin can manage leads | Navigate to `/admin/leads` → lead table visible, status dropdown works | ☐ |
| 35 | Admin can trigger ETL | Navigate to `/admin/etl` → "Run ETL" button triggers pipeline | ☐ |

### 1.6 Security

| # | Check | How to verify | Status |
|---|-------|--------------|--------|
| 36 | API routes require auth | `curl /api/etl/trigger` without auth → 401 | ☐ |
| 37 | Admin routes redirect | Visit `/admin` without session → redirected to login | ☐ |
| 38 | Honeypot field works | Submit form with `website` field filled → accepted but not saved | ☐ |
| 39 | No secrets in client bundle | View page source → no env values leaked (search for key prefixes) | ☐ |
| 40 | CORS headers absent on API | `curl -H "Origin: evil.com" /api/leads/capture` → no `Access-Control-Allow-Origin` | ☐ |

---

## 2. SMOKE TEST SCRIPTS

### 2.1 Automated smoke test

```bash
# Run against local dev:
./scripts/smoke-test.sh http://localhost:3000

# Run against production:
./scripts/smoke-test.sh https://yourdomain.com
```

Verifies: all page routes return 200, API auth enforcement, lead validation, method enforcement, SEO files.

### 2.2 Manual smoke test checklist (5 minutes)

1. Open homepage in Chrome incognito
2. Click through to a city → neighborhood → permit
3. Verify breadcrumbs work at each level
4. On permit page, click "Get Free Quotes" → fill form → submit
5. Check admin dashboard for the new lead
6. Open site on mobile (or DevTools device mode) → verify sticky CTA bar
7. Right-click → View Source → verify JSON-LD and meta tags
8. Open `/robots.txt` and `/sitemap/0.xml` in browser
9. Run Lighthouse on permit page → verify scores

### 2.3 Database health check

```sql
-- Run after ETL to verify data quality
SELECT
  c.slug AS city,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE p.latitude IS NOT NULL) AS geocoded,
  ROUND(100.0 * COUNT(*) FILTER (WHERE p.latitude IS NOT NULL) / COUNT(*), 1) AS geocode_pct,
  COUNT(*) FILTER (WHERE p.neighborhood_id IS NOT NULL) AS with_hood,
  ROUND(100.0 * COUNT(*) FILTER (WHERE p.neighborhood_id IS NOT NULL) / COUNT(*), 1) AS hood_pct,
  COUNT(*) FILTER (WHERE p.ai_narrative IS NOT NULL) AS with_narrative,
  COUNT(*) FILTER (WHERE p.noindex = true) AS noindexed
FROM permits p
JOIN cities c ON p.city_id = c.id
GROUP BY c.slug
ORDER BY total DESC;
```

**Pass thresholds**: geocode_pct > 70%, hood_pct > 60% per city.

---

## 3. PRODUCTION QA STEPS

### 3.1 Pre-deploy (T-24h)

- [ ] Run `pnpm test` — all tests pass (currently 151)
- [ ] Run `pnpm build` — 0 errors, 26 routes
- [ ] Run `pnpm lint` — no errors
- [ ] Review `.env.local` — all required vars set
- [ ] Verify `vercel.json` cron config correct
- [ ] Create Neon project if not already done
- [ ] Run `pnpm drizzle-kit push` against production DB
- [ ] Run `npx tsx scripts/seed.ts` against production DB

### 3.2 Deploy (T-0)

- [ ] Push to main branch → Vercel auto-deploys
- [ ] Verify deployment URL loads (Vercel dashboard → Deployments)
- [ ] Add custom domain in Vercel dashboard
- [ ] Configure DNS (CNAME or nameservers)
- [ ] Wait for SSL certificate provisioning (< 5 min)

### 3.3 Post-deploy (T+1h)

- [ ] Run `./scripts/smoke-test.sh https://yourdomain.com`
- [ ] Run `npx tsx scripts/etl-manual.ts` to trigger initial data pull
- [ ] Verify permits appear on city pages
- [ ] Run `npx tsx scripts/generate-narratives.ts 100`
- [ ] Submit a test lead and verify DB + email
- [ ] Delete the test lead from admin dashboard
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Verify IndexNow key file: `curl https://yourdomain.com/[key].txt`

### 3.4 Post-deploy (T+24h)

- [ ] Check Vercel Logs for any errors
- [ ] Verify ETL cron ran (check `etl_sync_state` table)
- [ ] Run quality report SQL — verify thresholds
- [ ] Check Google Search Console → Coverage report → no errors
- [ ] Verify at least 1 page indexed (site:yourdomain.com in Google)

### 3.5 Post-deploy (T+7d)

- [ ] Check GA4 / Plausible for traffic data
- [ ] Review leads table — any real leads?
- [ ] Check for any `noindex` pages that shouldn't be
- [ ] Review ETL error messages in Vercel logs
- [ ] Run Lighthouse on all page types — target 90+ performance

---

## 4. FIRST 30-DAY KPI TARGETS

### 4.1 Traffic & Indexing

| KPI | Day 7 | Day 14 | Day 30 | How to measure |
|-----|-------|--------|--------|----------------|
| Pages indexed (Google) | 50+ | 500+ | 5,000+ | GSC → Coverage → Valid pages |
| Total impressions (GSC) | 100+ | 1,000+ | 10,000+ | GSC → Performance → Total impressions |
| Organic clicks | 5+ | 50+ | 500+ | GSC → Performance → Total clicks |
| Avg position | < 50 | < 30 | < 20 | GSC → Performance → Avg position |
| Sitemap URLs submitted | 100% | 100% | 100% | GSC → Sitemaps → Submitted |
| Crawl errors | < 10 | < 5 | 0 | GSC → Coverage → Errors |

### 4.2 Data Quality

| KPI | Day 7 | Day 14 | Day 30 | How to measure |
|-----|-------|--------|--------|----------------|
| Total permits in DB | 5,000+ | 20,000+ | 100,000+ | `SELECT count(*) FROM permits` |
| Cities with active ETL | 2+ | 4+ | 6 | `SELECT count(*) FROM etl_sync_state WHERE status = 'idle'` |
| Geocode rate (avg) | > 70% | > 75% | > 80% | Quality report |
| AI narrative coverage | > 5% | > 20% | > 50% | `SELECT count(*) FILTER (WHERE ai_narrative IS NOT NULL) / count(*)` |
| ETL success rate | > 90% | > 95% | > 99% | Vercel cron logs |

### 4.3 Monetization

| KPI | Day 7 | Day 14 | Day 30 | How to measure |
|-----|-------|--------|--------|----------------|
| Lead form impressions | Track via GA4 event | Track | Track | Custom GA4 event on CTA click |
| Leads captured | 0-2 | 5+ | 20+ | `SELECT count(*) FROM leads` |
| Lead quality (not spam) | > 80% | > 85% | > 90% | Admin dashboard review |
| Email notification delivery | 100% | 100% | 100% | Resend dashboard → delivery rate |
| Avg lead response time | < 24h | < 12h | < 6h | Manual tracking until CRM |

### 4.4 Performance

| KPI | Target | How to measure |
|-----|--------|----------------|
| Lighthouse Performance | > 90 | Lighthouse CI or manual audit |
| Lighthouse SEO | > 95 | Lighthouse CI or manual audit |
| TTFB (p95) | < 800ms | Vercel Analytics or SpeedCurve |
| LCP (p75) | < 2.5s | Web Vitals / CrUX |
| CLS (p75) | < 0.1 | Web Vitals / CrUX |
| Build time | < 2 min | Vercel deployment logs |

---

## 5. INCIDENT RESPONSE PLAYBOOK

### 5.1 ETL Pipeline Failure

**Symptoms**: Vercel cron logs show errors, `etl_sync_state.status = 'failed'`, no new permits appearing.

**Diagnosis**:
```bash
# Check Vercel function logs
vercel logs --filter "etl" --since 6h

# Check sync state in DB
SELECT city_id, status, error_message, last_sync_at FROM etl_sync_state;
```

**Response**:
1. **Single city fails**: Likely API-side issue (rate limit, endpoint changed, maintenance). Check the government API status page. Wait for next cron cycle. If persistent (> 24h), check adapter code against API docs.
2. **All cities fail**: Database connectivity issue. Check Neon dashboard for outages. Verify `DATABASE_URL` in Vercel env vars.
3. **Partial data (low record counts)**: API pagination may have changed. Check adapter's offset/limit logic. Compare with raw API response.

**Escalation**: If ETL is down > 24h for a city, the data freshness indicators on city pages will show stale timestamps. Not critical for SEO but degrades trust.

**Resolution**: Fix and re-run: `npx tsx scripts/etl-manual.ts [city-slug]`

---

### 5.2 Database Down

**Symptoms**: All pages show "Unable to load data" fallback UI (via error boundaries), API routes return 500.

**Diagnosis**:
```bash
# Check Neon status
curl -s https://neonstatus.com/api/v2/status.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['status']['description'])"

# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

**Response**:
1. Check [Neon Status](https://neonstatus.com) for outages
2. If Neon is up, verify `DATABASE_URL` hasn't been rotated (Neon dashboard → Connection Details)
3. If connection pooler saturated, restart Vercel deployment (forces new connections)
4. Site remains browsable via ISR cache (stale-while-revalidate) — pages served from edge cache even when origin is down

**Recovery**: Pages auto-recover when DB reconnects. ISR cache refreshes on next revalidation cycle. No manual intervention needed unless env vars changed.

---

### 5.3 Email Notification Failure

**Symptoms**: Leads saved in DB but admin doesn't receive email notifications.

**Diagnosis**:
```bash
# Check Resend dashboard for delivery logs
# https://resend.com/emails

# Check Vercel logs for email errors
vercel logs --filter "email" --since 24h
```

**Response**:
1. **Resend API key expired/invalid**: Regenerate at resend.com, update `RESEND_API_KEY` in Vercel
2. **Sending domain not verified**: Check DNS records in Resend dashboard
3. **Recipient bounced**: Check `ADMIN_EMAIL` is valid and inbox not full
4. **Rate limited by Resend**: Free tier is 100 emails/day. If exceeded, upgrade plan

**Mitigation**: Leads are always saved to DB even if email fails (fire-and-forget pattern). Admin can check `/admin/leads` directly. No lead data is lost.

---

### 5.4 Map Tiles Fail to Load

**Symptoms**: Map containers render but tiles are grey/empty. Console shows 429 or CORS errors from tile servers.

**Diagnosis**: Check browser console for tile server errors. OpenStreetMap tile usage policy: max 2 req/s, proper User-Agent required.

**Response**:
1. **Temporary OSM outage**: Tiles are non-critical — permit data still renders. Wait for recovery.
2. **Rate limited**: If traffic spikes, consider switching to a commercial tile provider (Mapbox, Maptiler). Update tile URL in map component config.
3. **CORS errors**: May indicate CDN or proxy issue. Check Vercel edge config.

**Impact**: Low — maps are visual enhancement only. All permit data is accessible without maps.

---

### 5.5 AI Narrative Generation Stalls

**Symptoms**: New permits appear without narratives. `SELECT count(*) FROM permits WHERE ai_narrative IS NULL AND noindex = false` grows over time.

**Diagnosis**:
```bash
# Check OpenAI API status
curl -s https://status.openai.com/api/v2/status.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['status']['description'])"

# Check Vercel logs for narrative errors
vercel logs --filter "narrative" --since 24h
```

**Response**:
1. **OpenAI API down**: Wait for recovery. Narratives are not blocking — pages render without them (just less SEO-rich content).
2. **API key billing limit hit**: Check OpenAI dashboard for usage. Upgrade billing limit.
3. **Quality gate rejecting all**: Check `quality-gate.ts` thresholds. May need to relax word count minimum if permit descriptions are very short.

**Manual catch-up**: `npx tsx scripts/generate-narratives.ts 500`

---

### 5.6 Lead Spam Attack

**Symptoms**: Sudden spike in leads, many with disposable emails, gibberish names, or same IP.

**Diagnosis**:
```sql
-- Check for duplicates
SELECT email, count(*) FROM leads
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY email HAVING count(*) > 1;

-- Check for disposable domains
SELECT email FROM leads
WHERE created_at > NOW() - INTERVAL '24 hours'
AND email LIKE '%@mailinator.com' OR email LIKE '%@tempmail.com';
```

**Response** (already hardened):
1. Rate limiting: 20 req/min per IP (middleware)
2. Honeypot field catches basic bots
3. Disposable email domains blocked (23 domains in blocklist)
4. Duplicate detection: same email+city in 24h silently deduped
5. Consent checkbox required

**If still overwhelmed**:
- Add CAPTCHA (hCaptcha recommended — free, privacy-friendly)
- Lower rate limit to 5 req/min
- Add IP blocklist for repeat offenders
- Enable Vercel WAF if available

---

## 6. RISK REGISTER

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|-----------|--------|------------|-------|
| Government API changes schema | Medium | High | Adapter pattern isolates changes. Monitor ETL error rates. | Dev |
| Government API goes offline | Low | Medium | ETL marks city as failed, retries next cron. Stale data still served via ISR cache. | Dev |
| Neon DB outage | Low | High | ISR cache serves stale pages. Error boundaries show graceful fallback. Monitor Neon status. | Dev |
| Lead spam attack | Medium | Low | Rate limiting + honeypot + disposable email block + duplicate detection. Add CAPTCHA if needed. | Dev |
| GDPR/privacy complaint (UK/EU users) | Low | High | Privacy policy covers data usage. Consent checkbox added. Retention policy (2 years). Deletion process documented. | Legal |
| Google penalty for thin content | Medium | Medium | AI narratives add 500+ unique words. Pruning script noindexes zero-impression pages. | SEO |
| OpenAI API cost overrun | Low | Low | Batch processing capped at 50/run. GPT-4o-mini is cheap (~$0.15/1M input tokens). Budget alerts on OpenAI dashboard. | Dev |
| Resend email delivery issues | Low | Low | Leads saved to DB regardless. Admin dashboard as fallback. | Dev |

---

## 7. OPERATIONAL PROCEDURES

### 7.1 Daily (automated)

- ETL runs every 6 hours via Vercel cron
- Quality report logged after each ETL run
- Narrative generation batch (50 permits) triggered after ETL
- IndexNow submission for new/updated permit URLs

### 7.2 Weekly (manual, ~15 min)

- [ ] Review `/admin/leads` — respond to new leads, update statuses
- [ ] Check Vercel function logs for recurring errors
- [ ] Review GSC Coverage report for crawl errors
- [ ] Spot-check 2-3 random permit pages for data accuracy

### 7.3 Monthly (manual, ~30 min)

- [ ] Review GA4/Plausible traffic trends
- [ ] Check OpenAI usage dashboard for cost
- [ ] Check Resend dashboard for delivery rates
- [ ] Review Neon DB metrics (storage, connections)
- [ ] Run `npx tsx scripts/prune-pages.ts --dry-run` to preview pruning candidates
- [ ] Update disposable email domain blocklist if spam patterns emerge

### 7.4 Lead response SOP

1. Admin receives email notification with lead details
2. Review lead in `/admin/leads` — mark as "contacted" or "spam"
3. For valid leads: forward to 2-3 relevant contractors in that city/category
4. Follow up with homeowner within 24h (manual until email drip is built)
5. Track contractor response and close rate for future pricing optimization
