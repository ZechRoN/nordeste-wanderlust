export type QualityRank = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';

export function normalizeQualityRank(rank: unknown): QualityRank {
  if (rank === 'C' || rank === 'B' || rank === 'A' || rank === 'S' || rank === 'SS') return rank;
  return 'D';
}

export function qualityMultiplier(rank: unknown): number {
  const r = normalizeQualityRank(rank);
  if (r === 'D') return 1.0;
  if (r === 'C') return 1.05;
  if (r === 'B') return 1.12;
  if (r === 'A') return 1.2;
  if (r === 'S') return 1.32;
  return 1.48;
}

export function applyQuality(value: number, rank: unknown): number {
  return Math.round(Number(value || 0) * qualityMultiplier(rank));
}

