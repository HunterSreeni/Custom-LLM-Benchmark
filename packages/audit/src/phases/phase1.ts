import { resolve } from 'path';
import { checkSchemaValidation } from '../checks/schema-validation.js';
import { checkChallengeCompleteness } from '../checks/challenge-completeness.js';
import { checkBugManifestIntegrity, checkNoExtraBugs } from '../checks/bug-validation.js';
import { checkScoringIntegrity } from '../checks/scoring-integrity.js';
import { checkFileStructure } from '../checks/file-structure.js';
import type { PhaseAuditResult } from '../types.js';

export function runPhase1Audit(rootDir: string): PhaseAuditResult {
  const checks = [];

  // 1. File structure check
  checks.push(checkFileStructure(rootDir, [
    'packages/scoring/src/index.ts',
    'packages/scoring/src/types.ts',
    'packages/scoring/src/calculator.ts',
    'packages/scoring/src/multipliers.ts',
    'packages/scoring/src/penalties.ts',
    'packages/scoring/src/category-types.ts',
    'packages/scoring/src/aggregator.ts',
    'packages/runner/src/index.ts',
    'packages/runner/src/types.ts',
    'packages/runner/src/cli.ts',
    'packages/runner/src/executor.ts',
    'packages/runner/src/evaluator.ts',
    'packages/runner/src/reporter.ts',
    'packages/runner/src/challenge-loader.ts',
    'packages/runner/src/providers/base.ts',
    'packages/runner/src/providers/openrouter.ts',
    'packages/runner/src/providers/google-ai.ts',
    'packages/runner/src/providers/ollama.ts',
    'packages/audit/src/cli.ts',
    'categories/03-bug-detection/challenge.yaml',
    'categories/03-bug-detection/bugs.manifest.yaml',
    'categories/03-bug-detection/app/package.json',
    'categories/03-bug-detection/app/src/main.tsx',
    'categories/03-bug-detection/app/src/App.tsx',
    'categories/03-bug-detection/app/src/store/cart-store.ts',
    'categories/03-bug-detection/app/src/hooks/use-products.ts',
    'categories/03-bug-detection/app/src/hooks/use-websocket.ts',
    'categories/03-bug-detection/app/src/components/ProductList.tsx',
    'categories/03-bug-detection/app/src/components/Cart.tsx',
    'categories/03-bug-detection/app/src/components/ReviewSection.tsx',
    'categories/03-bug-detection/app/src/components/MobileNav.tsx',
    'categories/03-bug-detection/app/src/pages/Product.tsx',
    'categories/10-stress-reliability/challenge.yaml',
    'categories/10-stress-reliability/10b-hallucination/challenge.yaml',
    'categories/10-stress-reliability/10b-hallucination/data/fake-cves.yaml',
    'categories/10-stress-reliability/10b-hallucination/data/fake-packages.yaml',
    'categories/10-stress-reliability/10b-hallucination/data/fake-apis.yaml',
    'categories/10-stress-reliability/10b-hallucination/data/fake-functions.yaml',
  ]));

  // 2. Schema validation for challenge.yaml files
  const challengeYamls = [
    resolve(rootDir, 'categories/03-bug-detection/challenge.yaml'),
    resolve(rootDir, 'categories/10-stress-reliability/10b-hallucination/challenge.yaml'),
  ];
  checks.push(checkSchemaValidation(challengeYamls));

  // 3. Challenge completeness
  checks.push(checkChallengeCompleteness(challengeYamls));

  // 4. Bug manifest integrity (Cat 3)
  const manifestPaths = [
    resolve(rootDir, 'categories/03-bug-detection/bugs.manifest.yaml'),
  ];
  checks.push(checkBugManifestIntegrity(manifestPaths));

  // 5. No extra bug markers
  const appDirs = [
    resolve(rootDir, 'categories/03-bug-detection/app/src'),
  ];
  checks.push(checkNoExtraBugs(appDirs));

  // 6. Scoring integrity
  checks.push(checkScoringIntegrity());

  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;

  return {
    phase: 1,
    timestamp: new Date().toISOString(),
    totalChecks: checks.length,
    passed,
    failed,
    checks,
    allPassed: failed === 0,
  };
}
