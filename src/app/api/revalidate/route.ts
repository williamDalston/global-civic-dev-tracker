import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyAuth } from '@/lib/config/env';

const MAX_PATHS = 100;

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

  const { paths } = body as { paths?: unknown };

  if (!paths || !Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ error: 'Missing paths array' }, { status: 400 });
  }

  if (paths.length > MAX_PATHS) {
    return NextResponse.json(
      { error: `Too many paths (max ${MAX_PATHS})` },
      { status: 400 }
    );
  }

  // Validate each path is a string starting with /
  const validPaths = paths.filter(
    (p): p is string => typeof p === 'string' && p.startsWith('/')
  );

  for (const path of validPaths) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: true,
    paths: validPaths,
    timestamp: new Date().toISOString(),
  });
}
