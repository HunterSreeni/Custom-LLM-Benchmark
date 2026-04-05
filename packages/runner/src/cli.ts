#!/usr/bin/env node

import { Command } from 'commander';
import { resolve } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';
import dotenv from 'dotenv';
import {
  scoreChallenge,
  scorePhase,
  scoreCategory,
  scoreGrandTotal,
  CATEGORY_TYPE_MAP,
} from '@sreeni-bench/scoring';
import type { CategoryType, PenaltyFlag } from '@sreeni-bench/scoring';
import type { ModelConfig, RunConfig } from './types.js';
import type { LLMProvider } from './providers/base.js';
import { OpenRouterProvider } from './providers/openrouter.js';
import { GoogleAIProvider } from './providers/google-ai.js';
import { OllamaProvider } from './providers/ollama.js';
import { loadChallengeYaml, injectSourceFiles } from './challenge-loader.js';
import { evaluateResponse } from './evaluator.js';
import { writeResults, printSummary } from './reporter.js';

dotenv.config();

// --- Model Presets ---
// OpenRouter model IDs: https://openrouter.ai/models
// Google AI Studio model IDs: https://ai.google.dev/models
// Ollama model IDs: whatever you have pulled locally

const MODEL_PRESETS: Record<string, Omit<ModelConfig, 'id'>> = {
  // --- Frontier (via OpenRouter) ---
  'claude-opus-4.6': {
    provider: 'openrouter',
    model: 'anthropic/claude-opus-4',
    maxTokens: 4096,
    temperature: 0,
  },
  'claude-sonnet-4.6': {
    provider: 'openrouter',
    model: 'anthropic/claude-sonnet-4',
    maxTokens: 4096,
    temperature: 0,
  },
  'claude-haiku-4.5': {
    provider: 'openrouter',
    model: 'anthropic/claude-haiku-4-5',
    maxTokens: 4096,
    temperature: 0,
  },
  'gpt-4.1': {
    provider: 'openrouter',
    model: 'openai/gpt-4.1',
    maxTokens: 4096,
    temperature: 0,
  },
  'gpt-4o': {
    provider: 'openrouter',
    model: 'openai/gpt-4o',
    maxTokens: 4096,
    temperature: 0,
  },
  'gpt-4o-mini': {
    provider: 'openrouter',
    model: 'openai/gpt-4o-mini',
    maxTokens: 4096,
    temperature: 0,
  },
  'grok-3': {
    provider: 'openrouter',
    model: 'x-ai/grok-3',
    maxTokens: 4096,
    temperature: 0,
  },

  // --- Reasoning (via OpenRouter) ---
  'o3': {
    provider: 'openrouter',
    model: 'openai/o3',
    maxTokens: 4096,
    temperature: 0,
  },
  'deepseek-r1': {
    provider: 'openrouter',
    model: 'deepseek/deepseek-r1',
    maxTokens: 4096,
    temperature: 0,
  },
  'deepseek-v3': {
    provider: 'openrouter',
    model: 'deepseek/deepseek-chat-v3',
    maxTokens: 4096,
    temperature: 0,
  },

  // --- Open Source (via OpenRouter) ---
  'llama-4': {
    provider: 'openrouter',
    model: 'meta-llama/llama-4-maverick',
    maxTokens: 4096,
    temperature: 0,
  },
  'mistral-large': {
    provider: 'openrouter',
    model: 'mistralai/mistral-large',
    maxTokens: 4096,
    temperature: 0,
  },
  'qwen-2.5': {
    provider: 'openrouter',
    model: 'qwen/qwen-2.5-72b-instruct',
    maxTokens: 4096,
    temperature: 0,
  },

  // --- Google AI Studio (free tier) ---
  'gemini-2.5-pro': {
    provider: 'openrouter',
    model: 'google/gemini-2.5-pro-preview-03-25',
    maxTokens: 4096,
    temperature: 0,
  },
  'gemini-2.5-flash': {
    provider: 'openrouter',
    model: 'google/gemini-2.5-flash-preview:thinking',
    maxTokens: 4096,
    temperature: 0,
  },
  'gemini-2.0-flash': {
    provider: 'google-ai',
    model: 'gemini-2.0-flash',
    maxTokens: 4096,
    temperature: 0,
  },
  'gemini-flash-lite': {
    provider: 'google-ai',
    model: 'gemini-2.0-flash-lite',
    maxTokens: 4096,
    temperature: 0,
  },

  // --- Ollama Cloud ---
  'glm-5': {
    provider: 'ollama',
    model: 'glm-5',
    baseUrl: 'https://ollama.com/api',
    maxTokens: 4096,
    temperature: 0.6,
  },
  'kimi-k2.5': {
    provider: 'ollama',
    model: 'kimi-k2.5',
    baseUrl: 'https://ollama.com/api',
    maxTokens: 4096,
    temperature: 0.6,
  },
  'nemotron-3-super': {
    provider: 'ollama',
    model: 'nemotron-3-super',
    baseUrl: 'https://ollama.com/api',
    maxTokens: 4096,
    temperature: 0,
  },
  'qwen3.5': {
    provider: 'ollama',
    model: 'qwen3.5',
    baseUrl: 'https://ollama.com/api',
    maxTokens: 4096,
    temperature: 0.7,
  },
  'minimax-m2.7': {
    provider: 'ollama',
    model: 'minimax-m2.7',
    baseUrl: 'https://ollama.com/api',
    maxTokens: 4096,
    temperature: 1.0,
  },

  // --- Ollama (local, free) ---
  'ollama-llama3': {
    provider: 'ollama',
    model: 'llama3',
    maxTokens: 4096,
    temperature: 0,
  },
  'ollama-mistral': {
    provider: 'ollama',
    model: 'mistral',
    maxTokens: 4096,
    temperature: 0,
  },
  'ollama-qwen2.5': {
    provider: 'ollama',
    model: 'qwen2.5',
    maxTokens: 4096,
    temperature: 0,
  },
  'ollama-deepseek-r1': {
    provider: 'ollama',
    model: 'deepseek-r1',
    maxTokens: 4096,
    temperature: 0,
  },
};

function resolveModelConfig(modelId: string): ModelConfig {
  const preset = MODEL_PRESETS[modelId];
  if (preset) {
    return { id: modelId, ...preset };
  }

  // Check if it looks like an Ollama model (no slash)
  if (!modelId.includes('/')) {
    console.warn(
      `No preset for "${modelId}" - assuming Ollama local model.`,
    );
    return {
      id: modelId,
      provider: 'ollama',
      model: modelId,
      maxTokens: 4096,
      temperature: 0,
    };
  }

  // Looks like an OpenRouter model ID (has slash like "anthropic/claude-sonnet-4")
  console.warn(
    `No preset for "${modelId}" - assuming OpenRouter model.`,
  );
  return {
    id: modelId,
    provider: 'openrouter',
    model: modelId,
    maxTokens: 4096,
    temperature: 0,
  };
}

function createProvider(config: ModelConfig): LLMProvider {
  switch (config.provider) {
    case 'openrouter':
      return new OpenRouterProvider();
    case 'google-ai':
      return new GoogleAIProvider();
    case 'ollama':
      return new OllamaProvider();
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

function discoverChallenges(
  categoriesDir: string,
  filterCategories: string[],
): Array<{ yamlPath: string; categoryDir: string }> {
  const results: Array<{ yamlPath: string; categoryDir: string }> = [];

  if (!existsSync(categoriesDir)) return results;

  const dirs = readdirSync(categoriesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  for (const dirName of dirs) {
    // Check filter - match category number, name, or subdir name
    if (filterCategories.length > 0) {
      const matchesFilter = filterCategories.some(f => {
        const catNum = dirName.match(/^(\d+)-/)?.[1];
        return dirName.includes(f) || catNum === f || dirName === f;
      });
      if (!matchesFilter) continue;
    }

    const categoryDir = resolve(categoriesDir, dirName);

    // Check for challenge.yaml in the category dir
    const yamlPath = resolve(categoryDir, 'challenge.yaml');
    let addedTopLevel = false;

    if (existsSync(yamlPath)) {
      // Try to validate it - if it's a stub with empty phases, skip and try subdirs
      try {
        loadChallengeYaml(yamlPath);
        results.push({ yamlPath, categoryDir });
        addedTopLevel = true;
      } catch {
        // Top-level challenge.yaml is invalid (likely a stub) - fall through to subdirs
      }
    }

    // Always check subdirs for additional challenge files (e.g., 10b-hallucination/)
    if (!addedTopLevel) {
      const subDirs = readdirSync(categoryDir, { withFileTypes: true })
        .filter(d => d.isDirectory());
      for (const sub of subDirs) {
        // Also check subdir filter (e.g., --categories 10b matches 10b-hallucination)
        if (filterCategories.length > 0) {
          const matchesSub = filterCategories.some(f => sub.name.includes(f));
          const matchesParent = filterCategories.some(f => {
            const catNum = dirName.match(/^(\d+)-/)?.[1];
            return catNum === f;
          });
          if (!matchesSub && !matchesParent) continue;
        }

        const subYaml = resolve(categoryDir, sub.name, 'challenge.yaml');
        if (existsSync(subYaml)) {
          results.push({ yamlPath: subYaml, categoryDir: resolve(categoryDir, sub.name) });
        }
      }
    }
  }

  return results;
}

const program = new Command();

program
  .name('sreeni-bench')
  .description('SreeniBench - LLM Benchmarking Runner')
  .version('0.1.0')
  .option(
    '--models <models>',
    'Comma-separated model IDs (presets or OpenRouter/Ollama model names)',
    'gemini-2.5-flash',
  )
  .option(
    '--categories <categories>',
    'Comma-separated category IDs or slugs',
    '',
  )
  .option('--output-dir <dir>', 'Output directory for results', './results')
  .option('--concurrency <n>', 'Max concurrent challenge executions', '1')
  .option('--list-models', 'List all available model presets')
  .action(async (opts) => {
    if (opts.listModels) {
      console.log('\nAvailable model presets:\n');
      console.log('  Provider      | Preset ID              | Model');
      console.log('  ------------- | ---------------------- | -----');
      for (const [id, config] of Object.entries(MODEL_PRESETS)) {
        const provider = config.provider.padEnd(13);
        const preset = id.padEnd(22);
        console.log(`  ${provider} | ${preset} | ${config.model}`);
      }
      console.log('\nYou can also pass raw model IDs:');
      console.log('  - OpenRouter: "anthropic/claude-sonnet-4" (any model from openrouter.ai/models)');
      console.log('  - Ollama: "llama3" (any model you have pulled locally)');
      console.log('\nAPI keys needed:');
      console.log('  - OpenRouter: OPENROUTER_API_KEY (get at openrouter.ai)');
      console.log('  - Google AI:  GOOGLE_AI_API_KEY (get at aistudio.google.com)');
      console.log('  - Ollama:     None (runs locally)\n');
      return;
    }

    const modelIds = opts.models
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    const categories = opts.categories
      ? opts.categories
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];
    const outputDir = resolve(opts.outputDir);
    const concurrency = parseInt(opts.concurrency, 10) || 1;

    const runConfig: RunConfig = {
      models: modelIds.map(resolveModelConfig),
      categories,
      outputDir,
      concurrency,
    };

    console.log('SreeniBench Runner v0.1.0');
    console.log(`Models: ${modelIds.join(', ')}`);
    console.log(
      `Categories: ${categories.length > 0 ? categories.join(', ') : 'all'}`,
    );
    console.log(`Output: ${outputDir}`);
    console.log(`Concurrency: ${concurrency}`);
    console.log('');

    // Discover challenge YAML files
    const categoriesDir = resolve(import.meta.dirname, '..', '..', '..', 'categories');
    const challengeFiles = discoverChallenges(categoriesDir, categories);

    if (challengeFiles.length === 0) {
      console.error('No challenge files found.');
      process.exit(1);
    }

    console.log(`Found ${challengeFiles.length} category challenge file(s)\n`);

    // Run each model against each category
    for (const modelConfig of runConfig.models) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`  Model: ${modelConfig.id} (${modelConfig.provider}/${modelConfig.model})`);
      console.log(`${'='.repeat(60)}\n`);

      const provider = createProvider(modelConfig);
      const allCategoryScores = [];
      const allPenalties: PenaltyFlag[] = [];
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      const rawResponses: Array<{
        categoryName: string;
        challengeId: string;
        difficulty: string;
        title: string;
        score: number;
        maxScore: number;
        pct: number;
        findingsMatched: string[];
        expectedFindings: Array<{ id: string; description: string }>;
        rawResponse: string;
      }> = [];

      for (const { yamlPath, categoryDir } of challengeFiles) {
        let categoryDef;
        try {
          categoryDef = loadChallengeYaml(yamlPath);
        } catch (err) {
          console.error(`  Failed to load ${yamlPath}: ${(err as Error).message}`);
          continue;
        }

        const cat = categoryDef.category;
        console.log(`  Category ${cat.id}: ${cat.name} (${cat.type})`);

        const phaseScores = [];

        for (const phase of categoryDef.phases) {
          console.log(`    Phase: ${phase.name}`);
          const challengeScores = [];

          for (const challenge of phase.challenges) {
            process.stdout.write(`      [${challenge.difficulty.toUpperCase().padEnd(9)}] ${challenge.title}... `);

            try {
              // Build prompt with source files
              const fullPrompt = injectSourceFiles(challenge, categoryDir);

              // Call LLM
              const llmResponse = await provider.complete(fullPrompt, modelConfig);

              totalInputTokens += llmResponse.inputTokens;
              totalOutputTokens += llmResponse.outputTokens;

              // Skip scoring if the response is an API error
              if (llmResponse.content.startsWith('[ERROR]')) {
                const zeroScore = scoreChallenge(
                  challenge,
                  '',
                  ['-G' as PenaltyFlag],
                  llmResponse.responseTimeMs,
                  0,
                );
                challengeScores.push(zeroScore);
                allPenalties.push('-G' as PenaltyFlag);
                console.log(`0/${zeroScore.maxWeighted} pts (API ERROR) [${(llmResponse.responseTimeMs / 1000).toFixed(1)}s]`);
                console.log(`        >> ${llmResponse.content.slice(0, 150)}`);
                continue;
              }

              // Evaluate
              const evaluation = evaluateResponse(challenge, llmResponse.content);

              // Score
              const score = scoreChallenge(
                challenge,
                llmResponse.content,
                evaluation.penalties,
                llmResponse.responseTimeMs,
                llmResponse.outputTokens,
              );

              challengeScores.push(score);
              allPenalties.push(...evaluation.penalties);

              // Capture raw response for review
              rawResponses.push({
                categoryName: cat.name,
                challengeId: challenge.id,
                difficulty: challenge.difficulty,
                title: challenge.title,
                score: score.weightedScore,
                maxScore: score.maxWeighted,
                pct: score.maxWeighted > 0 ? Math.round((score.weightedScore / score.maxWeighted) * 100) : 0,
                findingsMatched: score.findingsMatched,
                expectedFindings: (challenge.expected_findings ?? []).map((f: { id: string; description: string }) => ({ id: f.id, description: f.description })),
                rawResponse: llmResponse.content,
              });

              const pctOfMax = score.maxWeighted > 0
                ? Math.round((score.weightedScore / score.maxWeighted) * 100)
                : 0;
              console.log(
                `${score.weightedScore}/${score.maxWeighted} pts (${pctOfMax}%) [${(llmResponse.responseTimeMs / 1000).toFixed(1)}s] | tokens: ${llmResponse.inputTokens} in / ${llmResponse.outputTokens} out`,
              );

              // Log errors or empty responses
              if (llmResponse.content.startsWith('[ERROR]') || llmResponse.outputTokens === 0) {
                console.log(`        >> Response issue: ${llmResponse.content.slice(0, 150)}`);
              }
            } catch (err) {
              console.log(`ERROR: ${(err as Error).message}`);
            }
          }

          phaseScores.push(scorePhase(phase.id, challengeScores));
        }

        const catType = (CATEGORY_TYPE_MAP[cat.id] ?? cat.type) as CategoryType;
        const catScore = scoreCategory(cat.id, cat.slug, catType, phaseScores);
        allCategoryScores.push(catScore);

        console.log(`    => Category score: ${catScore.categoryScore}/${catScore.categoryMax} (${catScore.categoryPct.toFixed(1)}%)\n`);
      }

      // Grand total
      const grand = scoreGrandTotal(allCategoryScores, allPenalties);

      // Build filename suffix from categories to avoid overwrites
      // e.g. "nemotron-3-super-cat10-09-06-08" or "nemotron-3-super-all"
      const catSuffix = categories.length > 0
        ? `-cat${categories.join('-')}`
        : '-all';
      const fileBase = `${modelConfig.id.replace(/\//g, '_')}${catSuffix}`;

      // Write results (include token usage)
      writeResults(outputDir, modelConfig.id, grand, fileBase);

      // Write raw responses for review
      const { writeFileSync: writeFile, mkdirSync: mkDir } = await import('node:fs');
      const { join: joinPath } = await import('node:path');
      mkDir(outputDir, { recursive: true });
      const responsesPath = joinPath(outputDir, `${fileBase}-responses.json`);
      writeFile(responsesPath, JSON.stringify(rawResponses, null, 2), 'utf-8');
      console.log(`Responses written to: ${responsesPath}`);

      printSummary(grand);

      console.log(`  Token Usage: ${totalInputTokens.toLocaleString()} input + ${totalOutputTokens.toLocaleString()} output = ${(totalInputTokens + totalOutputTokens).toLocaleString()} total`);
      console.log('');
    }

    console.log('\nBenchmark complete.');
  });

program.parse();
