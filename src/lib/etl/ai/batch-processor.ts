import { db } from '@/lib/db';
import { permits, neighborhoods, cities } from '@/lib/db/schema';
import { eq, sql, isNull, and } from 'drizzle-orm';
import { generateWithRetry } from './generate-narrative';
import { checkUniqueness } from './quality-gate';
import type { NarrativeContext } from './prompts';

export interface BatchResult {
  processed: number;
  succeeded: number;
  failed: number;
  totalTokensUsed: { input: number; output: number };
  errors: string[];
}

export async function processNarrativeBatch(batchSize: number = 100): Promise<BatchResult> {
  const result: BatchResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    totalTokensUsed: { input: 0, output: 0 },
    errors: [],
  };

  // Fetch permits without narratives, joined with neighborhood and city names
  const pendingPermits = await db
    .select({
      permit: permits,
      neighborhoodName: neighborhoods.name,
      cityName: cities.name,
    })
    .from(permits)
    .leftJoin(neighborhoods, eq(permits.neighborhoodId, neighborhoods.id))
    .leftJoin(cities, eq(permits.cityId, cities.id))
    .where(and(isNull(permits.aiNarrative), eq(permits.noindex, false)))
    .orderBy(permits.issueDate)
    .limit(batchSize);

  if (pendingPermits.length === 0) return result;

  // Collect recent narratives for uniqueness checking
  const recentNarratives = await db
    .select({ narrative: permits.aiNarrative })
    .from(permits)
    .where(sql`${permits.aiNarrative} IS NOT NULL`)
    .orderBy(sql`${permits.aiGeneratedAt} DESC`)
    .limit(10);

  const comparisonTexts = recentNarratives
    .map((r) => r.narrative)
    .filter((n): n is string => n !== null);

  for (const row of pendingPermits) {
    const permit = row.permit;
    result.processed++;

    try {
      const context: NarrativeContext = {
        permitId: permit.globalPermitId,
        propertyAddress: permit.propertyAddress,
        permitCategory: permit.permitCategory,
        permitType: permit.permitType,
        status: permit.status,
        issueDate: permit.issueDate,
        estimatedCost: permit.estimatedCost ? parseFloat(permit.estimatedCost) : null,
        workDescription: permit.workDescription,
        neighborhoodName: row.neighborhoodName || 'the local area',
        cityName: row.cityName || 'the city',
      };

      const genResult = await generateWithRetry(context);

      result.totalTokensUsed.input += genResult.tokensUsed.input;
      result.totalTokensUsed.output += genResult.tokensUsed.output;

      if (!genResult.passed) {
        result.failed++;
        result.errors.push(
          `Permit ${permit.globalPermitId}: quality check failed - ${genResult.failureReasons.join(', ')}`
        );
        continue;
      }

      // Check uniqueness against recent narratives
      const uniqueness = checkUniqueness(genResult.narrative, comparisonTexts);
      if (uniqueness < 0.3) {
        result.failed++;
        result.errors.push(
          `Permit ${permit.globalPermitId}: uniqueness score ${uniqueness.toFixed(2)} below threshold`
        );
        continue;
      }

      // Update permit with narrative
      await db
        .update(permits)
        .set({
          aiNarrative: genResult.narrative,
          aiGeneratedAt: new Date(),
          narrativeVersion: (permit.narrativeVersion || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(permits.id, permit.id));

      // Add to comparison pool
      comparisonTexts.push(genResult.narrative);
      if (comparisonTexts.length > 20) comparisonTexts.shift();

      result.succeeded++;
    } catch (error) {
      result.failed++;
      result.errors.push(
        `Permit ${permit.globalPermitId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return result;
}
