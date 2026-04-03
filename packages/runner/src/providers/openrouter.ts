import OpenAI from 'openai';
import type { LLMProvider } from './base.js';
import type { ModelConfig, LLMResponse } from '../types.js';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * OpenRouter provider - single API key for 100+ models including:
 * Claude (Opus, Sonnet, Haiku), GPT-4, Gemini Pro, DeepSeek, Llama, Mistral, Qwen, Grok
 *
 * Uses the OpenAI-compatible API format.
 * Sign up at https://openrouter.ai to get an API key.
 */
export class OpenRouterProvider implements LLMProvider {
  readonly name = 'openrouter';

  async complete(prompt: string, config: ModelConfig): Promise<LLMResponse> {
    const client = new OpenAI({
      apiKey: config.apiKey ?? process.env.OPENROUTER_API_KEY,
      baseURL: config.baseUrl ?? OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/HunterSreeni/sreeni-bench',
        'X-Title': 'SreeniBench',
      },
    });

    const start = performance.now();

    try {
      const response = await client.chat.completions.create({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [{ role: 'user', content: prompt }],
      });

      const elapsed = performance.now() - start;

      const content = response.choices[0]?.message?.content ?? '';
      const usage = response.usage;

      return {
        content,
        model: config.model,
        responseTimeMs: Math.round(elapsed),
        inputTokens: usage?.prompt_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
      };
    } catch (error) {
      const elapsed = performance.now() - start;
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: `[ERROR] OpenRouter API call failed: ${message}`,
        model: config.model,
        responseTimeMs: Math.round(elapsed),
        inputTokens: 0,
        outputTokens: 0,
      };
    }
  }
}
