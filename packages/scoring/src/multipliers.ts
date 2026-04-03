import type { Difficulty } from './types.js';

export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  difficult: 5,
  hidden: 5,
};

export const MAX_BASE_SCORE = 10;

export function applyMultiplier(baseScore: number, difficulty: Difficulty): number {
  return baseScore * DIFFICULTY_MULTIPLIERS[difficulty];
}

export function getMaxWeighted(difficulty: Difficulty): number {
  return MAX_BASE_SCORE * DIFFICULTY_MULTIPLIERS[difficulty];
}

export function isHidden(difficulty: Difficulty): boolean {
  return difficulty === 'hidden';
}
