import { RubricCriteriaScores, ReviewerScore } from '../types/grant';

export const RUBRIC_WEIGHTS = {
  marketPotential: 0.25,
  techFeasibility: 0.25,
  teamCapability: 0.20,
  financialSoundness: 0.20,
  ecosystemImpact: 0.10,
} as const;

export function calculateWeightedScore(scores: RubricCriteriaScores): number {
  const total =
    scores.marketPotential * RUBRIC_WEIGHTS.marketPotential * 10 +
    scores.techFeasibility * RUBRIC_WEIGHTS.techFeasibility * 10 +
    scores.teamCapability * RUBRIC_WEIGHTS.teamCapability * 10 +
    scores.financialSoundness * RUBRIC_WEIGHTS.financialSoundness * 10 +
    scores.ecosystemImpact * RUBRIC_WEIGHTS.ecosystemImpact * 10;
  return Math.round(total * 10) / 10;
}

export function calculateCompositeScore(
  r1?: ReviewerScore,
  r2?: ReviewerScore
): { score?: number; bothSubmitted: boolean } {
  if (r1 && r2) {
    const avg = (r1.totalWeightedScore + r2.totalWeightedScore) / 2;
    return { score: Math.round(avg * 10) / 10, bothSubmitted: true };
  }
  if (r1) return { score: r1.totalWeightedScore, bothSubmitted: false };
  if (r2) return { score: r2.totalWeightedScore, bothSubmitted: false };
  return { score: undefined, bothSubmitted: false };
}
