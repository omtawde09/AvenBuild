import type { ConversationId, MilestoneId, WorkspaceId } from '../ids';
import { addDays } from '../time';
import type { Tx } from '../tx';
import type { Milestone, Project, ProposedMilestone, Quote, Workspace } from '../types';
import { computeQuoteTotals } from '../quotes/math';

export const DEFAULT_MILESTONES: ReadonlyArray<ProposedMilestone> = [
  { title: 'Mobilisation & site preparation', sharePercent: 20 },
  { title: 'Main works', sharePercent: 60 },
  { title: 'Finishing & handover', sharePercent: 20 },
];

/** Creates the single shared workspace for an accepted quote. Caller has already verified none exists. */
export function createWorkspaceFromQuote(tx: Tx, project: Project, quote: Quote): WorkspaceId {
  const { ctx } = tx;
  const id = tx.id<WorkspaceId>('ws');
  const start = quote.content.startWindow.earliest < ctx.today ? ctx.today : quote.content.startWindow.earliest;
  const end = addDays(start, quote.content.durationDays);
  const workspace: Workspace = {
    id,
    projectId: project.id,
    ownerId: project.ownerId,
    contractorId: quote.contractorId,
    acceptedQuoteId: quote.id,
    acceptedQuoteRevision: quote.revision,
    acceptedContent: quote.content,
    agreement: [
      {
        revision: 1,
        totalPaise: computeQuoteTotals(quote.content).totalPaise,
        startDate: start,
        endDate: end,
        at: ctx.now,
        changeRequestId: null,
        note: `Accepted quote, revision ${quote.revision}`,
      },
    ],
    status: 'active',
    createdAt: ctx.now,
    completedAt: null,
    cancelledAt: null,
  };
  tx.put('workspaces', id, workspace);

  const plan = quote.content.proposedMilestones.length ? quote.content.proposedMilestones : DEFAULT_MILESTONES;
  let cumulative = 0;
  plan.forEach((m, i) => {
    cumulative += m.sharePercent;
    const mid = tx.id<MilestoneId>('ms');
    const milestone: Milestone = {
      id: mid,
      workspaceId: id,
      order: i + 1,
      title: m.title,
      description: '',
      targetDate: addDays(start, Math.max(1, Math.round((quote.content.durationDays * cumulative) / 100))),
      sharePercent: m.sharePercent,
      status: 'pending',
      evidenceNote: '',
      changeRequestNote: '',
      startedAt: null,
      submittedAt: null,
      approvedAt: null,
      updatedAt: ctx.now,
    };
    tx.put('milestones', mid, milestone);
  });

  const existing = Object.values(tx.s.conversations).find((c) => c.projectId === project.id && c.contractorId === quote.contractorId);
  if (existing) {
    tx.put('conversations', existing.id, { ...existing, kind: 'project', closedReason: null });
  } else {
    const cid = tx.id<ConversationId>('cnv');
    tx.put('conversations', cid, {
      id: cid,
      projectId: project.id,
      ownerId: project.ownerId,
      contractorId: quote.contractorId,
      kind: 'project',
      closedReason: null,
      lastReadAt: {},
      createdAt: ctx.now,
    });
  }
  tx.log({ projectId: project.id, workspaceId: id, type: 'workspace_created', summary: 'Shared workspace created from the accepted quote' });
  return id;
}
