import { readFileSync, existsSync, readdirSync } from 'fs';
import { parse } from 'yaml';
import { resolve, dirname } from 'path';
import { BugManifestSchema } from '@sreeni-bench/scoring';
import type { AuditCheck } from '../types.js';

export function checkBugManifestIntegrity(manifestPaths: string[]): AuditCheck {
  const errors: string[] = [];

  for (const manifestPath of manifestPaths) {
    try {
      const raw = readFileSync(manifestPath, 'utf-8');
      const data = parse(raw);
      const result = BugManifestSchema.safeParse(data);

      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push(`${manifestPath}: Schema error - ${issue.path.join('.')} - ${issue.message}`);
        }
        continue;
      }

      const manifest = result.data;
      const categoryDir = dirname(manifestPath);

      // Check total_bugs matches array length
      if (manifest.total_bugs !== manifest.bugs.length) {
        errors.push(
          `${manifestPath}: total_bugs says ${manifest.total_bugs} but bugs array has ${manifest.bugs.length} entries`,
        );
      }

      // Check each bug file exists and pattern is present
      for (const bug of manifest.bugs) {
        const bugFile = resolve(categoryDir, bug.file);

        if (!existsSync(bugFile)) {
          errors.push(`${manifestPath}: Bug '${bug.id}' references file '${bug.file}' which does not exist`);
          continue;
        }

        const content = readFileSync(bugFile, 'utf-8');
        const lines = content.split('\n');

        // Check line number is within file bounds
        if (bug.line > lines.length || bug.line < 1) {
          errors.push(
            `${manifestPath}: Bug '${bug.id}' references line ${bug.line} but file has ${lines.length} lines`,
          );
        }
      }

      // Check for unique bug IDs
      const ids = manifest.bugs.map(b => b.id);
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (dupes.length > 0) {
        errors.push(`${manifestPath}: Duplicate bug IDs: ${dupes.join(', ')}`);
      }
    } catch (err) {
      errors.push(`${manifestPath}: Failed to read/parse - ${(err as Error).message}`);
    }
  }

  return {
    name: 'Bug Manifest Integrity',
    description: 'All planted bugs exist at declared file:line, no duplicates, count matches',
    passed: errors.length === 0,
    details: errors.length === 0
      ? `${manifestPaths.length} manifest(s) validated successfully`
      : `${errors.length} bug manifest issue(s) found`,
    errors,
  };
}

export function checkNoExtraBugs(appDirs: string[]): AuditCheck {
  const errors: string[] = [];
  const suspiciousPatterns = [
    /\/\/\s*BUG/i,
    /\/\/\s*PLANTED/i,
    /\/\/\s*TODO.?BUG/i,
    /\/\/\s*INTENTIONAL/i,
    /\/\*\s*BUG/i,
    /\/\*\s*PLANTED/i,
  ];

  for (const dir of appDirs) {
    try {
      const files = findSourceFiles(dir);
      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          for (const pattern of suspiciousPatterns) {
            if (pattern.test(lines[i])) {
              errors.push(`${file}:${i + 1}: Suspicious marker found: "${lines[i].trim()}"`);
            }
          }
        }
      }
    } catch (err) {
      errors.push(`${dir}: Failed to scan - ${(err as Error).message}`);
    }
  }

  return {
    name: 'No Extra Bug Markers',
    description: 'No PLANTED/BUG/TODO-BUG comments found in source code',
    passed: errors.length === 0,
    details: errors.length === 0
      ? `${appDirs.length} app dir(s) scanned clean`
      : `${errors.length} suspicious marker(s) found`,
    errors,
  };
}

function findSourceFiles(dir: string): string[] {
  const results: string[] = [];

  function walk(d: string) {
    const entries = readdirSync(d, { withFileTypes: true });
    for (const entry of entries) {
      const full = resolve(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
        walk(full);
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        results.push(full);
      }
    }
  }

  walk(dir);
  return results;
}
