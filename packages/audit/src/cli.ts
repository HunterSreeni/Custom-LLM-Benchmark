import { Command } from 'commander';
import { resolve } from 'path';
import { runPhase1Audit } from './phases/phase1.js';
import { runPhase2Audit } from './phases/phase2.js';
import { runPhase3Audit } from './phases/phase3.js';
import { runPhase4Audit } from './phases/phase4.js';
import type { PhaseAuditResult } from './types.js';

const program = new Command();

function printResult(result: PhaseAuditResult): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  SreeniBench Phase ${result.phase} Audit`);
  console.log(`  ${result.timestamp}`);
  console.log(`${'='.repeat(60)}\n`);

  for (const check of result.checks) {
    const icon = check.passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`  [${icon}] ${check.name}`);
    console.log(`         ${check.details}`);
    if (!check.passed && check.errors.length > 0) {
      for (const err of check.errors.slice(0, 10)) {
        console.log(`         \x1b[31m- ${err}\x1b[0m`);
      }
      if (check.errors.length > 10) {
        console.log(`         ... and ${check.errors.length - 10} more`);
      }
    }
    console.log();
  }

  console.log(`${'='.repeat(60)}`);
  console.log(`  Total: ${result.totalChecks} checks | ${result.passed} passed | ${result.failed} failed`);
  if (result.allPassed) {
    console.log(`  \x1b[32mPhase ${result.phase} audit PASSED\x1b[0m`);
  } else {
    console.log(`  \x1b[31mPhase ${result.phase} audit FAILED\x1b[0m`);
  }
  console.log(`${'='.repeat(60)}\n`);
}

program
  .name('sreeni-bench-audit')
  .description('SreeniBench audit framework - validates challenge data and code integrity')
  .requiredOption('--phase <number>', 'Phase number to audit (1-4)', parseInt);

program.parse();

const opts = program.opts<{ phase: number }>();
const rootDir = resolve(import.meta.dirname, '..', '..', '..');

let result: PhaseAuditResult;

switch (opts.phase) {
  case 1:
    result = runPhase1Audit(rootDir);
    break;
  case 2:
    result = runPhase2Audit(rootDir);
    break;
  case 3:
    result = runPhase3Audit(rootDir);
    break;
  case 4:
    result = runPhase4Audit(rootDir);
    break;
  default:
    console.error(`Invalid phase: ${opts.phase}. Must be 1-4.`);
    process.exit(1);
}

printResult(result);
process.exit(result.allPassed ? 0 : 1);
