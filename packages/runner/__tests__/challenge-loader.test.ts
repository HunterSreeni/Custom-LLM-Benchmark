import { describe, it, expect } from 'vitest';
import { loadChallengeYaml, injectSourceFiles } from '../src/challenge-loader.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { Challenge } from '@sreeni-bench/scoring';

const VALID_YAML = `
category:
  id: 1
  name: Test Category
  slug: test-category
  type: standard
  tech_stack:
    - typescript
    - node
phases:
  - id: phase-1
    name: Phase One
    challenges:
      - id: ch-1
        difficulty: easy
        title: Easy Challenge
        description: A simple test challenge
        prompt: Find the bug in this code.
        source_files:
          - src/app.ts
        expected_findings:
          - id: bug-1
            description: Off by one error in loop
            required: false
            points: 5
        scoring_rubric:
          max_base_score: 10
          criteria:
            - name: Finds the bug
              points: 5
              match_type: keyword
              match_terms:
                - off by one
                - loop
            - name: Suggests fix
              points: 5
              match_type: keyword
              match_terms:
                - fix
                - correct
`;

const INVALID_YAML = `
category:
  id: 99
  name: Bad
  slug: bad
  type: invalid_type
  tech_stack: []
phases: []
`;

describe('loadChallengeYaml', () => {
  let tmpDir: string;

  function setup() {
    tmpDir = join(tmpdir(), `sreeni-bench-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  }

  function cleanup() {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }

  it('should parse valid YAML correctly', () => {
    setup();
    try {
      const yamlPath = join(tmpDir, 'valid.yaml');
      writeFileSync(yamlPath, VALID_YAML, 'utf-8');

      const result = loadChallengeYaml(yamlPath);

      expect(result.category.id).toBe(1);
      expect(result.category.slug).toBe('test-category');
      expect(result.category.type).toBe('standard');
      expect(result.category.tech_stack).toEqual(['typescript', 'node']);
      expect(result.phases).toHaveLength(1);
      expect(result.phases[0].challenges).toHaveLength(1);
      expect(result.phases[0].challenges[0].id).toBe('ch-1');
      expect(result.phases[0].challenges[0].difficulty).toBe('easy');
      expect(result.phases[0].challenges[0].expected_findings).toHaveLength(1);
      expect(result.phases[0].challenges[0].scoring_rubric.criteria).toHaveLength(2);
    } finally {
      cleanup();
    }
  });

  it('should throw on invalid YAML schema', () => {
    setup();
    try {
      const yamlPath = join(tmpDir, 'invalid.yaml');
      writeFileSync(yamlPath, INVALID_YAML, 'utf-8');

      expect(() => loadChallengeYaml(yamlPath)).toThrow();
    } finally {
      cleanup();
    }
  });

  it('should throw on non-existent file', () => {
    expect(() => loadChallengeYaml('/nonexistent/path/file.yaml')).toThrow();
  });
});

describe('injectSourceFiles', () => {
  let tmpDir: string;

  function setup() {
    tmpDir = join(tmpdir(), `sreeni-bench-inject-${Date.now()}`);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
  }

  function cleanup() {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }

  it('should inject source file contents into the prompt', () => {
    setup();
    try {
      writeFileSync(join(tmpDir, 'src', 'app.ts'), 'const x = 1;', 'utf-8');

      const challenge: Challenge = {
        id: 'ch-1',
        difficulty: 'easy',
        title: 'Test',
        description: 'Test challenge',
        prompt: 'Review this code:',
        source_files: ['src/app.ts'],
        expected_findings: [],
        scoring_rubric: { max_base_score: 10, criteria: [] },
      };

      const result = injectSourceFiles(challenge, tmpDir);

      expect(result).toContain('Review this code:');
      expect(result).toContain('src/app.ts');
      expect(result).toContain('const x = 1;');
    } finally {
      cleanup();
    }
  });

  it('should return bare prompt when no source files', () => {
    const challenge: Challenge = {
      id: 'ch-2',
      difficulty: 'easy',
      title: 'Test',
      description: 'No files',
      prompt: 'Just a question.',
      expected_findings: [],
      scoring_rubric: { max_base_score: 10, criteria: [] },
    };

    const result = injectSourceFiles(challenge, '/does/not/matter');

    expect(result).toBe('Just a question.');
  });

  it('should handle missing source files gracefully', () => {
    setup();
    try {
      const challenge: Challenge = {
        id: 'ch-3',
        difficulty: 'easy',
        title: 'Test',
        description: 'Missing file',
        prompt: 'Check this:',
        source_files: ['nonexistent.ts'],
        expected_findings: [],
        scoring_rubric: { max_base_score: 10, criteria: [] },
      };

      const result = injectSourceFiles(challenge, tmpDir);

      expect(result).toContain('[ERROR reading file:');
    } finally {
      cleanup();
    }
  });
});
