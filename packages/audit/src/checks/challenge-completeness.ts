import { readFileSync } from 'fs';
import { parse } from 'yaml';
import type { AuditCheck } from '../types.js';

export function checkChallengeCompleteness(yamlPaths: string[]): AuditCheck {
  const errors: string[] = [];

  for (const yamlPath of yamlPaths) {
    try {
      const raw = readFileSync(yamlPath, 'utf-8');
      const data = parse(raw);

      if (!data?.phases || !Array.isArray(data.phases)) {
        errors.push(`${yamlPath}: Missing 'phases' array`);
        continue;
      }

      for (const phase of data.phases) {
        if (!phase.challenges || !Array.isArray(phase.challenges)) {
          errors.push(`${yamlPath}: Phase '${phase.id}' missing 'challenges' array`);
          continue;
        }

        for (const challenge of phase.challenges) {
          const prefix = `${yamlPath} [${challenge.id || 'unknown'}]`;

          if (!challenge.prompt || challenge.prompt.trim() === '') {
            errors.push(`${prefix}: Missing or empty 'prompt'`);
          }
          if (!challenge.expected_findings || !Array.isArray(challenge.expected_findings) || challenge.expected_findings.length === 0) {
            errors.push(`${prefix}: Missing or empty 'expected_findings'`);
          }
          if (!challenge.scoring_rubric) {
            errors.push(`${prefix}: Missing 'scoring_rubric'`);
          } else {
            if (challenge.scoring_rubric.max_base_score !== 10) {
              errors.push(`${prefix}: max_base_score should be 10, got ${challenge.scoring_rubric.max_base_score}`);
            }
            if (!challenge.scoring_rubric.criteria || challenge.scoring_rubric.criteria.length === 0) {
              errors.push(`${prefix}: Missing or empty scoring criteria`);
            }
          }
        }
      }
    } catch (err) {
      errors.push(`${yamlPath}: Failed to read/parse - ${(err as Error).message}`);
    }
  }

  return {
    name: 'Challenge Completeness',
    description: 'Every challenge has prompt, expected_findings, and scoring_rubric',
    passed: errors.length === 0,
    details: errors.length === 0
      ? `All challenges in ${yamlPaths.length} files are complete`
      : `${errors.length} completeness issue(s) found`,
    errors,
  };
}
