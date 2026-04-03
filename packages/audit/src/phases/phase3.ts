import { resolve } from 'path';
import { checkSchemaValidation } from '../checks/schema-validation.js';
import { checkChallengeCompleteness } from '../checks/challenge-completeness.js';
import { checkBugManifestIntegrity } from '../checks/bug-validation.js';
import { checkFileStructure } from '../checks/file-structure.js';
import type { PhaseAuditResult } from '../types.js';
import { runPhase2Audit } from './phase2.js';

export function runPhase3Audit(rootDir: string): PhaseAuditResult {
  // First run Phase 2 checks (additive)
  const phase2 = runPhase2Audit(rootDir);
  const checks = [...phase2.checks];

  // Phase 3 file structure
  checks.push(checkFileStructure(rootDir, [
    'categories/04-test-gen-qa-strategy/challenge.yaml',
    'categories/04-test-gen-qa-strategy/bugs.manifest.yaml',
    'categories/04-test-gen-qa-strategy/modules/python/api_client.py',
    'categories/04-test-gen-qa-strategy/modules/javascript/dom-utils.js',
    'categories/04-test-gen-qa-strategy/modules/typescript/form-validator.ts',
    'categories/04-test-gen-qa-strategy/fixtures/bug-reports.md',
    'categories/04-test-gen-qa-strategy/fixtures/product-sort-spec.md',
    'categories/05-code-generation/challenge.yaml',
    'categories/05-code-generation/bugs.manifest.yaml',
    'categories/05-code-generation/fixtures/data-table-spec.md',
    'categories/05-code-generation/fixtures/callback-module.js',
    'categories/05-code-generation/fixtures/class-component.tsx',
    'categories/07-reasoning/challenge.yaml',
    'categories/07-reasoning/fixtures/phase-a/production-logs.txt',
    'categories/07-reasoning/fixtures/phase-a/slow-rust-cli.rs',
    'categories/07-reasoning/fixtures/phase-b/python-traceback.txt',
    'categories/07-reasoning/fixtures/phase-b/spring-boot-trace.txt',
    'categories/07-reasoning/fixtures/phase-c/mixed-logs.txt',
    'categories/07-reasoning/fixtures/phase-c/incident-report.txt',
    'categories/08-writing/challenge.yaml',
    'categories/08-writing/fixtures/rfc-technical.md',
    'categories/08-writing/fixtures/writing-rules.md',
    'categories/08-writing/fixtures/xss-finding.md',
    'categories/08-writing/fixtures/exploit-chain.md',
    'categories/12-code-review/challenge.yaml',
    'categories/12-code-review/fixtures/style-pr.diff',
    'categories/12-code-review/fixtures/logic-bug-pr.diff',
    'categories/12-code-review/fixtures/good-pr.diff',
  ]));

  // Schema validation
  const challengeYamls = [
    resolve(rootDir, 'categories/04-test-gen-qa-strategy/challenge.yaml'),
    resolve(rootDir, 'categories/05-code-generation/challenge.yaml'),
    resolve(rootDir, 'categories/07-reasoning/challenge.yaml'),
    resolve(rootDir, 'categories/08-writing/challenge.yaml'),
    resolve(rootDir, 'categories/12-code-review/challenge.yaml'),
  ];
  checks.push(checkSchemaValidation(challengeYamls));
  checks.push(checkChallengeCompleteness(challengeYamls));

  // Bug manifests for cats that have them
  const manifests = [
    resolve(rootDir, 'categories/04-test-gen-qa-strategy/bugs.manifest.yaml'),
    resolve(rootDir, 'categories/05-code-generation/bugs.manifest.yaml'),
  ];
  checks.push(checkBugManifestIntegrity(manifests));

  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;

  return {
    phase: 3,
    timestamp: new Date().toISOString(),
    totalChecks: checks.length,
    passed,
    failed,
    checks,
    allPassed: failed === 0,
  };
}
