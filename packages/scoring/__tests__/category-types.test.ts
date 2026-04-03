import { describe, it, expect } from 'vitest';
import {
  CATEGORY_TYPE_MAP,
  getPhaseCount,
  getCategoryMaxBase,
  getCategoryMaxBonus,
  getCategoryMaxTotal,
  getGrandMaxBase,
  getGrandMaxBonus,
  getGrandMaxTotal,
} from '../src/category-types.js';

describe('CATEGORY_TYPE_MAP', () => {
  it('has all 13 categories', () => {
    expect(Object.keys(CATEGORY_TYPE_MAP)).toHaveLength(13);
  });

  it('maps standard categories correctly', () => {
    expect(CATEGORY_TYPE_MAP[1]).toBe('standard');
    expect(CATEGORY_TYPE_MAP[3]).toBe('standard');
    expect(CATEGORY_TYPE_MAP[6]).toBe('standard');
    expect(CATEGORY_TYPE_MAP[9]).toBe('standard');
    expect(CATEGORY_TYPE_MAP[10]).toBe('standard');
  });

  it('maps 2-phase categories correctly', () => {
    expect(CATEGORY_TYPE_MAP[2]).toBe('2-phase');
    expect(CATEGORY_TYPE_MAP[4]).toBe('2-phase');
    expect(CATEGORY_TYPE_MAP[8]).toBe('2-phase');
    expect(CATEGORY_TYPE_MAP[12]).toBe('2-phase');
    expect(CATEGORY_TYPE_MAP[13]).toBe('2-phase');
  });

  it('maps 3-phase categories correctly', () => {
    expect(CATEGORY_TYPE_MAP[5]).toBe('3-phase');
    expect(CATEGORY_TYPE_MAP[7]).toBe('3-phase');
    expect(CATEGORY_TYPE_MAP[11]).toBe('3-phase');
  });
});

describe('phase counts', () => {
  it('standard = 1 phase', () => {
    expect(getPhaseCount('standard')).toBe(1);
  });
  it('2-phase = 2 phases', () => {
    expect(getPhaseCount('2-phase')).toBe(2);
  });
  it('3-phase = 3 phases', () => {
    expect(getPhaseCount('3-phase')).toBe(3);
  });
});

describe('category max scores', () => {
  it('standard: 110 base, 50 bonus, 160 total', () => {
    expect(getCategoryMaxBase('standard')).toBe(110);
    expect(getCategoryMaxBonus('standard')).toBe(50);
    expect(getCategoryMaxTotal('standard')).toBe(160);
  });

  it('2-phase: 220 base, 100 bonus, 320 total', () => {
    expect(getCategoryMaxBase('2-phase')).toBe(220);
    expect(getCategoryMaxBonus('2-phase')).toBe(100);
    expect(getCategoryMaxTotal('2-phase')).toBe(320);
  });

  it('3-phase: 330 base, 150 bonus, 480 total', () => {
    expect(getCategoryMaxBase('3-phase')).toBe(330);
    expect(getCategoryMaxBonus('3-phase')).toBe(150);
    expect(getCategoryMaxTotal('3-phase')).toBe(480);
  });
});

describe('grand total max scores', () => {
  // 5 standard (5*110=550) + 5 two-phase (5*220=1100) + 3 three-phase (3*330=990) = 2640 base
  it('grand max base = 2640', () => {
    expect(getGrandMaxBase()).toBe(2640);
  });

  // 5*50 + 5*100 + 3*150 = 250 + 500 + 450 = 1200 bonus
  it('grand max bonus = 1200', () => {
    expect(getGrandMaxBonus()).toBe(1200);
  });

  // 2640 + 1200 = 3840 total
  it('grand max total = 3840', () => {
    expect(getGrandMaxTotal()).toBe(3840);
  });
});
