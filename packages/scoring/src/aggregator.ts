import type { ModelResult, ModelRadarData, RadarDataPoint, GrandTotal } from './types.js';

export function buildRadarData(result: ModelResult): ModelRadarData {
  const data: RadarDataPoint[] = Object.entries(result.grandTotal.categories).map(
    ([slug, cat]) => ({
      categorySlug: slug,
      categoryName: slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      score: cat.categoryScore,
      maxScore: cat.categoryMax,
      pct: cat.categoryPct,
    }),
  );

  return { model: result.model, data };
}

export function compareModels(results: ModelResult[]): {
  rankings: Array<{ model: string; grandTotal: number; grandPct: number }>;
  radarData: ModelRadarData[];
  categoryWinners: Record<string, string>;
} {
  const rankings = results
    .map(r => ({
      model: r.model,
      grandTotal: r.grandTotal.grandTotal,
      grandPct: r.grandTotal.grandPct,
    }))
    .sort((a, b) => b.grandTotal - a.grandTotal);

  const radarData = results.map(r => buildRadarData(r));

  const categoryWinners: Record<string, string> = {};
  if (results.length > 0) {
    const allSlugs = Object.keys(results[0].grandTotal.categories);
    for (const slug of allSlugs) {
      let bestModel = '';
      let bestScore = -1;
      for (const r of results) {
        const cat = r.grandTotal.categories[slug];
        if (cat && cat.categoryScore > bestScore) {
          bestScore = cat.categoryScore;
          bestModel = r.model;
        }
      }
      categoryWinners[slug] = bestModel;
    }
  }

  return { rankings, radarData, categoryWinners };
}
