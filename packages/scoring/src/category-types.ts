import type { CategoryType } from './types.js';

// Per phase: easy(10) + medium(20) + hard(30) + difficult(50) = 110 base, hidden = 50 bonus
const BASE_PER_PHASE = 110;
const BONUS_PER_PHASE = 50;

const PHASE_COUNTS: Record<CategoryType, number> = {
  'standard': 1,
  '2-phase': 2,
  '3-phase': 3,
};

// Standard categories (1 phase): 1, 3, 6, 9, 10, 14
// 2-phase categories: 2, 4, 8, 12, 13
// 3-phase categories: 5, 7, 11

export const CATEGORY_TYPE_MAP: Record<number, CategoryType> = {
  1: 'standard',
  2: '2-phase',
  3: 'standard',
  4: '2-phase',
  5: '3-phase',
  6: 'standard',
  7: '3-phase',
  8: '2-phase',
  9: 'standard',
  10: 'standard',
  11: '3-phase',
  12: '2-phase',
  13: '2-phase',
  14: 'standard',
};

export function getPhaseCount(type: CategoryType): number {
  return PHASE_COUNTS[type];
}

export function getCategoryMaxBase(type: CategoryType): number {
  return BASE_PER_PHASE * PHASE_COUNTS[type];
}

export function getCategoryMaxBonus(type: CategoryType): number {
  return BONUS_PER_PHASE * PHASE_COUNTS[type];
}

export function getCategoryMaxTotal(type: CategoryType): number {
  return getCategoryMaxBase(type) + getCategoryMaxBonus(type);
}

export function getGrandMaxBase(): number {
  return Object.values(CATEGORY_TYPE_MAP).reduce(
    (sum, type) => sum + getCategoryMaxBase(type),
    0,
  );
}

export function getGrandMaxBonus(): number {
  return Object.values(CATEGORY_TYPE_MAP).reduce(
    (sum, type) => sum + getCategoryMaxBonus(type),
    0,
  );
}

export function getGrandMaxTotal(): number {
  return getGrandMaxBase() + getGrandMaxBonus();
}
