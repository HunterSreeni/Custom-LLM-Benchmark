import {
  scoreChallenge,
  scorePhase,
  scoreCategory,
  scoreGrandTotal,
  getCategoryMaxTotal,
  getGrandMaxTotal,
} from '@sreeni-bench/scoring';
import type { Challenge, ChallengeScore } from '@sreeni-bench/scoring';
import type { AuditCheck } from '../types.js';

function makeTestChallenge(id: string, difficulty: 'easy' | 'medium' | 'hard' | 'difficult' | 'hidden'): Challenge {
  return {
    id,
    difficulty,
    title: `Test ${difficulty}`,
    description: 'Test challenge',
    prompt: 'Find the bug',
    expected_findings: [
      { id: 'f1', description: 'test finding', points: 10, required: true },
    ],
    scoring_rubric: {
      max_base_score: 10 as const,
      criteria: [
        { name: 'Finds it', points: 10, match_type: 'keyword' as const, match_terms: ['bug'] },
      ],
    },
  };
}

export function checkScoringIntegrity(): AuditCheck {
  const errors: string[] = [];

  // Test 1: Multipliers work correctly
  const easyChallenge = makeTestChallenge('e', 'easy');
  const easyResult = scoreChallenge(easyChallenge, 'found the bug');
  if (easyResult.weightedScore !== 10) {
    errors.push(`Easy challenge: expected weighted 10, got ${easyResult.weightedScore}`);
  }

  const medResult = scoreChallenge(makeTestChallenge('m', 'medium'), 'found the bug');
  if (medResult.weightedScore !== 20) {
    errors.push(`Medium challenge: expected weighted 20, got ${medResult.weightedScore}`);
  }

  const hardResult = scoreChallenge(makeTestChallenge('h', 'hard'), 'found the bug');
  if (hardResult.weightedScore !== 30) {
    errors.push(`Hard challenge: expected weighted 30, got ${hardResult.weightedScore}`);
  }

  const diffResult = scoreChallenge(makeTestChallenge('d', 'difficult'), 'found the bug');
  if (diffResult.weightedScore !== 50) {
    errors.push(`Difficult challenge: expected weighted 50, got ${diffResult.weightedScore}`);
  }

  const hiddenResult = scoreChallenge(makeTestChallenge('hid', 'hidden'), 'found the bug');
  if (hiddenResult.weightedScore !== 50) {
    errors.push(`Hidden challenge: expected weighted 50, got ${hiddenResult.weightedScore}`);
  }

  // Test 2: Phase scoring separates hidden
  const phaseScores: ChallengeScore[] = [
    easyResult, medResult, hardResult, diffResult, hiddenResult,
  ];
  const phase = scorePhase('default', phaseScores);
  if (phase.phaseScore !== 110) {
    errors.push(`Phase base score: expected 110, got ${phase.phaseScore}`);
  }
  if (phase.phaseBonus !== 50) {
    errors.push(`Phase bonus: expected 50, got ${phase.phaseBonus}`);
  }
  if (phase.phaseTotal !== 160) {
    errors.push(`Phase total: expected 160, got ${phase.phaseTotal}`);
  }

  // Test 3: Category max scores match README spec
  if (getCategoryMaxTotal('standard') !== 160) {
    errors.push(`Standard max: expected 160, got ${getCategoryMaxTotal('standard')}`);
  }
  if (getCategoryMaxTotal('2-phase') !== 320) {
    errors.push(`2-phase max: expected 320, got ${getCategoryMaxTotal('2-phase')}`);
  }
  if (getCategoryMaxTotal('3-phase') !== 480) {
    errors.push(`3-phase max: expected 480, got ${getCategoryMaxTotal('3-phase')}`);
  }

  // Test 4: Grand total max = 3840
  if (getGrandMaxTotal() !== 3840) {
    errors.push(`Grand max: expected 3840, got ${getGrandMaxTotal()}`);
  }

  // Test 5: Zero response scores zero
  const zeroResult = scoreChallenge(easyChallenge, 'no relevant content here');
  if (zeroResult.baseScore !== 0) {
    errors.push(`Zero response: expected base 0, got ${zeroResult.baseScore}`);
  }

  return {
    name: 'Scoring Integrity',
    description: 'Scoring engine produces correct outputs for known fixtures',
    passed: errors.length === 0,
    details: errors.length === 0
      ? '6 scoring fixture tests passed'
      : `${errors.length} scoring integrity issue(s)`,
    errors,
  };
}
