import type {
  Challenge,
  ChallengeScore,
  CategoryScore,
  CategoryType,
  GrandTotal,
  PenaltyFlag,
  PhaseScore,
  ScoringCriterion,
} from './types.js';
import { applyMultiplier, getMaxWeighted, isHidden } from './multipliers.js';
import { PenaltyTracker } from './penalties.js';
import { getCategoryMaxBase, getCategoryMaxBonus } from './category-types.js';

// --- Criterion Matching ---

function matchKeyword(response: string, terms: string[]): boolean {
  const lower = response.toLowerCase();
  return terms.every(term => lower.includes(term.toLowerCase()));
}

function matchExact(response: string, terms: string[]): boolean {
  return terms.every(term => response.includes(term));
}

export function evaluateCriterion(
  criterion: ScoringCriterion,
  response: string,
): number {
  const terms = criterion.match_terms ?? [];

  switch (criterion.match_type) {
    case 'keyword':
      return matchKeyword(response, terms) ? criterion.points : 0;
    case 'exact':
      return matchExact(response, terms) ? criterion.points : 0;
    case 'semantic':
      // Semantic matching requires LLM judge - return 0 for now, Phase 2+
      return 0;
    case 'manual':
      // Manual review required - return 0, flagged in results
      return 0;
  }
}

// --- Challenge Scoring ---

export function scoreChallenge(
  challenge: Challenge,
  response: string,
  penalties: PenaltyFlag[] = [],
  responseTimeMs = 0,
  responseTokens = 0,
): ChallengeScore {
  const baseScore = challenge.scoring_rubric.criteria.reduce(
    (sum, criterion) => sum + evaluateCriterion(criterion, response),
    0,
  );

  const clampedBase = Math.min(baseScore, 10);

  return {
    challengeId: challenge.id,
    difficulty: challenge.difficulty,
    baseScore: clampedBase,
    weightedScore: applyMultiplier(clampedBase, challenge.difficulty),
    maxWeighted: getMaxWeighted(challenge.difficulty),
    findingsMatched: challenge.expected_findings
      .filter(f => {
        const terms = f.description.split(' ').slice(0, 3);
        return terms.some(t => response.toLowerCase().includes(t.toLowerCase()));
      })
      .map(f => f.id),
    penalties,
    responseTimeMs,
    responseTokens,
  };
}

// --- Phase Scoring ---

export function scorePhase(
  phaseId: string,
  challengeScores: ChallengeScore[],
): PhaseScore {
  const challenges: Record<string, ChallengeScore> = {};
  let phaseScore = 0;
  let phaseBonus = 0;

  for (const cs of challengeScores) {
    challenges[cs.challengeId] = cs;
    if (isHidden(cs.difficulty)) {
      phaseBonus += cs.weightedScore;
    } else {
      phaseScore += cs.weightedScore;
    }
  }

  return {
    phaseId,
    challenges,
    phaseScore,
    phaseBonus,
    phaseTotal: phaseScore + phaseBonus,
    phaseMax: 110,
    phaseBonusMax: 50,
  };
}

// --- Category Scoring ---

export function scoreCategory(
  categoryId: number,
  categorySlug: string,
  categoryType: CategoryType,
  phaseScores: PhaseScore[],
): CategoryScore {
  const phases: Record<string, PhaseScore> = {};
  let totalScore = 0;

  for (const ps of phaseScores) {
    phases[ps.phaseId] = ps;
    totalScore += ps.phaseTotal;
  }

  const maxBase = getCategoryMaxBase(categoryType);
  const maxBonus = getCategoryMaxBonus(categoryType);
  const maxTotal = maxBase + maxBonus;

  return {
    categoryId,
    categorySlug,
    categoryType,
    phases,
    categoryScore: totalScore,
    categoryMax: maxTotal,
    categoryPct: maxTotal > 0 ? (totalScore / maxTotal) * 100 : 0,
  };
}

// --- Grand Total ---

export function scoreGrandTotal(
  categoryScores: CategoryScore[],
  allPenalties: PenaltyFlag[] = [],
): GrandTotal {
  const categories: Record<string, CategoryScore> = {};
  let grandTotal = 0;
  let grandMax = 0;

  for (const cs of categoryScores) {
    categories[cs.categorySlug] = cs;
    grandTotal += cs.categoryScore;
    grandMax += cs.categoryMax;
  }

  const tracker = new PenaltyTracker();
  tracker.addMultiple(allPenalties);

  return {
    categories,
    penaltiesSummary: tracker.getSummary(),
    grandTotal,
    grandMax,
    grandPct: grandMax > 0 ? (grandTotal / grandMax) * 100 : 0,
  };
}
