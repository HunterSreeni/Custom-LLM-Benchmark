import { resolve } from 'path';
import { checkSchemaValidation } from '../checks/schema-validation.js';
import { checkChallengeCompleteness } from '../checks/challenge-completeness.js';
import { checkBugManifestIntegrity, checkNoExtraBugs } from '../checks/bug-validation.js';
import { checkScoringIntegrity } from '../checks/scoring-integrity.js';
import { checkFileStructure } from '../checks/file-structure.js';
import type { PhaseAuditResult } from '../types.js';
import { runPhase1Audit } from './phase1.js';

export function runPhase2Audit(rootDir: string): PhaseAuditResult {
  // First run Phase 1 checks (additive)
  const phase1 = runPhase1Audit(rootDir);
  const checks = [...phase1.checks];

  // Phase 2 file structure
  checks.push(checkFileStructure(rootDir, [
    'categories/01-security-whitebox/challenge.yaml',
    'categories/01-security-whitebox/bugs.manifest.yaml',
    'categories/01-security-whitebox/app/src/main/java/com/techmart/TechMartApplication.java',
    'categories/01-security-whitebox/app/src/main/java/com/techmart/controller/UserController.java',
    'categories/01-security-whitebox/app/src/main/java/com/techmart/controller/AdminController.java',
    'categories/01-security-whitebox/app/src/main/java/com/techmart/service/ReportService.java',
    'categories/01-security-whitebox/app/src/main/java/com/techmart/service/SessionService.java',
    'categories/01-security-whitebox/app/src/main/java/com/techmart/config/SecurityConfig.java',
    'categories/01-security-whitebox/app/src/frontend/src/app/guards/admin.guard.ts',
    'categories/02-security-blackbox/challenge.yaml',
    'categories/02-security-blackbox/bugs.manifest.yaml',
    'categories/02-security-blackbox/fixtures/recon/http-headers.txt',
    'categories/02-security-blackbox/fixtures/recon/robots-txt.txt',
    'categories/02-security-blackbox/fixtures/api-docs/openapi.yaml',
    'categories/02-security-blackbox/fixtures/ctf/response-with-debug-header.txt',
  ]));

  // Schema validation for new categories
  const challengeYamls = [
    resolve(rootDir, 'categories/01-security-whitebox/challenge.yaml'),
    resolve(rootDir, 'categories/02-security-blackbox/challenge.yaml'),
  ];
  checks.push(checkSchemaValidation(challengeYamls));
  checks.push(checkChallengeCompleteness(challengeYamls));

  // Bug manifest validation
  const manifests = [
    resolve(rootDir, 'categories/01-security-whitebox/bugs.manifest.yaml'),
    resolve(rootDir, 'categories/02-security-blackbox/bugs.manifest.yaml'),
  ];
  checks.push(checkBugManifestIntegrity(manifests));

  // No extra bug markers in whitebox app
  checks.push(checkNoExtraBugs([
    resolve(rootDir, 'categories/01-security-whitebox/app'),
  ]));

  // Scoring integrity (re-run)
  checks.push(checkScoringIntegrity());

  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;

  return {
    phase: 2,
    timestamp: new Date().toISOString(),
    totalChecks: checks.length,
    passed,
    failed,
    checks,
    allPassed: failed === 0,
  };
}
