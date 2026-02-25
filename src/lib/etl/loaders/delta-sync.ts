import { db } from '@/lib/db';
import { etlSyncState } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getSyncState(cityId: number) {
  const result = await db
    .select()
    .from(etlSyncState)
    .where(eq(etlSyncState.cityId, cityId))
    .limit(1);

  if (!result[0]) {
    // Create initial sync state
    const inserted = await db
      .insert(etlSyncState)
      .values({ cityId })
      .returning();
    return inserted[0];
  }

  return result[0];
}

export async function updateSyncState(
  cityId: number,
  data: {
    lastSyncAt?: Date;
    lastOffset?: number;
    lastRecordId?: string;
    recordsSynced?: number;
    status?: string;
    errorMessage?: string | null;
  }
) {
  return db
    .update(etlSyncState)
    .set({
      ...data,
      lastSyncAt: data.lastSyncAt,
      updatedAt: new Date(),
    })
    .where(eq(etlSyncState.cityId, cityId));
}

export async function markSyncRunning(cityId: number) {
  return updateSyncState(cityId, { status: 'running', errorMessage: null });
}

export async function markSyncComplete(cityId: number, recordsSynced: number) {
  return updateSyncState(cityId, {
    status: 'idle',
    lastSyncAt: new Date(),
    recordsSynced,
    errorMessage: null,
  });
}

export async function markSyncFailed(cityId: number, error: string) {
  return updateSyncState(cityId, {
    status: 'failed',
    errorMessage: error,
  });
}
