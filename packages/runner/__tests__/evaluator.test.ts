import { describe, it, expect } from 'vitest';
import { evaluateResponse } from '../src/evaluator.js';
import type { Challenge } from '@sreeni-bench/scoring';

function mockChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: 'test-challenge-1',
    difficulty: 'medium',
    title: 'Test Challenge',
    description: 'A test challenge for evaluation',
    prompt: 'Find the SQL injection vulnerability in this code.',
    expected_findings: [
      {
        id: 'sqli-1',
        description: 'SQL injection in login query',
        required: false,
        points: 5,
      },
      {
        id: 'xss-1',
        description: 'XSS vulnerability in output rendering',
        required: false,
        points: 3,
      },
    ],
    scoring_rubric: {
      max_base_score: 10 as const,
      criteria: [
        {
          name: 'Identifies SQL injection',
          points: 5,
          match_type: 'keyword',
          match_terms: ['sql injection', 'parameterized'],
        },
        {
          name: 'Identifies XSS',
          points: 3,
          match_type: 'keyword',
          match_terms: ['xss', 'cross-site scripting'],
        },
        {
          name: 'Exact match test',
          points: 2,
          match_type: 'exact',
          match_terms: ['CVE-2024-1234'],
        },
      ],
    },
    penalty_checks: [
      {
        flag: '-H',
        condition: 'buffer overflow',
      },
    ],
    ...overrides,
  };
}

describe('evaluateResponse', () => {
  it('should score keyword matches correctly', () => {
    const challenge = mockChallenge();
    const response =
      'This code has a SQL injection vulnerability. Use parameterized queries to fix it.';

    const result = evaluateResponse(challenge, response);

    expect(result.baseScore).toBeGreaterThanOrEqual(5);
    expect(result.findings).toContain('sqli-1');
  });

  it('should score multiple keyword matches', () => {
    const challenge = mockChallenge();
    const response =
      'Found SQL injection - use parameterized queries. Also found XSS / cross-site scripting in the template.';

    const result = evaluateResponse(challenge, response);

    expect(result.baseScore).toBe(8); // 5 (sql) + 3 (xss), no exact match
    expect(result.findings).toContain('sqli-1');
    expect(result.findings).toContain('xss-1');
  });

  it('should handle exact match criteria', () => {
    const challenge = mockChallenge();
    const response =
      'SQL injection using parameterized queries. This is related to CVE-2024-1234.';

    const result = evaluateResponse(challenge, response);

    expect(result.baseScore).toBe(7); // 5 (keyword) + 2 (exact)
  });

  it('should clamp base score to 10', () => {
    const challenge = mockChallenge();
    const response =
      'SQL injection - use parameterized queries. XSS cross-site scripting found. CVE-2024-1234 applies.';

    const result = evaluateResponse(challenge, response);

    expect(result.baseScore).toBe(10); // 5+3+2 = 10, clamped at 10
  });

  it('should return zero for no matches', () => {
    const challenge = mockChallenge();
    const response = 'Looks good, no problems detected.';

    const result = evaluateResponse(challenge, response);

    expect(result.baseScore).toBe(0);
    expect(result.findings).toEqual([]);
    expect(result.penalties).toEqual([]);
  });

  it('should detect penalties when condition text appears', () => {
    const challenge = mockChallenge();
    const response =
      'This code has a buffer overflow vulnerability and SQL injection with parameterized fix.';

    const result = evaluateResponse(challenge, response);

    expect(result.penalties).toContain('-H');
  });

  it('should not flag penalties when condition is absent', () => {
    const challenge = mockChallenge();
    const response =
      'SQL injection found. Use parameterized queries.';

    const result = evaluateResponse(challenge, response);

    expect(result.penalties).toEqual([]);
  });

  it('should handle challenges with no penalty checks', () => {
    const challenge = mockChallenge({ penalty_checks: undefined });
    const response = 'SQL injection with parameterized fix.';

    const result = evaluateResponse(challenge, response);

    expect(result.penalties).toEqual([]);
  });

  it('should match findings based on first three words of description', () => {
    const challenge = mockChallenge();
    // 'SQL injection in' are the first 3 words of finding sqli-1 description
    const response = 'Found sql injection in the login form.';

    const result = evaluateResponse(challenge, response);

    expect(result.findings).toContain('sqli-1');
  });
});
