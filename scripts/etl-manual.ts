/**
 * Manual ETL runner for local development.
 * Run with: npx tsx scripts/etl-manual.ts [city-slug]
 *
 * Examples:
 *   npx tsx scripts/etl-manual.ts              # Run all cities
 *   npx tsx scripts/etl-manual.ts washington-dc # Run DC only
 */
import { runFullETL } from '../src/lib/etl/pipeline';

async function main() {
  const cityFilter = process.argv[2];

  console.log('Starting manual ETL run...');
  if (cityFilter) {
    console.log(`  Filtering to city: ${cityFilter}`);
  }
  console.log('');

  const startTime = Date.now();
  const results = await runFullETL(cityFilter ? [cityFilter] : undefined);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n=== ETL Summary ===');
  console.log(`Total time: ${elapsed}s`);

  for (const result of results) {
    const hasErrors = result.errors.length > 0;
    const icon = hasErrors ? '!' : '+';
    console.log(
      `  ${icon} ${result.citySlug}: ${result.recordsProcessed} records (${result.recordsInserted} new, ${result.recordsUpdated} updated) in ${(result.duration / 1000).toFixed(1)}s`
    );
    if (hasErrors) {
      for (const error of result.errors) {
        console.log(`    Error: ${error}`);
      }
    }
  }
}

main().catch(console.error);
