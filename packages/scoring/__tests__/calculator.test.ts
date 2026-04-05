import { describe, it, expect } from 'vitest';
import {
  evaluateCriterion,
  scoreChallenge,
  scorePhase,
  scoreCategory,
  scoreGrandTotal,
} from '../src/calculator.js';
import type { Challenge, ChallengeScore, ScoringCriterion } from '../src/types.js';

// --- Helpers ---

function makeCriterion(overrides: Partial<ScoringCriterion> = {}): ScoringCriterion {
  return {
    name: 'Test criterion',
    points: 5,
    match_type: 'keyword',
    match_terms: ['useEffect', 'dependency'],
    ...overrides,
  };
}

function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: 'test-easy',
    difficulty: 'easy',
    title: 'Test Challenge',
    description: 'A test challenge',
    prompt: 'Find the bug',
    expected_findings: [
      { id: 'finding-1', description: 'useEffect missing dependency', points: 5, required: false },
    ],
    scoring_rubric: {
      max_base_score: 10 as const,
      criteria: [
        makeCriterion({ name: 'Finds useEffect bug', points: 5 }),
        makeCriterion({ name: 'Explains why', points: 3, match_terms: ['stale', 'data'] }),
        makeCriterion({ name: 'Suggests fix', points: 2, match_terms: ['dependency array'] }),
      ],
    },
    ...overrides,
  };
}

// --- evaluateCriterion ---

describe('evaluateCriterion', () => {
  it('keyword match - all terms present', () => {
    const criterion = makeCriterion({ match_type: 'keyword', match_terms: ['useEffect', 'dependency'] });
    const score = evaluateCriterion(criterion, 'The useEffect hook is missing a dependency in the array');
    expect(score).toBe(5);
  });

  it('keyword match - case insensitive', () => {
    const criterion = makeCriterion({ match_type: 'keyword', match_terms: ['USEEFFECT'] });
    const score = evaluateCriterion(criterion, 'the useEffect hook');
    expect(score).toBe(5);
  });

  it('keyword match - missing terms', () => {
    const criterion = makeCriterion({ match_type: 'keyword', match_terms: ['useEffect', 'dependency'] });
    const score = evaluateCriterion(criterion, 'The hook has a problem');
    expect(score).toBe(0);
  });

  it('exact match - present', () => {
    const criterion = makeCriterion({ match_type: 'exact', match_terms: ['useEffect'] });
    const score = evaluateCriterion(criterion, 'The useEffect hook');
    expect(score).toBe(5);
  });

  it('exact match - case sensitive', () => {
    const criterion = makeCriterion({ match_type: 'exact', match_terms: ['useEffect'] });
    const score = evaluateCriterion(criterion, 'The USEEFFECT hook');
    expect(score).toBe(0);
  });

  it('semantic match returns 0 (not implemented yet)', () => {
    const criterion = makeCriterion({ match_type: 'semantic', match_description: 'explains stale data' });
    const score = evaluateCriterion(criterion, 'The effect uses stale data because deps are wrong');
    expect(score).toBe(0);
  });

  it('manual match returns 0 (requires human review)', () => {
    const criterion = makeCriterion({ match_type: 'manual' });
    const score = evaluateCriterion(criterion, 'any response');
    expect(score).toBe(0);
  });

  it('returns 0 when no match_terms provided for keyword', () => {
    const criterion = makeCriterion({ match_type: 'keyword', match_terms: undefined });
    const score = evaluateCriterion(criterion, 'any response');
    // No terms = no evidence of match, return 0
    expect(score).toBe(0);
  });
});

// --- scoreChallenge ---

describe('scoreChallenge', () => {
  it('scores easy challenge with full marks', () => {
    const challenge = makeChallenge({ difficulty: 'easy' });
    const response = 'The useEffect hook has a missing dependency in the dependency array, causing stale data';
    const result = scoreChallenge(challenge, response);

    expect(result.baseScore).toBe(10); // 5 + 3 + 2
    expect(result.weightedScore).toBe(10); // 10 * 1x
    expect(result.maxWeighted).toBe(10);
    expect(result.difficulty).toBe('easy');
  });

  it('scores medium challenge with partial marks', () => {
    const challenge = makeChallenge({ id: 'test-medium', difficulty: 'medium' });
    const response = 'The useEffect has a dependency issue';
    const result = scoreChallenge(challenge, response);

    expect(result.baseScore).toBe(5); // only first criterion matches
    expect(result.weightedScore).toBe(10); // 5 * 2x
    expect(result.maxWeighted).toBe(20);
  });

  it('scores difficult challenge with zero', () => {
    const challenge = makeChallenge({ id: 'test-diff', difficulty: 'difficult' });
    const response = 'I see no issues here';
    const result = scoreChallenge(challenge, response);

    expect(result.baseScore).toBe(0);
    expect(result.weightedScore).toBe(0);
    expect(result.maxWeighted).toBe(50);
  });

  it('clamps base score to 10', () => {
    const challenge = makeChallenge({
      scoring_rubric: {
        max_base_score: 10 as const,
        criteria: [
          makeCriterion({ points: 7, match_terms: ['a'] }),
          makeCriterion({ points: 7, match_terms: ['b'] }),
        ],
      },
    });
    const result = scoreChallenge(challenge, 'a b');
    expect(result.baseScore).toBe(10);
  });

  it('records penalties', () => {
    const challenge = makeChallenge();
    const result = scoreChallenge(challenge, 'test', ['-H', '-S']);
    expect(result.penalties).toEqual(['-H', '-S']);
  });

  it('records timing info', () => {
    const challenge = makeChallenge();
    const result = scoreChallenge(challenge, 'test', [], 1500, 300);
    expect(result.responseTimeMs).toBe(1500);
    expect(result.responseTokens).toBe(300);
  });
});

// --- scorePhase ---

describe('scorePhase', () => {
  it('sums non-hidden scores into phaseScore', () => {
    const scores: ChallengeScore[] = [
      { challengeId: 'e', difficulty: 'easy', baseScore: 10, weightedScore: 10, maxWeighted: 10, findingsMatched: [], penalties: [], responseTimeMs: 0, responseTokens: 0 },
      { challengeId: 'm', difficulty: 'medium', baseScore: 8, weightedScore: 16, maxWeighted: 20, findingsMatched: [], penalties: [], responseTimeMs: 0, responseTokens: 0 },
      { challengeId: 'h', difficulty: 'hard', baseScore: 5, weightedScore: 15, maxWeighted: 30, findingsMatched: [], penalties: [], responseTimeMs: 0, responseTokens: 0 },
      { challengeId: 'd', difficulty: 'difficult', baseScore: 6, weightedScore: 30, maxWeighted: 50, findingsMatched: [], penalties: [], responseTimeMs: 0, responseTokens: 0 },
    ];
    const result = scorePhase('default', scores);
    expect(result.phaseScore).toBe(71); // 10+16+15+30
    expect(result.phaseBonus).toBe(0);
    expect(result.phaseTotal).toBe(71);
  });

  it('separates hidden scores into phaseBonus', () => {
    const scores: ChallengeScore[] = [
      { challengeId: 'e', difficulty: 'easy', baseScore: 10, weightedScore: 10, maxWeighted: 10, findingsMatched: [], penalties: [], responseTimeMs: 0, responseTokens: 0 },
      { challengeId: 'hidden', difficulty: 'hidden', baseScore: 8, weightedScore: 40, maxWeighted: 50, findingsMatched: [], penalties: [], responseTimeMs: 0, responseTokens: 0 },
    ];
    const result = scorePhase('default', scores);
    expect(result.phaseScore).toBe(10);
    expect(result.phaseBonus).toBe(40);
    expect(result.phaseTotal).toBe(50);
  });
});

// --- scoreCategory ---

describe('scoreCategory', () => {
  it('calculates standard category (160 max)', () => {
    const phase = {
      phaseId: 'default',
      challenges: {},
      phaseScore: 90,
      phaseBonus: 30,
      phaseTotal: 120,
      phaseMax: 110,
      phaseBonusMax: 50,
    };
    const result = scoreCategory(3, 'bug-detection', 'standard', [phase]);
    expect(result.categoryScore).toBe(120);
    expect(result.categoryMax).toBe(160);
    expect(result.categoryPct).toBe(75);
  });

  it('calculates 2-phase category (320 max)', () => {
    const phaseA = { phaseId: 'a', challenges: {}, phaseScore: 100, phaseBonus: 40, phaseTotal: 140, phaseMax: 110, phaseBonusMax: 50 };
    const phaseB = { phaseId: 'b', challenges: {}, phaseScore: 80, phaseBonus: 20, phaseTotal: 100, phaseMax: 110, phaseBonusMax: 50 };
    const result = scoreCategory(4, 'test-gen', '2-phase', [phaseA, phaseB]);
    expect(result.categoryScore).toBe(240);
    expect(result.categoryMax).toBe(320);
    expect(result.categoryPct).toBe(75);
  });
});

// --- scoreGrandTotal ---

describe('scoreGrandTotal', () => {
  it('sums all categories', () => {
    const cats = [
      { categoryId: 3, categorySlug: 'bug-detection', categoryType: 'standard' as const, phases: {}, categoryScore: 120, categoryMax: 160, categoryPct: 75 },
      { categoryId: 4, categorySlug: 'test-gen', categoryType: '2-phase' as const, phases: {}, categoryScore: 240, categoryMax: 320, categoryPct: 75 },
    ];
    const result = scoreGrandTotal(cats, ['-H', '-H', '-S']);
    expect(result.grandTotal).toBe(360);
    expect(result.grandMax).toBe(480);
    expect(result.grandPct).toBe(75);
    expect(result.penaltiesSummary).toEqual({ H: 2, S: 1, I: 0, G: 0 });
  });

  it('handles empty categories', () => {
    const result = scoreGrandTotal([]);
    expect(result.grandTotal).toBe(0);
    expect(result.grandMax).toBe(0);
    expect(result.grandPct).toBe(0);
  });
});
