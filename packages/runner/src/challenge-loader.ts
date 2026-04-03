import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { CategoryDefinitionSchema } from '@sreeni-bench/scoring';
import type { CategoryDefinition, Challenge } from '@sreeni-bench/scoring';

/**
 * Load and validate a challenge YAML file.
 */
export function loadChallengeYaml(yamlPath: string): CategoryDefinition {
  const raw = readFileSync(yamlPath, 'utf-8');
  const parsed = parseYaml(raw);
  return CategoryDefinitionSchema.parse(parsed);
}

/**
 * Read each source_file listed in a challenge and append the file contents
 * to the challenge prompt. Returns the full prompt with injected source code.
 */
export function injectSourceFiles(
  challenge: Challenge,
  categoryDir: string,
): string {
  const sourceFiles = challenge.source_files ?? [];

  if (sourceFiles.length === 0) {
    return challenge.prompt;
  }

  const parts: string[] = [challenge.prompt, '\n\n--- Source Files ---\n'];

  for (const filePath of sourceFiles) {
    const fullPath = join(categoryDir, filePath);
    try {
      const content = readFileSync(fullPath, 'utf-8');
      parts.push(`\n### File: ${filePath}\n\`\`\`\n${content}\n\`\`\`\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      parts.push(`\n### File: ${filePath}\n[ERROR reading file: ${message}]\n`);
    }
  }

  return parts.join('');
}
