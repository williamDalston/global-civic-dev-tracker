import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSessionToken, COOKIE_NAME } from '@/lib/auth/admin-session';

const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

// Simple in-memory rate limiter for serverless (per-instance)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS_PER_WINDOW;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Admin route protection ────────────────────────────────
  // Allow the login page and auth API without a session
  if (
    pathname.startsWith('/admin') &&
    pathname !== '/admin/login' &&
    !pathname.startsWith('/api/admin/auth')
  ) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const secret = process.env.CRON_SECRET;

    if (!token || !secret || !validateSessionToken(token, secret)) {
      // For API routes, return 401 JSON
      if (pathname.startsWith('/api/admin/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // For page routes, redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─── API-specific protections ──────────────────────────────

  // Rate limit the lead capture endpoint more aggressively
  if (pathname === '/api/leads/capture') {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // Block non-POST methods on write-only API routes
  const postOnlyRoutes = ['/api/leads/capture', '/api/revalidate', '/api/indexnow'];
  if (postOnlyRoutes.includes(pathname) && request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Block GET on ETL trigger unless from cron or has auth
  if (pathname === '/api/etl/trigger' && request.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Periodic cleanup of old rate limit entries (every ~100 requests)
  if (Math.random() < 0.01) {
    const now = Date.now();
    for (const [key, entry] of requestCounts) {
      if (now > entry.resetAt) requestCounts.delete(key);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
