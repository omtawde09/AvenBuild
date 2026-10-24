import type { Review } from '../types';

export interface ReviewAggregate {
  count: number;
  /** Mean rating rounded to one decimal; 0 when there are no reviews. */
  average: number;
  /** Count of reviews per star, index 0 = 1 star … index 4 = 5 stars. */
  breakdown: [number, number, number, number, number];
  dimensions: { communication: number | null; quality: number | null; scheduleClarity: number | null };
}

const mean = (values: number[]) => (values.length ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : null);

/** Aggregates are always recomputed from review records — never stored. */
export function aggregateReviews(reviews: ReadonlyArray<Review>): ReviewAggregate {
  const breakdown: ReviewAggregate['breakdown'] = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
    breakdown[idx] = (breakdown[idx] ?? 0) + 1;
  }
  const pick = (k: keyof Review['dimensions']) => reviews.map((r) => r.dimensions[k]).filter((v): v is number => v !== null);
  return {
    count: reviews.length,
    average: mean(reviews.map((r) => r.rating)) ?? 0,
    breakdown,
    dimensions: { communication: mean(pick('communication')), quality: mean(pick('quality')), scheduleClarity: mean(pick('scheduleClarity')) },
  };
}
