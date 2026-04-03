import type { LLMProvider } from './base.js';
import type { ModelConfig, LLMResponse } from '../types.js';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';

  async complete(prompt: string, config: ModelConfig): Promise<LLMResponse> {
    const baseUrl = config.baseUrl ?? DEFAULT_OLLAMA_URL;
    const url = `${baseUrl.replace(/\/$/, '')}/api/generate`;

    const start = performance.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          prompt,
          stream: false,
          options: {
            num_predict: config.maxTokens,
            temperature: config.temperature,
          },
        }),
      });

      const elapsed = performance.now() - start;

      if (!response.ok) {
        const body = await response.text();
        return {
          content: `[ERROR] Ollama returned ${response.status}: ${body}`,
          model: config.model,
          responseTimeMs: Math.round(elapsed),
          inputTokens: 0,
          outputTokens: 0,
        };
      }

      const data = (await response.json()) as OllamaGenerateResponse;

      return {
        content: data.response,
        model: config.model,
        responseTimeMs: Math.round(elapsed),
        inputTokens: data.prompt_eval_count ?? 0,
        outputTokens: data.eval_count ?? 0,
      };
    } catch (error) {
      const elapsed = performance.now() - start;
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: `[ERROR] Ollama API call failed: ${message}`,
        model: config.model,
        responseTimeMs: Math.round(elapsed),
        inputTokens: 0,
        outputTokens: 0,
      };
    }
  }
}
