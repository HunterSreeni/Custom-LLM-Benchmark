import { describe, it, expect } from 'vitest';
import { DIFFICULTY_MULTIPLIERS, applyMultiplier, getMaxWeighted, isHidden } from '../src/multipliers.js';

describe('DIFFICULTY_MULTIPLIERS', () => {
  it('has correct multiplier values', () => {
    expect(DIFFICULTY_MULTIPLIERS.easy).toBe(1);
    expect(DIFFICULTY_MULTIPLIERS.medium).toBe(2);
    expect(DIFFICULTY_MULTIPLIERS.hard).toBe(3);
    expect(DIFFICULTY_MULTIPLIERS.difficult).toBe(5);
    expect(DIFFICULTY_MULTIPLIERS.hidden).toBe(5);
  });
});

describe('applyMultiplier', () => {
  it('applies easy multiplier (1x)', () => {
    expect(applyMultiplier(8, 'easy')).toBe(8);
  });

  it('applies medium multiplier (2x)', () => {
    expect(applyMultiplier(7, 'medium')).toBe(14);
  });

  it('applies hard multiplier (3x)', () => {
    expect(applyMultiplier(10, 'hard')).toBe(30);
  });

  it('applies difficult multiplier (5x)', () => {
    expect(applyMultiplier(6, 'difficult')).toBe(30);
  });

  it('applies hidden multiplier (5x)', () => {
    expect(applyMultiplier(10, 'hidden')).toBe(50);
  });

  it('handles zero base score', () => {
    expect(applyMultiplier(0, 'difficult')).toBe(0);
  });
});

describe('getMaxWeighted', () => {
  it('returns correct max per difficulty', () => {
    expect(getMaxWeighted('easy')).toBe(10);
    expect(getMaxWeighted('medium')).toBe(20);
    expect(getMaxWeighted('hard')).toBe(30);
    expect(getMaxWeighted('difficult')).toBe(50);
    expect(getMaxWeighted('hidden')).toBe(50);
  });
});

describe('isHidden', () => {
  it('returns true for hidden', () => {
    expect(isHidden('hidden')).toBe(true);
  });

  it('returns false for non-hidden', () => {
    expect(isHidden('easy')).toBe(false);
    expect(isHidden('medium')).toBe(false);
    expect(isHidden('hard')).toBe(false);
    expect(isHidden('difficult')).toBe(false);
  });
});
