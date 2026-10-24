import { P, Q, U, W } from '@/data/seed/ids';
import { canProject, type ProjectAction } from '@/domain/projects/machine';
import { canQuote, type QuoteAction } from '@/domain/quotes/machine';
import { closeProject, createDraft, deleteDraft, pauseProject, publishProject, reopenProject, restoreDraft, updateDraft } from '@/domain/projects/commands';
import { acceptQuote, declineQuote, markQuoteViewed, requestRevision, saveQuoteDraft, startQuote, submitQuote, withdrawQuote } from '@/domain/quotes/commands';
import { canMilestone, completeProject, proposeChange, resolveChange, transitionMilestone } from '@/domain/workspace/commands';
import { currentAgreement, workspaceMilestones, workspaceProgress } from '@/domain/workspace/selectors';
import { effectiveQuoteStatus } from '@/domain/quotes/status';
import { PROJECT_STATUSES, QUOTE_STATUSES, type ProjectStatus, type QuoteStatus } from '@/domain/status';
import type { QuoteId } from '@/domain/ids';
import type { DemoState, QuoteContent } from '@/domain/types';
import { addDays } from '@/domain/time';
import { ctx, expectFail, expectOk, resetIds, seed, TEST_ANCHOR } from '../helpers';

beforeEach(() => resetIds());

describe('project state machine', () => {
  const expected: Record<ProjectAction, ProjectStatus[]> = {
    edit_draft: ['draft'],
    delete_draft: ['draft'],
    publish: ['draft'],
    edit_published: ['open', 'reviewing', 'paused'],
    pause: ['open', 'reviewing'],
    reopen: ['paused'],
    close: ['draft', 'open', 'reviewing', 'paused'],
    cancel: ['open', 'reviewing', 'paused', 'awarded', 'in_progress'],
    complete: ['awarded', 'in_progress'],
    accept_quotes: ['open', 'reviewing'],
  };
  it.each(Object.entries(expected))('%s is allowed only from the documented statuses', (action, allowed) => {
    for (const status of PROJECT_STATUSES) {
      expect(canProject({ status }, action as ProjectAction).ok).toBe(allowed.includes(status));
    }
  });
});

describe('quote state machine', () => {
  const expected: Record<QuoteAction, QuoteStatus[]> = {
    submit: ['draft'],
    revise: ['revision_requested', 'withdrawn'],
    resubmit: ['revision_requested', 'withdrawn'],
    withdraw: ['submitted', 'viewed', 'revision_requested'],
    request_revision: ['submitted', 'viewed'],
    accept: ['submitted', 'viewed'],
    decline: ['submitted', 'viewed', 'revision_requested'],
  };
  it.each(Object.entries(expected))('%s is allowed only from the documented statuses', (action, allowed) => {
    for (const status of QUOTE_STATUSES) expect(canQuote({ status }, action as QuoteAction).ok).toBe(allowed.includes(status));
  });
});

describe('milestone state machine', () => {
  it('enforces actor and status', () => {
    expect(canMilestone({ status: 'pending' }, 'start', 'contractor').ok).toBe(true);
    expect(canMilestone({ status: 'pending' }, 'start', 'owner').ok).toBe(false);
    expect(canMilestone({ status: 'submitted' }, 'approve', 'owner').ok).toBe(true);
    expect(canMilestone({ status: 'in_progress' }, 'approve', 'owner').ok).toBe(false);
    expect(canMilestone({ status: 'submitted' }, 'request_changes', 'contractor').ok).toBe(false);
    expect(canMilestone({ status: 'changes_requested' }, 'resume', 'contractor').ok).toBe(true);
    expect(canMilestone({ status: 'approved' }, 'resume', 'contractor').ok).toBe(false);
  });
});

function validDraft(): Parameters<typeof createDraft>[1] {
  return {
    category: 'waterproofing',
    title: 'Bathroom waterproofing in Kothrud flat',
    scope: 'Waterproof the floor and shower walls of a 6 × 8 ft bathroom before retiling. Existing tiles already removed by the owner.',
    scopeItems: ['Floor', 'Shower walls'],
    propertyType: 'apartment',
    location: { city: 'Pune', locality: 'Kothrud', landmark: '' },
    budget: { kind: 'range', minPaise: 3000000, maxPaise: 6000000 },
    startPreference: 'asap',
    siteVisit: { days: ['sat'], window: '10 am – 1 pm' },
    materialResponsibility: 'contractor',
  };
}

function validQuote(state: DemoState, quoteId: QuoteId): QuoteContent {
  const base = state.quotes[quoteId]!.content;
  return {
    ...base,
    lineItems: [{ id: base.lineItems[0]!.id, description: 'Cementitious coating, 2 coats', quantity: 120, unit: 'sq_ft', ratePaise: 9000 }],
    startWindow: { earliest: addDays(TEST_ANCHOR, 3), latest: addDays(TEST_ANCHOR, 10) },
    durationDays: 5,
    inclusions: ['Material and labour'],
    exclusions: ['Tiling'],
    validUntil: addDays(TEST_ANCHOR, 14),
  };
}

describe('owner → contractor lifecycle', () => {
  it('runs draft → publish → quote → revision → resubmit → accept with consistent side effects', () => {
    let s = seed();
    const owner = ctx(U.meera);
    const contractor = ctx(U.sahyadri);

    // Draft is private and not quotable.
    const created = expectOk(createDraft(s, validDraft(), 0, owner));
    s = created.state;
    const pid = created.value;
    expect(s.projects[pid]!.status).toBe('draft');
    expectFail(startQuote(s, pid, contractor), 'INVALID_TRANSITION');

    // Publishing notifies matching contractors.
    s = expectOk(publishProject(s, pid, owner)).state;
    expect(s.projects[pid]!.status).toBe('open');
    expect(Object.values(s.notifications).some((n) => n.recipientId === U.sahyadri && n.link === `/contractor/leads/${pid}`)).toBe(true);
    expect(Object.values(s.notifications).some((n) => n.recipientId === U.jal && n.link === `/contractor/leads/${pid}`)).toBe(false);

    // Contractor drafts and submits; invalid content is rejected with field errors.
    const started = expectOk(startQuote(s, pid, contractor));
    s = started.state;
    const qid = started.value;
    const bad = expectFail(submitQuote(s, qid, s.quotes[qid]!.content, contractor), 'VALIDATION');
    expect(bad.fieldErrors).toBeDefined();
    const content = validQuote(s, qid);
    s = expectOk(saveQuoteDraft(s, qid, content, contractor)).state;
    s = expectOk(submitQuote(s, qid, content, contractor)).state;
    expect(s.quotes[qid]!.status).toBe('submitted');
    expect(s.projects[pid]!.status).toBe('reviewing');
    expect(Object.values(s.notifications).some((n) => n.recipientId === U.meera && n.link === `/owner/projects/${pid}/quotes/${qid}`)).toBe(true);

    // Owner views and requests a revision; contractor's pending edits stay private until resubmitted.
    s = expectOk(markQuoteViewed(s, qid, owner)).state;
    expect(s.quotes[qid]!.status).toBe('viewed');
    expectFail(requestRevision(s, qid, 'short', owner), 'VALIDATION');
    s = expectOk(requestRevision(s, qid, 'Please add a 48-hour ponding test to the scope.', owner)).state;
    expect(s.quotes[qid]!.status).toBe('revision_requested');
    expectFail(acceptQuote(s, qid, owner), 'INVALID_TRANSITION');
    const revised = { ...content, inclusions: [...content.inclusions, '48-hour ponding test'] };
    s = expectOk(saveQuoteDraft(s, qid, revised, contractor)).state;
    expect(s.quotes[qid]!.content.inclusions).toHaveLength(1);
    expect(s.quotes[qid]!.pendingContent?.inclusions).toHaveLength(2);
    s = expectOk(submitQuote(s, qid, revised, contractor)).state;
    expect(s.quotes[qid]!.revision).toBe(2);
    expect(s.quotes[qid]!.history).toHaveLength(1);
    expect(s.quotes[qid]!.pendingContent).toBeNull();

    // Accept creates exactly one workspace; a second accept fails.
    const accepted = expectOk(acceptQuote(s, qid, owner));
    s = accepted.state;
    expect(s.projects[pid]!.status).toBe('awarded');
    const wss = Object.values(s.workspaces).filter((w) => w.projectId === pid);
    expect(wss).toHaveLength(1);
    expect(workspaceMilestones(s, wss[0]!.id).map((m) => m.sharePercent)).toEqual([20, 60, 20]);
    expectFail(acceptQuote(s, qid, owner));
    expect(Object.values(s.conversations).some((c) => c.projectId === pid && c.contractorId === U.sahyadri && c.kind === 'project')).toBe(true);
  });

  it('declines competing quotes when one is accepted', () => {
    let s = seed();
    const owner = ctx(U.meera);
    s = expectOk(acceptQuote(s, Q.terraceDeccan, owner)).state;
    expect(s.quotes[Q.terraceDeccan]!.status).toBe('accepted');
    expect(s.quotes[Q.terraceSahyadri]!.status).toBe('declined');
    expect(s.quotes[Q.terraceSahyadri]!.declineReason).toBe('awarded_elsewhere');
    expect(s.quotes[Q.terraceGanesh]!.declineReason).toBe('awarded_elsewhere');
    expect(s.conversations['cnv_seed_terrace_sahyadri']!.closedReason).toMatch(/another contractor/);
    expectFail(acceptQuote(s, Q.terraceSahyadri, owner));
  });

  it('blocks impossible transitions', () => {
    let s = seed();
    const owner = ctx(U.meera);
    const contractor = ctx(U.sahyadri);
    // Withdrawn quote can't be accepted.
    s = expectOk(withdrawQuote(s, Q.terraceSahyadri, contractor)).state;
    expectFail(acceptQuote(s, Q.terraceSahyadri, owner), 'INVALID_TRANSITION');
    // Paused project can't accept quotes; reopen restores reviewing.
    s = expectOk(pauseProject(s, P.terrace, owner)).state;
    expectFail(acceptQuote(s, Q.terraceDeccan, owner), 'INVALID_TRANSITION');
    s = expectOk(reopenProject(s, P.terrace, owner)).state;
    expect(s.projects[P.terrace]!.status).toBe('reviewing');
    // Closed project can't receive quotes.
    s = expectOk(closeProject(s, P.terrace, 'Going with a relative', owner)).state;
    expect(s.quotes[Q.terraceDeccan]!.declineReason).toBe('project_closed');
    expectFail(submitQuote(s, Q.terraceSahyadri, s.quotes[Q.terraceSahyadri]!.content, contractor), 'INVALID_TRANSITION');
    // Contractors can't act as owners and vice versa.
    expectFail(declineQuote(seed(), Q.terraceDeccan, '', contractor), 'FORBIDDEN');
    expectFail(withdrawQuote(seed(), Q.terraceDeccan, contractor), 'FORBIDDEN');
  });

  it('treats quotes past their validity date as expired and not acceptable', () => {
    const s = seed();
    const later = new Date(2026, 9, 20 + 40, 10);
    expect(effectiveQuoteStatus(s.quotes[Q.terraceDeccan]!, addDays(TEST_ANCHOR, 40))).toBe('expired');
    expectFail(acceptQuote(s, Q.terraceDeccan, ctx(U.meera, later)), 'INVALID_TRANSITION');
  });

  it('deletes a draft with undo', () => {
    let s = seed();
    const owner = ctx(U.meera);
    const removed = expectOk(deleteDraft(s, P.compound, owner));
    s = removed.state;
    expect(s.projects[P.compound]).toBeUndefined();
    s = expectOk(restoreDraft(s, removed.value, owner)).state;
    expect(s.projects[P.compound]).toEqual(seed().projects[P.compound]);
    expectFail(deleteDraft(s, P.terrace, owner), 'INVALID_TRANSITION');
  });

  it('keeps draft edits and blocks publishing an incomplete brief', () => {
    let s = seed();
    const owner = ctx(U.meera);
    s = expectOk(updateDraft(s, P.compound, { title: 'Compound wall with gate for Bavdhan plot' }, 3, owner)).state;
    expect(s.projects[P.compound]!.draftStep).toBe(3);
    const err = expectFail(publishProject(s, P.compound, owner), 'VALIDATION');
    expect(Object.keys(err.fieldErrors ?? {})).toEqual(expect.arrayContaining(['startPreference', 'materialResponsibility']));
  });
});

describe('workspace', () => {
  it('runs milestones through approval, changes and completion', () => {
    let s = seed();
    const owner = ctx(U.meera);
    const contractor = ctx(U.sahyadri);
    const [m1, m2, m3] = workspaceMilestones(s, W.bathroom);
    expect(m1!.status).toBe('approved');
    expect(workspaceProgress(workspaceMilestones(s, W.bathroom))).toBe(55); // 30 + 50/2

    expectFail(transitionMilestone(s, m2!.id, 'approve', '', contractor), 'INVALID_TRANSITION');
    expectFail(transitionMilestone(s, m2!.id, 'request_changes', 'short', owner), 'VALIDATION');
    s = expectOk(transitionMilestone(s, m2!.id, 'request_changes', 'Floor slope near the door holds water.', owner)).state;
    expect(s.milestones[m2!.id]!.status).toBe('changes_requested');
    s = expectOk(transitionMilestone(s, m2!.id, 'resume', '', contractor)).state;
    s = expectOk(transitionMilestone(s, m2!.id, 'submit', 'Relaid four tiles near the door; slope checked.', contractor)).state;
    s = expectOk(transitionMilestone(s, m2!.id, 'approve', '', owner)).state;

    expectFail(completeProject(s, W.bathroom, owner), 'INVALID_TRANSITION');
    s = expectOk(transitionMilestone(s, m3!.id, 'start', '', contractor)).state;
    s = expectOk(transitionMilestone(s, m3!.id, 'submit', 'Grouting and cleaning done, handed over keys.', contractor)).state;
    s = expectOk(transitionMilestone(s, m3!.id, 'approve', '', owner)).state;
    expect(workspaceProgress(workspaceMilestones(s, W.bathroom))).toBe(100);
    expectFail(completeProject(s, W.bathroom, contractor), 'FORBIDDEN');
    s = expectOk(completeProject(s, W.bathroom, owner)).state;
    expect(s.projects[P.bathroom]!.status).toBe('completed');
    expect(s.workspaces[W.bathroom]!.status).toBe('completed');
  });

  it('changes the agreement only through an accepted change request, keeping the original quote', () => {
    let s = seed();
    const owner = ctx(U.meera);
    const contractor = ctx(U.sahyadri);
    const before = currentAgreement(s.workspaces[W.bathroom]!);
    const original = s.workspaces[W.bathroom]!.acceptedContent;
    const proposed = expectOk(proposeChange(s, W.bathroom, { reason: 'Add a second exhaust fan opening', scopeNote: '', newTotalPaise: before.totalPaise + 250000, newEndDate: null }, contractor));
    s = proposed.state;
    expectFail(proposeChange(s, W.bathroom, { reason: 'Another change while one is open', scopeNote: 'x', newTotalPaise: null, newEndDate: null }, owner), 'CONFLICT');
    expectFail(resolveChange(s, proposed.value, 'accept', '', contractor), 'FORBIDDEN');
    s = expectOk(resolveChange(s, proposed.value, 'accept', '', owner)).state;
    const after = currentAgreement(s.workspaces[W.bathroom]!);
    expect(after.revision).toBe(before.revision + 1);
    expect(after.totalPaise).toBe(before.totalPaise + 250000);
    expect(s.workspaces[W.bathroom]!.acceptedContent).toBe(original);
    expect(Object.values(s.activity).some((a) => a.type === 'change_accepted' && a.summary.includes(`revision ${after.revision}`))).toBe(true);
  });
});

