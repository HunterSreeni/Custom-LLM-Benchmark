export interface AuditCheck {
  name: string;
  description: string;
  passed: boolean;
  details: string;
  errors: string[];
}

export interface PhaseAuditResult {
  phase: number;
  timestamp: string;
  totalChecks: number;
  passed: number;
  failed: number;
  checks: AuditCheck[];
  allPassed: boolean;
}
