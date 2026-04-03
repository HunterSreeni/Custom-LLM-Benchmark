import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { GrandTotal, ModelResult } from '@sreeni-bench/scoring';

/**
 * Write scoring results to a JSON file in the output directory.
 */
export function writeResults(
  outputDir: string,
  modelId: string,
  grandTotal: GrandTotal,
): void {
  mkdirSync(outputDir, { recursive: true });

  const result: ModelResult = {
    model: modelId,
    runDate: new Date().toISOString(),
    runnerVersion: '0.1.0',
    grandTotal,
  };

  const filePath = join(outputDir, `${modelId.replace(/\//g, '_')}.json`);
  writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');

  console.log(`Results written to: ${filePath}`);
}

/**
 * Print a summary table of the grand total to the console.
 */
export function printSummary(grandTotal: GrandTotal): void {
  console.log('\n=== SreeniBench Results Summary ===\n');

  // Category breakdown table
  const categories = Object.values(grandTotal.categories);
  if (categories.length > 0) {
    console.log(
      '  Category'.padEnd(30) +
        'Score'.padStart(8) +
        'Max'.padStart(8) +
        'Pct'.padStart(8),
    );
    console.log('  ' + '-'.repeat(52));

    for (const cat of categories) {
      const row =
        `  ${cat.categorySlug}`.padEnd(30) +
        `${cat.categoryScore}`.padStart(8) +
        `${cat.categoryMax}`.padStart(8) +
        `${cat.categoryPct.toFixed(1)}%`.padStart(8);
      console.log(row);
    }

    console.log('  ' + '-'.repeat(52));
  }

  // Grand total
  console.log(
    `  ${'TOTAL'.padEnd(28)}` +
      `${grandTotal.grandTotal}`.padStart(8) +
      `${grandTotal.grandMax}`.padStart(8) +
      `${grandTotal.grandPct.toFixed(1)}%`.padStart(8),
  );

  // Penalties
  const p = grandTotal.penaltiesSummary;
  const penaltyParts: string[] = [];
  if (p.H > 0) penaltyParts.push(`Hallucination(H): ${p.H}`);
  if (p.S > 0) penaltyParts.push(`Surface(S): ${p.S}`);
  if (p.I > 0) penaltyParts.push(`Incomplete(I): ${p.I}`);
  if (p.G > 0) penaltyParts.push(`Generic(G): ${p.G}`);

  if (penaltyParts.length > 0) {
    console.log(`\n  Penalties: ${penaltyParts.join(', ')}`);
  } else {
    console.log('\n  Penalties: None');
  }

  console.log('');
}
