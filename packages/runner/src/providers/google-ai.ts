import type { LLMProvider } from './base.js';
import type { ModelConfig, LLMResponse } from '../types.js';

/**
 * Google AI Studio provider - free tier access to Gemini models.
 * Get your free API key at https://aistudio.google.com
 *
 * Free tier limits (as of 2026):
 * - Gemini Flash: 15 RPM, 1M tokens/day
 * - Gemini Pro: 2 RPM, 50K tokens/day
 */
export class GoogleAIProvider implements LLMProvider {
  readonly name = 'google-ai';

  async complete(prompt: string, config: ModelConfig): Promise<LLMResponse> {
    let GoogleGenerativeAI: any;
    try {
      const mod = await import('@google/generative-ai');
      GoogleGenerativeAI = mod.GoogleGenerativeAI;
    } catch {
      throw new Error(
        'Google AI SDK not installed. Run: pnpm add @google/generative-ai',
      );
    }

    const apiKey = config.apiKey ?? process.env.GOOGLE_AI_API_KEY ?? '';
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: config.model });

    const start = performance.now();

    try {
      const result = await model.generateContent(prompt);
      const elapsed = performance.now() - start;

      const response = result.response;
      const content = response.text() ?? '';
      const usage = response.usageMetadata;

      return {
        content,
        model: config.model,
        responseTimeMs: Math.round(elapsed),
        inputTokens: usage?.promptTokenCount ?? 0,
        outputTokens: usage?.candidatesTokenCount ?? 0,
      };
    } catch (error) {
      const elapsed = performance.now() - start;
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: `[ERROR] Google AI API call failed: ${message}`,
        model: config.model,
        responseTimeMs: Math.round(elapsed),
        inputTokens: 0,
        outputTokens: 0,
      };
    }
  }
}
