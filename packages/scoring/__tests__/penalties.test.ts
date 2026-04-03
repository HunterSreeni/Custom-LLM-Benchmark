import { describe, it, expect } from 'vitest';
import { PenaltyTracker } from '../src/penalties.js';

describe('PenaltyTracker', () => {
  it('starts empty', () => {
    const tracker = new PenaltyTracker();
    expect(tracker.getAll()).toEqual([]);
    expect(tracker.getTotal()).toBe(0);
  });

  it('adds single penalty', () => {
    const tracker = new PenaltyTracker();
    tracker.add('-H');
    expect(tracker.getAll()).toEqual(['-H']);
    expect(tracker.getTotal()).toBe(1);
  });

  it('adds multiple penalties', () => {
    const tracker = new PenaltyTracker();
    tracker.addMultiple(['-H', '-S', '-H']);
    expect(tracker.getTotal()).toBe(3);
  });

  it('produces correct summary', () => {
    const tracker = new PenaltyTracker();
    tracker.addMultiple(['-H', '-H', '-S', '-I', '-G', '-G', '-G']);
    const summary = tracker.getSummary();
    expect(summary).toEqual({ H: 2, S: 1, I: 1, G: 3 });
  });

  it('returns empty summary when no penalties', () => {
    const tracker = new PenaltyTracker();
    expect(tracker.getSummary()).toEqual({ H: 0, S: 0, I: 0, G: 0 });
  });

  it('returns a copy of flags (not reference)', () => {
    const tracker = new PenaltyTracker();
    tracker.add('-H');
    const flags = tracker.getAll();
    flags.push('-S');
    expect(tracker.getTotal()).toBe(1);
  });

  it('describes penalty flags', () => {
    expect(PenaltyTracker.describe('-H')).toContain('Hallucination');
    expect(PenaltyTracker.describe('-S')).toContain('Security');
    expect(PenaltyTracker.describe('-I')).toContain('Ignored');
    expect(PenaltyTracker.describe('-G')).toContain('Gave up');
  });

  it('merges multiple summaries', () => {
    const merged = PenaltyTracker.mergeSummaries([
      { H: 2, S: 0, I: 1, G: 0 },
      { H: 1, S: 1, I: 0, G: 2 },
    ]);
    expect(merged).toEqual({ H: 3, S: 1, I: 1, G: 2 });
  });
});
