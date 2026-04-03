import { describe, it, expect } from 'vitest';
import { checkFileStructure } from '../src/checks/file-structure.js';
import { checkScoringIntegrity } from '../src/checks/scoring-integrity.js';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..', '..', '..');

describe('checkFileStructure', () => {
  it('passes when files exist', () => {
    const result = checkFileStructure(ROOT, ['README.md', 'package.json']);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when files are missing', () => {
    const result = checkFileStructure(ROOT, ['README.md', 'nonexistent-file.xyz']);
    expect(result.passed).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});

describe('checkScoringIntegrity', () => {
  it('all scoring fixture tests pass', () => {
    const result = checkScoringIntegrity();
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
