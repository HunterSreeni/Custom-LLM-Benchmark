import { z } from 'zod';

// --- Enums ---

export const DifficultySchema = z.enum(['easy', 'medium', 'hard', 'difficult', 'hidden']);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const CategoryTypeSchema = z.enum(['standard', '2-phase', '3-phase']);
export type CategoryType = z.infer<typeof CategoryTypeSchema>;

export const PenaltyFlagSchema = z.enum(['-H', '-S', '-I', '-G']);
export type PenaltyFlag = z.infer<typeof PenaltyFlagSchema>;

export const MatchTypeSchema = z.enum(['keyword', 'semantic', 'exact', 'manual']);
export type MatchType = z.infer<typeof MatchTypeSchema>;

// --- Challenge Definition Schemas ---

export const ScoringCriterionSchema = z.object({
  name: z.string(),
  points: z.number().min(0).max(10),
  match_type: MatchTypeSchema,
  match_terms: z.array(z.string()).optional(),
  match_description: z.string().optional(),
});
export type ScoringCriterion = z.infer<typeof ScoringCriterionSchema>;

export const ExpectedFindingSchema = z.object({
  id: z.string(),
  description: z.string(),
  file: z.string().optional(),
  line_range: z.tuple([z.number(), z.number()]).optional(),
  required: z.boolean().default(false),
  points: z.number(),
});
export type ExpectedFinding = z.infer<typeof ExpectedFindingSchema>;

export const PenaltyCheckSchema = z.object({
  flag: PenaltyFlagSchema,
  condition: z.string(),
});
export type PenaltyCheck = z.infer<typeof PenaltyCheckSchema>;

export const ChallengeMetadataSchema = z.object({
  time_limit_seconds: z.number().optional(),
  max_tokens: z.number().optional(),
}).optional();

export const ChallengeSchema = z.object({
  id: z.string(),
  difficulty: DifficultySchema,
  title: z.string(),
  description: z.string(),
  prompt: z.string(),
  source_files: z.array(z.string()).optional(),
  expected_findings: z.array(ExpectedFindingSchema),
  scoring_rubric: z.object({
    max_base_score: z.literal(10),
    criteria: z.array(ScoringCriterionSchema),
  }),
  penalty_checks: z.array(PenaltyCheckSchema).optional(),
  metadata: ChallengeMetadataSchema,
});
export type Challenge = z.infer<typeof ChallengeSchema>;

export const PhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  challenges: z.array(ChallengeSchema),
});
export type Phase = z.infer<typeof PhaseSchema>;

export const CategoryDefinitionSchema = z.object({
  category: z.object({
    id: z.number().min(1).max(13),
    name: z.string(),
    slug: z.string(),
    type: CategoryTypeSchema,
    tech_stack: z.array(z.string()),
  }),
  phases: z.array(PhaseSchema),
});
export type CategoryDefinition = z.infer<typeof CategoryDefinitionSchema>;

// --- Bug Manifest Schema ---

export const PlantedBugSchema = z.object({
  id: z.string(),
  difficulty: DifficultySchema,
  file: z.string(),
  line: z.number(),
  description: z.string(),
  type: z.string(),
  verification: z.string(),
});
export type PlantedBug = z.infer<typeof PlantedBugSchema>;

export const BugManifestSchema = z.object({
  category_id: z.number(),
  total_bugs: z.number(),
  bugs: z.array(PlantedBugSchema),
});
export type BugManifest = z.infer<typeof BugManifestSchema>;

// --- Scoring Output Types ---

export interface ChallengeScore {
  challengeId: string;
  difficulty: Difficulty;
  baseScore: number;
  weightedScore: number;
  maxWeighted: number;
  findingsMatched: string[];
  penalties: PenaltyFlag[];
  responseTimeMs: number;
  responseTokens: number;
}

export interface PhaseScore {
  phaseId: string;
  challenges: Record<string, ChallengeScore>;
  phaseScore: number;
  phaseBonus: number;
  phaseTotal: number;
  phaseMax: number;
  phaseBonusMax: number;
}

export interface CategoryScore {
  categoryId: number;
  categorySlug: string;
  categoryType: CategoryType;
  phases: Record<string, PhaseScore>;
  categoryScore: number;
  categoryMax: number;
  categoryPct: number;
}

export interface PenaltySummary {
  H: number;
  S: number;
  I: number;
  G: number;
}

export interface GrandTotal {
  categories: Record<string, CategoryScore>;
  penaltiesSummary: PenaltySummary;
  grandTotal: number;
  grandMax: number;
  grandPct: number;
}

export interface ModelResult {
  model: string;
  runDate: string;
  runnerVersion: string;
  grandTotal: GrandTotal;
}

// --- Radar Chart Data ---

export interface RadarDataPoint {
  categorySlug: string;
  categoryName: string;
  score: number;
  maxScore: number;
  pct: number;
}

export interface ModelRadarData {
  model: string;
  data: RadarDataPoint[];
}
