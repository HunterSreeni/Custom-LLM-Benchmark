import type { ChallengeScore, PenaltyFlag } from '@sreeni-bench/scoring';

// --- Runner-specific types ---

export interface ModelConfig {
  id: string;
  provider: 'openrouter' | 'google-ai' | 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
}

export interface RunConfig {
  models: ModelConfig[];
  categories: string[];
  outputDir: string;
  concurrency: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  responseTimeMs: number;
  inputTokens: number;
  outputTokens: number;
}

export interface ChallengeResult extends ChallengeScore {
  rawResponse: string;
}
