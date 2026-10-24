import type { ActivityId, ChangeRequestId, ConversationId, DocumentId, MessageId, MilestoneId, NotificationId, ProjectId, SiteUpdateId, UserId } from '@/domain/ids';
import { computeQuoteTotals } from '@/domain/quotes/math';
import { rupees } from '@/domain/money';
import { links } from '@/domain/links';
import type { ActivityEvent, ActivityType, ChangeRequest, Conversation, Message, Milestone, Notification, NotificationCategory, Quote, SiteUpdate, Workspace, WorkspaceDocument } from '@/domain/types';
import { seedFile, seedImage, type SeedClock } from './builder';
import { C, P, Q, U, W } from './ids';

export interface CollabSeed {
  workspaces: Workspace[];
  milestones: Milestone[];
  siteUpdates: SiteUpdate[];
  documents: WorkspaceDocument[];
  changeRequests: ChangeRequest[];
  conversations: Conversation[];
  messages: Message[];
  notifications: Notification[];
  activity: ActivityEvent[];
}

export function seedCollab(t: SeedClock, quotes: Quote[]): CollabSeed {
  const quoteById = new Map(quotes.map((q) => [q.id, q]));
  const bathQuote = quoteById.get(Q.bathSahyadri);
  const plumbQuote = quoteById.get(Q.plumbingJal);
  if (!bathQuote || !plumbQuote) throw new Error('Seed quotes missing');
  const bathTotal = computeQuoteTotals(bathQuote.content).totalPaise;
  const plumbTotal = computeQuoteTotals(plumbQuote.content).totalPaise;
  const nicheCr = 'cr_seed_bath_niche' as ChangeRequestId;

  const workspaces: Workspace[] = [
    {
      id: W.bathroom,
      projectId: P.bathroom,
      ownerId: U.meera,
      contractorId: U.sahyadri,
      acceptedQuoteId: Q.bathSahyadri,
      acceptedQuoteRevision: 1,
      acceptedContent: bathQuote.content,
      agreement: [
        { revision: 1, totalPaise: bathTotal, startDate: t.day(-21), endDate: t.day(0), at: t.at(-22, '20:15'), changeRequestId: null, note: 'Accepted quote, revision 1' },
        { revision: 2, totalPaise: bathTotal + rupees(6500), startDate: t.day(-21), endDate: t.day(4), at: t.at(-12, '11:10'), changeRequestId: nicheCr, note: 'Add a recessed niche in the shower wall for toiletries' },
      ],
      status: 'active',
      createdAt: t.at(-22, '20:15'),
      completedAt: null,
      cancelledAt: null,
    },
    {
      id: W.plumbing,
      projectId: P.plumbing,
      ownerId: U.meera,
      contractorId: U.jal,
      acceptedQuoteId: Q.plumbingJal,
      acceptedQuoteRevision: 1,
      acceptedContent: plumbQuote.content,
      agreement: [{ revision: 1, totalPaise: plumbTotal, startDate: t.day(-45), endDate: t.day(-39), at: t.at(-48, '19:00'), changeRequestId: null, note: 'Accepted quote, revision 1' }],
      status: 'completed',
      createdAt: t.at(-48, '19:00'),
      completedAt: t.at(-30, '18:00'),
      cancelledAt: null,
    },
  ];

  const ms = (id: string, workspaceId: Milestone['workspaceId'], order: number, title: string, share: number, target: number, status: Milestone['status'], extra: Partial<Milestone> = {}): Milestone => ({
    id: id as MilestoneId,
    workspaceId,
    order,
    title,
    description: '',
    targetDate: t.day(target),
    sharePercent: share,
    status,
    evidenceNote: '',
    changeRequestNote: '',
    startedAt: null,
    submittedAt: null,
    approvedAt: null,
    updatedAt: t.at(-22, '20:15'),
    ...extra,
  });

  const milestones: Milestone[] = [
    ms('ms_seed_bath_1', W.bathroom, 1, 'Demolition & waterproofing', 30, -15, 'approved', {
      description: 'Strip tiles and screed, replace floor trap, waterproof floor and shower walls, 24-hour ponding test.',
      startedAt: t.at(-20, '09:00'),
      submittedAt: t.at(-15, '18:00'),
      approvedAt: t.at(-14, '10:30'),
      evidenceNote: 'Ponding test held for 24 hours with no drop in level. Photos in Documents.',
      updatedAt: t.at(-14, '10:30'),
    }),
    ms('ms_seed_bath_2', W.bathroom, 2, 'Tiling & sanitary fixtures', 50, -4, 'submitted', {
      description: 'Floor and wall tiling to 7 ft, recessed niche, fixing of owner-supplied sanitary ware.',
      startedAt: t.at(-13, '09:00'),
      submittedAt: t.at(-1, '17:00'),
      evidenceNote: 'All wall and floor tiles laid, niche finished with edge trim, WC and basin fixed. Please check the slope towards the trap.',
      updatedAt: t.at(-1, '17:00'),
    }),
    ms('ms_seed_bath_3', W.bathroom, 3, 'Grouting, cleaning & handover', 20, 4, 'pending', { description: 'Epoxy grouting, acid wash, silicone joints and final cleaning.' }),
    ms('ms_seed_plumb_1', W.plumbing, 1, 'Chasing and new lines', 60, -42, 'approved', { startedAt: t.at(-45, '09:00'), submittedAt: t.at(-42, '18:00'), approvedAt: t.at(-41, '10:00'), evidenceNote: 'All CPVC lines laid and pressure-tested at 10 bar for 2 hours.', updatedAt: t.at(-41, '10:00') }),
    ms('ms_seed_plumb_2', W.plumbing, 2, 'Fixtures, testing and patching', 40, -39, 'approved', { startedAt: t.at(-40, '09:00'), submittedAt: t.at(-33, '17:00'), approvedAt: t.at(-31, '09:30'), evidenceNote: 'Dishwasher inlet and drain fitted; walls patched and ready for paint.', updatedAt: t.at(-31, '09:30') }),
  ];

  const su = (id: string, workspaceId: SiteUpdate['workspaceId'], authorId: UserId, day: number, notes: string, progress: number, art: string[] = []): SiteUpdate => ({
    id: id as SiteUpdateId,
    workspaceId,
    authorId,
    date: t.day(day),
    notes,
    progressPercent: progress,
    attachments: art.map((a, i) => seedImage(`att_${id}_${i + 1}`, `site-${a}-${i + 1}.jpg`, a, t.at(day, '18:30'))),
    createdAt: t.at(day, '18:30'),
  });
  const siteUpdates: SiteUpdate[] = [
    su('su_seed_bath_1', W.bathroom, U.sahyadri, -18, 'Old tiles and screed removed down to the slab. Floor trap replaced. Primer coat of waterproofing applied on floor and walls.', 20, ['bathroom']),
    su('su_seed_bath_2', W.bathroom, U.sahyadri, -12, 'Waterproofing complete and the 24-hour ponding test passed. Wall tiling started from the shower side. Niche opening marked as agreed.', 45, ['tiles']),
    su('su_seed_bath_3', W.bathroom, U.sahyadri, -1, 'All tiling done including the niche. WC and basin fixed. Grouting scheduled after the owner checks the floor slope.', 80, ['bathroom', 'tiles']),
    su('su_seed_plumb_1', W.plumbing, U.jal, -43, 'Old GI lines removed and wall chases cut. New CPVC lines being laid.', 50),
  ];

  const doc = (id: string, workspaceId: WorkspaceDocument['workspaceId'], addedBy: UserId, file: WorkspaceDocument['file']): WorkspaceDocument => ({ id: id as DocumentId, workspaceId, addedBy, file });
  const documents: WorkspaceDocument[] = [
    doc('doc_seed_bath_1', W.bathroom, U.meera, seedFile('att_doc_bath_1', 'bathroom-layout-sketch.pdf', 'application/pdf', 512_000, t.at(-22, '21:00'))),
    doc('doc_seed_bath_2', W.bathroom, U.sahyadri, seedFile('att_doc_bath_2', 'tile-layout-elevations.pdf', 'application/pdf', 1_830_000, t.at(-19, '19:15'))),
    doc('doc_seed_bath_3', W.bathroom, U.sahyadri, seedImage('att_doc_bath_3', 'ponding-test-24h.jpg', 'bathroom', t.at(-13, '18:00'))),
    doc('doc_seed_plumb_1', W.plumbing, U.jal, seedFile('att_doc_plumb_1', 'pressure-test-record.pdf', 'application/pdf', 220_000, t.at(-42, '18:10'))),
  ];

  const changeRequests: ChangeRequest[] = [
    {
      id: nicheCr,
      workspaceId: W.bathroom,
      proposedBy: U.meera,
      kinds: ['scope', 'date', 'price'],
      reason: 'Add a recessed niche in the shower wall for toiletries',
      scopeNote: 'Recessed niche 12 × 24 in with metal edge trim, waterproofed like the shower wall.',
      newTotalPaise: bathTotal + rupees(6500),
      newEndDate: t.day(4),
      status: 'accepted',
      responseNote: 'Can do. It adds about four days for the extra cutting and curing.',
      createdAt: t.at(-13, '20:30'),
      resolvedAt: t.at(-12, '11:10'),
    },
  ];

  const conv = (id: ConversationId, projectId: ProjectId, contractorId: UserId, ownerId: UserId, kind: Conversation['kind'], created: string, reads: Partial<Record<UserId, string>>, closedReason: string | null = null): Conversation => ({
    id,
    projectId,
    ownerId,
    contractorId,
    kind,
    closedReason,
    lastReadAt: reads,
    createdAt: created,
  });
  const conversations: Conversation[] = [
    conv(C.terraceSahyadri, P.terrace, U.sahyadri, U.meera, 'enquiry', t.at(-8, '11:05'), { [U.meera]: t.at(-6, '20:00'), [U.sahyadri]: t.at(-6, '16:20') }),
    conv(C.terraceGanesh, P.terrace, U.ganesh, U.meera, 'enquiry', t.at(-2, '19:45'), { [U.meera]: t.at(-2, '21:00'), [U.ganesh]: t.at(-2, '20:10') }),
    conv(C.bathroom, P.bathroom, U.sahyadri, U.meera, 'project', t.at(-27, '09:00'), { [U.meera]: t.at(-3, '21:00'), [U.sahyadri]: t.at(-1, '17:20') }),
    conv(C.plumbing, P.plumbing, U.jal, U.meera, 'project', t.at(-70, '10:00'), { [U.meera]: t.at(-30, '18:30'), [U.jal]: t.at(-30, '18:00') }),
    conv(C.staircase, P.staircase, U.sahyadri, U.farah, 'enquiry', t.at(-11, '10:00'), { [U.farah]: t.at(-9, '12:00'), [U.sahyadri]: t.at(-4, '19:00') }),
    conv(C.garden, P.garden, U.sahyadri, U.farah, 'enquiry', t.at(-1, '09:35'), { [U.farah]: t.at(-1, '09:35') }),
  ];

  let m = 0;
  const msg = (conversationId: ConversationId, senderId: UserId, day: number, hhmm: string, body: string): Message => ({
    id: `msg_seed_${String(++m).padStart(3, '0')}` as MessageId,
    conversationId,
    senderId,
    body,
    sentAt: t.at(day, hhmm),
  });
  const messages: Message[] = [
    msg(C.terraceSahyadri, U.sahyadri, -8, '11:05', 'Namaste, we’d like to inspect the terrace before quoting so we can check the slope and parapet junctions. Would Saturday at 10:30 work?'),
    msg(C.terraceSahyadri, U.meera, -8, '18:40', 'Saturday works. The watchman will open the terrace door. Please also look at the cracks near the water-tank base.'),
    msg(C.terraceSahyadri, U.sahyadri, -6, '16:20', 'Thank you, inspection done. Quote submitted. It includes a 48-hour pond test; the tank-base cracks are covered under surface preparation.'),
    msg(C.terraceGanesh, U.meera, -2, '19:45', 'Thanks for the quote. I’ve requested a revision with a membrane option — the old coba is what failed.'),
    msg(C.terraceGanesh, U.ganesh, -2, '20:10', 'Understood. We will send a revised quote after checking membrane rates with our supplier.'),
    msg(C.bathroom, U.meera, -27, '09:00', 'Hi, can you visit this week to measure the bathroom?'),
    msg(C.bathroom, U.sahyadri, -27, '12:15', 'Yes, Wednesday 5:30 pm. We’ll bring tile samples for the adhesive check.'),
    msg(C.bathroom, U.sahyadri, -19, '19:20', 'Uploaded the tile layout elevations to Documents. Please confirm the niche height before we tile that wall.'),
    msg(C.bathroom, U.meera, -13, '20:25', 'Niche at 4 ft from floor please. I’ve raised a change request for it.'),
    msg(C.bathroom, U.sahyadri, -4, '18:00', 'Tiles for the last wall arrived today, so we’re back on schedule.'),
    msg(C.bathroom, U.sahyadri, -1, '17:20', 'Tiling and fixtures are complete. I’ve submitted milestone 2 for your approval — please check the floor slope with a bucket of water before approving.'),
    msg(C.plumbing, U.jal, -42, '18:15', 'Pressure test passed. Record uploaded.'),
    msg(C.plumbing, U.meera, -30, '18:20', 'All good, thank you. Marking the project complete.'),
    msg(C.staircase, U.sahyadri, -11, '10:00', 'Could you share the structural drawing for the staircase? We’ll quote exactly to it.'),
    msg(C.staircase, U.farah, -9, '12:00', 'Shared with the brief now — see the scope. Thanks.'),
    msg(C.garden, U.farah, -1, '09:35', 'Hello! I saw your terrace work listed for Baner. Would you be able to quote for our terrace garden waterproofing?'),
  ];

  let n = 0;
  const ntf = (recipientId: UserId, category: NotificationCategory, title: string, body: string, link: string, day: number, hhmm: string, read: boolean): Notification => ({
    id: `ntf_seed_${String(++n).padStart(3, '0')}` as NotificationId,
    recipientId,
    category,
    title,
    body,
    link,
    createdAt: t.at(day, hhmm),
    readAt: read ? t.at(day, '23:00') : null,
    muted: false,
  });
  const notifications: Notification[] = [
    ntf(U.meera, 'quote', 'New quote received', 'Sahyadri Waterproofing & Civil Works for “Terrace waterproofing for a 1,150 sq ft bungalow roof”', links.ownerQuote(P.terrace, Q.terraceSahyadri), -6, '16:05', true),
    ntf(U.meera, 'quote', 'New quote received', 'Deccan Seal Systems for “Terrace waterproofing for a 1,150 sq ft bungalow roof”', links.ownerQuote(P.terrace, Q.terraceDeccan), -3, '12:30', false),
    ntf(U.meera, 'milestone', 'New site update', 'All tiling done including the niche. WC and basin fixed.', links.workspace(W.bathroom, 'updates'), -1, '18:30', true),
    ntf(U.meera, 'milestone', 'Milestone awaiting your approval', '“Tiling & sanitary fixtures” on “Master bathroom retiling with waterproofing”', links.workspace(W.bathroom, 'milestones'), -1, '17:00', false),
    ntf(U.meera, 'message', 'New message from Sahyadri Waterproofing & Civil Works', 'Master bathroom retiling with waterproofing: Tiling and fixtures are complete…', links.conversation(C.bathroom), -1, '17:20', false),
    ntf(U.meera, 'review', 'How did Jal Plumbing Services do?', '“Kitchen and utility replumbing” is complete. Leave a review to help other owners.', links.workspace(W.plumbing, 'review'), -30, '18:05', false),
    ntf(U.sahyadri, 'change', 'Change request accepted', 'You accepted: Add a recessed niche in the shower wall', links.workspace(W.bathroom, 'changes'), -12, '11:10', true),
    ntf(U.sahyadri, 'milestone', 'Milestone approved', '“Demolition & waterproofing” on “Master bathroom retiling with waterproofing” was approved.', links.workspace(W.bathroom, 'milestones'), -14, '10:30', true),
    ntf(U.sahyadri, 'project', 'New matching lead', 'Basement seepage treatment in a row house · Waterproofing in Wakad, Pimpri-Chinchwad', links.lead(P.basement), -10, '12:20', true),
    ntf(U.sahyadri, 'quote', 'Quote declined', 'The owner declined your quote for “RCC staircase to the terrace”.', links.contractorQuote(Q.staircaseSahyadri), -4, '18:20', true),
    ntf(U.sahyadri, 'project', 'Invitation to quote', 'You were invited to quote on “Terrace garden waterproofing before planting”.', links.lead(P.garden), -1, '09:30', false),
    ntf(U.sahyadri, 'message', 'New message from Farah Shaikh', 'Terrace garden waterproofing before planting: Hello! I saw your terrace work…', links.conversation(C.garden), -1, '09:35', false),
  ];

  let a = 0;
  const act = (projectId: ProjectId, workspaceId: Workspace['id'] | null, type: ActivityType, actorId: UserId, day: number, hhmm: string, summary: string): ActivityEvent => ({
    id: `act_seed_${String(++a).padStart(3, '0')}` as ActivityId,
    projectId,
    workspaceId,
    type,
    actorId,
    at: t.at(day, hhmm),
    summary,
  });
  const activity: ActivityEvent[] = [
    act(P.terrace, null, 'project_published', U.meera, -9, '10:15', 'Project published: Terrace waterproofing for a 1,150 sq ft bungalow roof'),
    act(P.terrace, null, 'quote_submitted', U.ganesh, -7, '18:00', 'Shree Ganesh Constructions submitted a quote'),
    act(P.terrace, null, 'quote_submitted', U.sahyadri, -6, '16:05', 'Sahyadri Waterproofing & Civil Works submitted a quote'),
    act(P.terrace, null, 'quote_submitted', U.deccan, -3, '12:30', 'Deccan Seal Systems submitted a quote'),
    act(P.bathroom, null, 'project_published', U.meera, -30, '09:00', 'Project published: Master bathroom retiling with waterproofing'),
    act(P.bathroom, null, 'quote_submitted', U.ganesh, -25, '17:00', 'Shree Ganesh Constructions submitted a quote'),
    act(P.bathroom, null, 'quote_submitted', U.sahyadri, -26, '18:30', 'Sahyadri Waterproofing & Civil Works submitted a quote'),
    act(P.bathroom, W.bathroom, 'quote_accepted', U.meera, -22, '20:15', 'Quote from Sahyadri Waterproofing & Civil Works accepted (revision 1)'),
    act(P.bathroom, W.bathroom, 'workspace_created', U.meera, -22, '20:15', 'Shared workspace created from the accepted quote'),
    act(P.bathroom, W.bathroom, 'milestone_started', U.sahyadri, -20, '09:00', 'Milestone started: Demolition & waterproofing'),
    act(P.bathroom, W.bathroom, 'site_update_posted', U.sahyadri, -18, '18:30', 'Site update (20% reported)'),
    act(P.bathroom, W.bathroom, 'milestone_submitted', U.sahyadri, -15, '18:00', 'Milestone submitted for approval: Demolition & waterproofing'),
    act(P.bathroom, W.bathroom, 'milestone_approved', U.meera, -14, '10:30', 'Milestone approved: Demolition & waterproofing'),
    act(P.bathroom, W.bathroom, 'change_proposed', U.meera, -13, '20:30', 'Change proposed (scope, date, price): Add a recessed niche in the shower wall for toiletries'),
    act(P.bathroom, W.bathroom, 'milestone_started', U.sahyadri, -13, '09:00', 'Milestone started: Tiling & sanitary fixtures'),
    act(P.bathroom, W.bathroom, 'change_accepted', U.sahyadri, -12, '11:10', 'Agreement revision 2: total +₹6,500; end date moved by 4 days; scope updated'),
    act(P.bathroom, W.bathroom, 'site_update_posted', U.sahyadri, -12, '18:30', 'Site update (45% reported)'),
    act(P.bathroom, W.bathroom, 'site_update_posted', U.sahyadri, -1, '18:30', 'Site update (80% reported)'),
    act(P.bathroom, W.bathroom, 'milestone_submitted', U.sahyadri, -1, '17:00', 'Milestone submitted for approval: Tiling & sanitary fixtures'),
    act(P.plumbing, W.plumbing, 'quote_accepted', U.meera, -48, '19:00', 'Quote from Jal Plumbing Services accepted (revision 1)'),
    act(P.plumbing, W.plumbing, 'milestone_approved', U.meera, -41, '10:00', 'Milestone approved: Chasing and new lines'),
    act(P.plumbing, W.plumbing, 'milestone_approved', U.meera, -31, '09:30', 'Milestone approved: Fixtures, testing and patching'),
    act(P.plumbing, W.plumbing, 'project_completed', U.meera, -30, '18:00', 'Project marked complete by the owner'),
  ];

  return { workspaces, milestones, siteUpdates, documents, changeRequests, conversations, messages, notifications, activity };
}
