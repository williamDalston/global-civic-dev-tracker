/**
 * Manual narrative generation runner.
 * Run with: npx tsx scripts/generate-narratives.ts [batch-size]
 *
 * Examples:
 *   npx tsx scripts/generate-narratives.ts       # Default batch of 100
 *   npx tsx scripts/generate-narratives.ts 50     # Process 50 permits
 */
import { processNarrativeBatch } from '../src/lib/etl/ai/batch-processor';

async function main() {
  const batchSize = parseInt(process.argv[2] || '100', 10);

  console.log(`Starting narrative generation (batch size: ${batchSize})...`);
  console.log('');

  const startTime = Date.now();
  const result = await processNarrativeBatch(batchSize);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n=== Narrative Generation Summary ===');
  console.log(`Total time: ${elapsed}s`);
  console.log(`Processed: ${result.processed}`);
  console.log(`Succeeded: ${result.succeeded}`);
  console.log(`Failed: ${result.failed}`);
  console.log(
    `Tokens used: ${result.totalTokensUsed.input.toLocaleString()} input, ${result.totalTokensUsed.output.toLocaleString()} output`
  );

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    for (const error of result.errors) {
      console.log(`  ! ${error}`);
    }
  }
}

main().catch(console.error);
