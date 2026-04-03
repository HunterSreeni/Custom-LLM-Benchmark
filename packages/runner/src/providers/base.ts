import type { ModelConfig, LLMResponse } from '../types.js';

export interface LLMProvider {
  readonly name: string;
  complete(prompt: string, config: ModelConfig): Promise<LLMResponse>;
}
