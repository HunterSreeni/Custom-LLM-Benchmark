import { existsSync } from 'fs';
import { resolve } from 'path';
import type { AuditCheck } from '../types.js';

export function checkFileStructure(rootDir: string, requiredPaths: string[]): AuditCheck {
  const errors: string[] = [];

  for (const relPath of requiredPaths) {
    const fullPath = resolve(rootDir, relPath);
    if (!existsSync(fullPath)) {
      errors.push(`Missing: ${relPath}`);
    }
  }

  return {
    name: 'File Structure',
    description: 'All required files and directories exist',
    passed: errors.length === 0,
    details: errors.length === 0
      ? `All ${requiredPaths.length} required paths exist`
      : `${errors.length} missing path(s)`,
    errors,
  };
}
