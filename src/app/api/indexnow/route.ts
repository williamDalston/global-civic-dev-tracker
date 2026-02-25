import { NextRequest, NextResponse } from 'next/server';
import { SITE_URL, INDEXNOW_BATCH_SIZE } from '@/lib/config/constants';
import { API_ENDPOINTS } from '@/lib/config/api-endpoints';
import { verifyAuth } from '@/lib/config/env';

const MAX_URLS = 50_000;

export async function POST(request: NextRequest) {
  if (!verifyAuth(request.headers.get('authorization'), process.env.REVALIDATION_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { urls } = body as { urls?: unknown };

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'Missing urls array' }, { status: 400 });
  }

  if (urls.length > MAX_URLS) {
    return NextResponse.json(
      { error: `Too many URLs (max ${MAX_URLS})` },
      { status: 400 }
    );
  }

  const indexNowKey = process.env.INDEXNOW_KEY;
  if (!indexNowKey) {
    return NextResponse.json({ error: 'IndexNow key not configured' }, { status: 500 });
  }

  // Validate URLs are strings
  const validUrls = urls.filter((u): u is string => typeof u === 'string');

  const results = [];
  for (let i = 0; i < validUrls.length; i += INDEXNOW_BATCH_SIZE) {
    const batch = validUrls.slice(i, i + INDEXNOW_BATCH_SIZE);

    try {
      const response = await fetch(API_ENDPOINTS.indexNow, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: new URL(SITE_URL).hostname,
          key: indexNowKey,
          keyLocation: `${SITE_URL}/${indexNowKey}.txt`,
          urlList: batch,
        }),
      });

      results.push({
        batch: Math.floor(i / INDEXNOW_BATCH_SIZE) + 1,
        count: batch.length,
        status: response.status,
      });
    } catch (error) {
      results.push({
        batch: Math.floor(i / INDEXNOW_BATCH_SIZE) + 1,
        count: batch.length,
        status: 'error',
        error: error instanceof Error ? error.message : 'fetch failed',
      });
    }
  }

  return NextResponse.json({
    success: true,
    totalUrls: validUrls.length,
    batches: results,
  });
}
