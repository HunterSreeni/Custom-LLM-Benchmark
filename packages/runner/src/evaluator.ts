import { evaluateCriterion } from '@sreeni-bench/scoring';
import type { Challenge, PenaltyFlag } from '@sreeni-bench/scoring';

export interface EvaluationResult {
  baseScore: number;
  findings: string[];
  penalties: PenaltyFlag[];
}

/**
 * Evaluate an LLM response against a challenge's scoring rubric.
 * Uses keyword/exact matching from the scoring engine's evaluateCriterion.
 */
export function evaluateResponse(
  challenge: Challenge,
  response: string,
): EvaluationResult {
  // Score each criterion
  let baseScore = 0;
  for (const criterion of challenge.scoring_rubric.criteria) {
    baseScore += evaluateCriterion(criterion, response);
  }

  // Clamp to max base score of 10
  baseScore = Math.min(baseScore, 10);

  // Check which expected findings were matched
  const findings: string[] = [];
  for (const finding of challenge.expected_findings) {
    const terms = finding.description.split(' ').slice(0, 3);
    const matched = terms.some((term) =>
      response.toLowerCase().includes(term.toLowerCase()),
    );
    if (matched) {
      findings.push(finding.id);
    }
  }

  // Detect penalties from penalty_checks
  const penalties: PenaltyFlag[] = [];
  if (challenge.penalty_checks) {
    for (const check of challenge.penalty_checks) {
      const conditionLower = check.condition.toLowerCase();
      const responseLower = response.toLowerCase();
      // Simple heuristic: if the condition text appears in the response, flag it
      if (responseLower.includes(conditionLower)) {
        penalties.push(check.flag);
      }
    }
  }

  return { baseScore, findings, penalties };
}
