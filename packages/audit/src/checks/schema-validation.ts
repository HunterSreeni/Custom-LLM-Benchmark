import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { CategoryDefinitionSchema } from '@sreeni-bench/scoring';
import type { AuditCheck } from '../types.js';

export function checkSchemaValidation(yamlPaths: string[]): AuditCheck {
  const errors: string[] = [];

  for (const yamlPath of yamlPaths) {
    try {
      const raw = readFileSync(yamlPath, 'utf-8');
      const data = parse(raw);
      const result = CategoryDefinitionSchema.safeParse(data);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push(`${yamlPath}: ${issue.path.join('.')} - ${issue.message}`);
        }
      }
    } catch (err) {
      errors.push(`${yamlPath}: Failed to read/parse - ${(err as Error).message}`);
    }
  }

  return {
    name: 'Schema Validation',
    description: 'All challenge.yaml files parse against Zod CategoryDefinitionSchema',
    passed: errors.length === 0,
    details: errors.length === 0
      ? `${yamlPaths.length} challenge files validated successfully`
      : `${errors.length} validation error(s) found`,
    errors,
  };
}
