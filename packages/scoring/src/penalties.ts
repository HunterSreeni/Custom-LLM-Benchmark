import type { PenaltyFlag, PenaltySummary } from './types.js';

const FLAG_DESCRIPTIONS: Record<PenaltyFlag, string> = {
  '-H': 'Hallucination - stated false info confidently',
  '-S': 'Security vulnerability introduced in generated code',
  '-I': 'Ignored an explicit instruction',
  '-G': 'Gave up without trying available tools/search',
};

export class PenaltyTracker {
  private flags: PenaltyFlag[] = [];

  add(flag: PenaltyFlag): void {
    this.flags.push(flag);
  }

  addMultiple(flags: PenaltyFlag[]): void {
    this.flags.push(...flags);
  }

  getAll(): PenaltyFlag[] {
    return [...this.flags];
  }

  getSummary(): PenaltySummary {
    return {
      H: this.flags.filter(f => f === '-H').length,
      S: this.flags.filter(f => f === '-S').length,
      I: this.flags.filter(f => f === '-I').length,
      G: this.flags.filter(f => f === '-G').length,
    };
  }

  getTotal(): number {
    return this.flags.length;
  }

  static describe(flag: PenaltyFlag): string {
    return FLAG_DESCRIPTIONS[flag];
  }

  static mergeSummaries(summaries: PenaltySummary[]): PenaltySummary {
    return summaries.reduce(
      (acc, s) => ({
        H: acc.H + s.H,
        S: acc.S + s.S,
        I: acc.I + s.I,
        G: acc.G + s.G,
      }),
      { H: 0, S: 0, I: 0, G: 0 },
    );
  }
}
