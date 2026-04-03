export type { AuditCheck, PhaseAuditResult } from './types.js';
export { checkSchemaValidation } from './checks/schema-validation.js';
export { checkChallengeCompleteness } from './checks/challenge-completeness.js';
export { checkBugManifestIntegrity, checkNoExtraBugs } from './checks/bug-validation.js';
export { checkScoringIntegrity } from './checks/scoring-integrity.js';
export { checkFileStructure } from './checks/file-structure.js';
export { runPhase1Audit } from './phases/phase1.js';
