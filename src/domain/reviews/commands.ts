import type { ReviewId, WorkspaceId } from '../ids';
import { links } from '../links';
import { fail } from '../result';
import { forbidden, invalid, notFound, Tx, type CommandContext, type CommandResult } from '../tx';
import type { DemoState, Review } from '../types';

export interface ReviewInput {
  rating: number;
  communication: number | null;
  quality: number | null;
  scheduleClarity: number | null;
  text: string;
}

export type ReviewEligibility = { ok: true } | { ok: false; reason: string; existing?: Review };

/** Owner of a completed project may review its contractor exactly once. */
export function reviewEligibility(state: DemoState, workspaceId: string, actorId: string): ReviewEligibility {
  const ws = state.workspaces[workspaceId];
  if (!ws) return { ok: false, reason: 'Workspace not found.' };
  if (actorId !== ws.ownerId) return { ok: false, reason: 'Only the property owner can review the contractor.' };
  const existing = Object.values(state.reviews).find((r) => r.projectId === ws.projectId);
  if (existing) return { ok: false, reason: 'You’ve already reviewed this project.', existing };
  if (ws.status !== 'completed') return { ok: false, reason: 'Reviews open once the project is marked complete.' };
  return { ok: true };
}

const score = (v: number | null) => v === null || (Number.isInteger(v) && v >= 1 && v <= 5);

export function submitReview(state: DemoState, workspaceId: WorkspaceId, input: ReviewInput, ctx: CommandContext): CommandResult<ReviewId> {
  const ws = state.workspaces[workspaceId];
  if (!ws) return notFound('workspace');
  if (ctx.actorId !== ws.ownerId) return forbidden('Only the property owner can review the contractor.');
  const eligibility = reviewEligibility(state, workspaceId, ctx.actorId);
  if (!eligibility.ok) return eligibility.existing ? fail('CONFLICT', eligibility.reason) : invalid(eligibility.reason);
  const errors: Record<string, string> = {};
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) errors.rating = 'Choose an overall rating from 1 to 5.';
  if (!score(input.communication)) errors.communication = 'Choose 1–5 or leave blank.';
  if (!score(input.quality)) errors.quality = 'Choose 1–5 or leave blank.';
  if (!score(input.scheduleClarity)) errors.scheduleClarity = 'Choose 1–5 or leave blank.';
  const text = input.text.trim();
  if (text.length < 20 || text.length > 1500) errors.text = 'Write 20–1500 characters about your experience.';
  if (Object.keys(errors).length) return fail('VALIDATION', 'Check your review.', errors);

  const project = state.projects[ws.projectId];
  const owner = state.users[ws.ownerId];
  const tx = new Tx(state, ctx);
  const id = tx.id<ReviewId>('rev');
  tx.put('reviews', id, {
    id,
    contractorId: ws.contractorId,
    projectId: ws.projectId,
    workspaceId,
    ownerId: ws.ownerId,
    reviewerLabel: owner ? `${owner.displayName.split(' ')[0]}, ${owner.locality || owner.city}` : 'Property owner',
    projectTitle: project?.title ?? 'Project',
    rating: input.rating,
    dimensions: { communication: input.communication, quality: input.quality, scheduleClarity: input.scheduleClarity },
    text,
    createdAt: ctx.now,
    isSeed: false,
  });
  tx.log({ projectId: ws.projectId, workspaceId, type: 'review_submitted', summary: `Owner left a ${input.rating}-star review` });
  tx.notify({ recipientId: ws.contractorId, category: 'review', title: 'New review', body: `${input.rating}/5 for “${project?.title ?? 'a project'}”`, link: links.contractorProfileReviews() });
  return tx.done(id);
}
