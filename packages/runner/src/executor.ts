import { scoreChallenge } from '@sreeni-bench/scoring';
import type { Challenge } from '@sreeni-bench/scoring';
import type { LLMProvider } from './providers/base.js';
import type { ModelConfig, ChallengeResult } from './types.js';
import { injectSourceFiles } from './challenge-loader.js';
import { evaluateResponse } from './evaluator.js';

/**
 * Execute a single challenge against an LLM provider.
 * Builds the prompt (with injected source files), calls the provider,
 * measures timing, evaluates, and scores.
 */
export async function executeChallenge(
  provider: LLMProvider,
  config: ModelConfig,
  challenge: Challenge,
  categoryDir: string,
): Promise<ChallengeResult> {
  // Build the full prompt with source files injected
  const fullPrompt = injectSourceFiles(challenge, categoryDir);

  // Call the LLM provider
  const llmResponse = await provider.complete(fullPrompt, config);

  // Evaluate the response
  const evaluation = evaluateResponse(challenge, llmResponse.content);

  // Score using the scoring engine
  const score = scoreChallenge(
    challenge,
    llmResponse.content,
    evaluation.penalties,
    llmResponse.responseTimeMs,
    llmResponse.outputTokens,
  );

  return {
    ...score,
    rawResponse: llmResponse.content,
  };
}
