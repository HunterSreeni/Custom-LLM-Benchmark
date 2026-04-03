// Types and schemas
export {
  DifficultySchema,
  CategoryTypeSchema,
  PenaltyFlagSchema,
  MatchTypeSchema,
  ScoringCriterionSchema,
  ExpectedFindingSchema,
  PenaltyCheckSchema,
  ChallengeSchema,
  PhaseSchema,
  CategoryDefinitionSchema,
  PlantedBugSchema,
  BugManifestSchema,
} from './types.js';

export type {
  Difficulty,
  CategoryType,
  PenaltyFlag,
  MatchType,
  ScoringCriterion,
  ExpectedFinding,
  PenaltyCheck,
  Challenge,
  Phase,
  CategoryDefinition,
  PlantedBug,
  BugManifest,
  ChallengeScore,
  PhaseScore,
  CategoryScore,
  PenaltySummary,
  GrandTotal,
  ModelResult,
  RadarDataPoint,
  ModelRadarData,
} from './types.js';

// Multipliers
export {
  DIFFICULTY_MULTIPLIERS,
  MAX_BASE_SCORE,
  applyMultiplier,
  getMaxWeighted,
  isHidden,
} from './multipliers.js';

// Penalties
export { PenaltyTracker } from './penalties.js';

// Category types
export {
  CATEGORY_TYPE_MAP,
  getPhaseCount,
  getCategoryMaxBase,
  getCategoryMaxBonus,
  getCategoryMaxTotal,
  getGrandMaxBase,
  getGrandMaxBonus,
  getGrandMaxTotal,
} from './category-types.js';

// Calculator
export {
  evaluateCriterion,
  scoreChallenge,
  scorePhase,
  scoreCategory,
  scoreGrandTotal,
} from './calculator.js';

// Aggregator
export { buildRadarData, compareModels } from './aggregator.js';
