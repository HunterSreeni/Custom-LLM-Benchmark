import { resolve } from 'path';
import { checkSchemaValidation } from '../checks/schema-validation.js';
import { checkChallengeCompleteness } from '../checks/challenge-completeness.js';
import { checkBugManifestIntegrity } from '../checks/bug-validation.js';
import { checkFileStructure } from '../checks/file-structure.js';
import type { PhaseAuditResult } from '../types.js';
import { runPhase3Audit } from './phase3.js';

export function runPhase4Audit(rootDir: string): PhaseAuditResult {
  const phase3 = runPhase3Audit(rootDir);
  const checks = [...phase3.checks];

  // Phase 4 file structure
  checks.push(checkFileStructure(rootDir, [
    'categories/06-web3-audit/challenge.yaml',
    'categories/06-web3-audit/bugs.manifest.yaml',
    'categories/06-web3-audit/contracts/VulnerableVault.sol',
    'categories/06-web3-audit/contracts/SimpleDEX.sol',
    'categories/06-web3-audit/contracts/LendingPool.sol',
    'categories/06-web3-audit/contracts/FeeToken.sol',
    'categories/09-tool-use-agentic/challenge.yaml',
    'categories/09-tool-use-agentic/fixtures/mcp-server-spec.md',
    'categories/09-tool-use-agentic/fixtures/large-repo-structure.txt',
    'categories/11-cicd-devops/challenge.yaml',
    'categories/11-cicd-devops/bugs.manifest.yaml',
    'categories/11-cicd-devops/fixtures/phase-b/nginx.conf',
    'categories/11-cicd-devops/fixtures/phase-b/iam-policy.json',
    'categories/13-supply-chain/challenge.yaml',
    'categories/13-supply-chain/bugs.manifest.yaml',
    'categories/13-supply-chain/fixtures/vulnerable-package.json',
    'categories/13-supply-chain/fixtures/typosquatted-requirements.txt',
  ]));

  // Schema validation for all Phase 4 categories
  const challengeYamls = [
    resolve(rootDir, 'categories/06-web3-audit/challenge.yaml'),
    resolve(rootDir, 'categories/09-tool-use-agentic/challenge.yaml'),
    resolve(rootDir, 'categories/11-cicd-devops/challenge.yaml'),
    resolve(rootDir, 'categories/13-supply-chain/challenge.yaml'),
  ];
  checks.push(checkSchemaValidation(challengeYamls));
  checks.push(checkChallengeCompleteness(challengeYamls));

  // Bug manifests
  const manifests = [
    resolve(rootDir, 'categories/06-web3-audit/bugs.manifest.yaml'),
    resolve(rootDir, 'categories/11-cicd-devops/bugs.manifest.yaml'),
    resolve(rootDir, 'categories/13-supply-chain/bugs.manifest.yaml'),
  ];
  checks.push(checkBugManifestIntegrity(manifests));

  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;

  return {
    phase: 4,
    timestamp: new Date().toISOString(),
    totalChecks: checks.length,
    passed,
    failed,
    checks,
    allPassed: failed === 0,
  };
}
