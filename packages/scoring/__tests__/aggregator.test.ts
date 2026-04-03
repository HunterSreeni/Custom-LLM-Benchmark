import { describe, it, expect } from 'vitest';
import { buildRadarData, compareModels } from '../src/aggregator.js';
import type { ModelResult } from '../src/types.js';

function makeModelResult(model: string, categories: Record<string, { score: number; max: number }>): ModelResult {
  const cats: Record<string, any> = {};
  for (const [slug, { score, max }] of Object.entries(categories)) {
    cats[slug] = {
      categoryId: 0,
      categorySlug: slug,
      categoryType: 'standard',
      phases: {},
      categoryScore: score,
      categoryMax: max,
      categoryPct: max > 0 ? (score / max) * 100 : 0,
    };
  }

  return {
    model,
    runDate: '2026-04-03T10:00:00Z',
    runnerVersion: '0.1.0',
    grandTotal: {
      categories: cats,
      penaltiesSummary: { H: 0, S: 0, I: 0, G: 0 },
      grandTotal: Object.values(categories).reduce((s, c) => s + c.score, 0),
      grandMax: Object.values(categories).reduce((s, c) => s + c.max, 0),
      grandPct: 0,
    },
  };
}

describe('buildRadarData', () => {
  it('builds radar data from model result', () => {
    const result = makeModelResult('claude-opus', {
      'bug-detection': { score: 120, max: 160 },
      'test-gen': { score: 200, max: 320 },
    });
    const radar = buildRadarData(result);
    expect(radar.model).toBe('claude-opus');
    expect(radar.data).toHaveLength(2);
    expect(radar.data[0].categorySlug).toBe('bug-detection');
    expect(radar.data[0].pct).toBe(75);
  });
});

describe('compareModels', () => {
  it('ranks models by grand total', () => {
    const results = [
      makeModelResult('gpt-4', { 'bug-detection': { score: 80, max: 160 } }),
      makeModelResult('claude-opus', { 'bug-detection': { score: 140, max: 160 } }),
      makeModelResult('gemini', { 'bug-detection': { score: 100, max: 160 } }),
    ];
    const { rankings } = compareModels(results);
    expect(rankings[0].model).toBe('claude-opus');
    expect(rankings[1].model).toBe('gemini');
    expect(rankings[2].model).toBe('gpt-4');
  });

  it('identifies category winners', () => {
    const results = [
      makeModelResult('model-a', { 'security': { score: 90, max: 160 }, 'coding': { score: 50, max: 160 } }),
      makeModelResult('model-b', { 'security': { score: 70, max: 160 }, 'coding': { score: 130, max: 160 } }),
    ];
    const { categoryWinners } = compareModels(results);
    expect(categoryWinners['security']).toBe('model-a');
    expect(categoryWinners['coding']).toBe('model-b');
  });

  it('returns radar data for all models', () => {
    const results = [
      makeModelResult('a', { 'cat1': { score: 50, max: 100 } }),
      makeModelResult('b', { 'cat1': { score: 70, max: 100 } }),
    ];
    const { radarData } = compareModels(results);
    expect(radarData).toHaveLength(2);
  });
});
