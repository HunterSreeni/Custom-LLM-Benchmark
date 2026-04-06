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

/**
 * Keyword match with partial credit.
 * If all terms match: full points.
 * If some terms match: proportional points (rounded down).
 * Minimum 1 term must match for any credit.
 */
function matchKeywordPartial(response: string, terms: string[], maxPoints: number): number {
  if (terms.length === 0) return 0;
  const lower = response.toLowerCase();
  const matched = terms.filter(term => lower.includes(term.toLowerCase())).length;
  if (matched === 0) return 0;
  if (matched === terms.length) return maxPoints;
  // Partial credit: proportional to terms matched, floored
  return Math.floor(maxPoints * (matched / terms.length));
}

function matchExact(response: string, terms: string[]): boolean {
  return terms.every(term => response.includes(term));
}

/**
 * Fuzzy/semantic matching: checks for term variants, synonyms,
 * and partial string overlap beyond strict keyword inclusion.
 */
function matchSemantic(response: string, terms: string[], maxPoints: number): number {
  if (terms.length === 0) return 0;
  const lower = response.toLowerCase();
  let matched = 0;

  for (const term of terms) {
    const termLower = term.toLowerCase();
    // Direct match
    if (lower.includes(termLower)) {
      matched++;
      continue;
    }
    // Hyphen/space/underscore variants (e.g. "re-entrancy" vs "reentrancy")
    const normalized = termLower.replace(/[-_\s]/g, '');
    const responseNormalized = lower.replace(/[-_\s]/g, '');
    if (responseNormalized.includes(normalized)) {
      matched++;
      continue;
    }
    // Plural/singular (simple s suffix)
    if (lower.includes(termLower + 's') || (termLower.endsWith('s') && lower.includes(termLower.slice(0, -1)))) {
      matched++;
      continue;
    }
    // Word stem match: if the term is 5+ chars, check if first 80% of chars appear as a word prefix
    if (termLower.length >= 5) {
      const stem = termLower.slice(0, Math.ceil(termLower.length * 0.8));
      if (lower.includes(stem)) {
        matched += 0.7; // partial credit for stem match
        continue;
      }
    }
  }

  if (matched < 0.5) return 0;
  if (matched >= terms.length) return maxPoints;
  return Math.floor(maxPoints * (matched / terms.length));
}

export function evaluateCriterion(
  criterion: ScoringCriterion,
  response: string,
): number {
  const terms = criterion.match_terms ?? [];

  switch (criterion.match_type) {
    case 'keyword':
      return matchKeywordPartial(response, terms, criterion.points);
    case 'exact':
      return matchExact(response, terms) ? criterion.points : 0;
    case 'semantic':
      return matchSemantic(response, terms, criterion.points);
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
  let phaseMax = 0;
  let phaseBonusMax = 0;

  for (const cs of challengeScores) {
    challenges[cs.challengeId] = cs;
    if (isHidden(cs.difficulty)) {
      phaseBonus += cs.weightedScore;
      phaseBonusMax += cs.maxWeighted;
    } else {
      phaseScore += cs.weightedScore;
      phaseMax += cs.maxWeighted;
    }
  }

  return {
    phaseId,
    challenges,
    phaseScore,
    phaseBonus,
    phaseTotal: phaseScore + phaseBonus,
    phaseMax,
    phaseBonusMax,
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
  let maxTotal = 0;

  for (const ps of phaseScores) {
    phases[ps.phaseId] = ps;
    totalScore += ps.phaseTotal;
    maxTotal += ps.phaseMax + ps.phaseBonusMax;
  }

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
