import { z } from 'zod';
import { SERVICE_CATEGORY_IDS } from '@/data/categories';
import {
  CHANGE_REQUEST_STATUSES,
  MILESTONE_STATUSES,
  PROJECT_STATUSES,
  QUOTE_STATUSES,
  WORKSPACE_STATUSES,
} from '@/domain/status';
import { ROLES } from '@/domain/roles';
import {
  MATERIAL_RESPONSIBILITY,
  NOTIFICATION_CATEGORIES,
  PROPERTY_TYPES,
  SCHEMA_VERSION,
  START_PREFERENCES,
  UNITS,
  WEEKDAYS,
  type DemoState,
} from '@/domain/types';
import type * as Ids from '@/domain/ids';

/**
 * Schema for persisted demo state. Stored data is untrusted: it is validated with this schema
 * (plus referential checks) before the app uses it.
 */
const id = <T extends string>() => z.custom<T>((v) => typeof v === 'string' && v.length > 0 && v.length < 200, 'Invalid id');
const str = z.string().max(5000);
const iso = z.string().max(40);
const nullableIso = iso.nullable();
const paise = z.number().int().nonnegative();
const prefs = z.object(Object.fromEntries(NOTIFICATION_CATEGORIES.map((c) => [c, z.boolean()])) as Record<(typeof NOTIFICATION_CATEGORIES)[number], z.ZodBoolean>);
const verification = z.enum(['sample_demo', 'not_submitted', 'pending_demo']);
const category = z.enum(SERVICE_CATEGORY_IDS);

const attachment = z.object({
  id: id<Ids.AttachmentId>(),
  name: str,
  mimeType: str,
  sizeBytes: z.number().int().nonnegative(),
  addedAt: iso,
  previewKind: z.enum(['session', 'seed', 'none']),
  seedArt: z.string().optional(),
});

const user = z.object({
  id: id<Ids.UserId>(),
  role: z.enum(ROLES),
  displayName: str,
  city: str,
  locality: str,
  isPersona: z.boolean(),
  isSeed: z.boolean(),
  createdAt: iso,
});

const ownerSettings = z.object({ userId: id<Ids.UserId>(), contactPreference: z.enum(['messages_only', 'messages_and_site_visits']), notificationPrefs: prefs });

const contractorProfile = z.object({
  userId: id<Ids.UserId>(),
  businessName: str,
  contactName: str,
  bio: str,
  services: z.array(category),
  serviceAreas: z.array(z.object({ city: str, localities: z.array(str) })),
  yearsExperience: z.number().int().nonnegative(),
  teamSize: z.number().int().nonnegative(),
  availability: z.object({ status: z.enum(['available', 'limited', 'unavailable']), availableFrom: iso }),
  typicalProjectRange: z.object({ minPaise: paise, maxPaise: paise }),
  contactPreferences: z.object({ siteVisits: z.boolean(), preferredHours: str }),
  qualifications: z.object({ licenceNumber: str, licenceStatus: verification, gstNumber: str, gstStatus: verification }),
  responseTimeSampleHours: z.number().nonnegative().nullable(),
  visibility: z.enum(['listed', 'hidden']),
  quoteDefaults: z.object({ validityDays: z.number().int(), taxPercent: z.number(), inclusions: z.array(str), exclusions: z.array(str) }),
  notificationPrefs: prefs,
  isSeed: z.boolean(),
  updatedAt: iso,
});

const portfolioItem = z.object({
  id: id<Ids.PortfolioItemId>(),
  contractorId: id<Ids.UserId>(),
  title: str,
  category,
  description: str,
  approxValue: z.object({ minPaise: paise, maxPaise: paise }).nullable(),
  completedOn: iso,
  city: str,
  images: z.array(attachment),
  isSeed: z.boolean(),
});

const review = z.object({
  id: id<Ids.ReviewId>(),
  contractorId: id<Ids.UserId>(),
  projectId: id<Ids.ProjectId>().nullable(),
  workspaceId: id<Ids.WorkspaceId>().nullable(),
  ownerId: id<Ids.UserId>().nullable(),
  reviewerLabel: str,
  projectTitle: str,
  rating: z.number().min(1).max(5),
  dimensions: z.object({ communication: z.number().nullable(), quality: z.number().nullable(), scheduleClarity: z.number().nullable() }),
  text: str,
  createdAt: iso,
  isSeed: z.boolean(),
});

const project = z.object({
  id: id<Ids.ProjectId>(),
  ownerId: id<Ids.UserId>(),
  status: z.enum(PROJECT_STATUSES),
  category: category.nullable(),
  title: str,
  scope: str,
  scopeItems: z.array(str),
  propertyType: z.enum(PROPERTY_TYPES).nullable(),
  location: z.object({ city: str, locality: str, landmark: str }),
  budget: z.discriminatedUnion('kind', [z.object({ kind: z.literal('range'), minPaise: paise, maxPaise: paise }), z.object({ kind: z.literal('undisclosed') })]),
  startPreference: z.enum(START_PREFERENCES).nullable(),
  targetStartDate: nullableIso,
  durationEstimate: z.object({ value: z.number().int(), unit: z.enum(['days', 'weeks']) }).nullable(),
  siteVisit: z.object({ days: z.array(z.enum(WEEKDAYS)), window: str }),
  materialResponsibility: z.enum(MATERIAL_RESPONSIBILITY).nullable(),
  attachments: z.array(attachment),
  accessNotes: str,
  createdAt: iso,
  updatedAt: iso,
  publishedAt: nullableIso,
  pausedFromStatus: z.enum(['open', 'reviewing']).nullable(),
  closedReason: str.nullable(),
  closedAt: nullableIso,
  draftStep: z.number().int().nonnegative(),
  isSeed: z.boolean(),
});

const lineItem = z.object({ id: id<Ids.LineItemId>(), description: str, quantity: z.number(), unit: z.enum(UNITS), ratePaise: z.number().int() });
const quoteContent = z.object({
  lineItems: z.array(lineItem),
  discount: z.discriminatedUnion('kind', [z.object({ kind: z.literal('none') }), z.object({ kind: z.literal('percent'), percent: z.number() }), z.object({ kind: z.literal('flat'), paise: z.number().int() })]),
  taxPercent: z.number(),
  startWindow: z.object({ earliest: iso, latest: iso }),
  durationDays: z.number().int(),
  proposedMilestones: z.array(z.object({ title: str, sharePercent: z.number().int() })),
  inclusions: z.array(str),
  exclusions: z.array(str),
  assumptions: z.array(str),
  validUntil: iso,
  note: str,
});

const quote = z.object({
  id: id<Ids.QuoteId>(),
  projectId: id<Ids.ProjectId>(),
  contractorId: id<Ids.UserId>(),
  status: z.enum(QUOTE_STATUSES),
  revision: z.number().int().positive(),
  content: quoteContent,
  pendingContent: quoteContent.nullable(),
  history: z.array(z.object({ revision: z.number().int(), content: quoteContent, submittedAt: iso })),
  revisionRequest: z.object({ message: str, at: iso }).nullable(),
  declineReason: z.enum(['owner', 'awarded_elsewhere', 'project_closed']).nullable(),
  declineNote: str,
  createdAt: iso,
  updatedAt: iso,
  submittedAt: nullableIso,
  viewedAt: nullableIso,
  decidedAt: nullableIso,
  withdrawnAt: nullableIso,
  isSeed: z.boolean(),
});

const workspace = z.object({
  id: id<Ids.WorkspaceId>(),
  projectId: id<Ids.ProjectId>(),
  ownerId: id<Ids.UserId>(),
  contractorId: id<Ids.UserId>(),
  acceptedQuoteId: id<Ids.QuoteId>(),
  acceptedQuoteRevision: z.number().int(),
  acceptedContent: quoteContent,
  agreement: z
    .array(z.object({ revision: z.number().int(), totalPaise: paise, startDate: iso, endDate: iso, at: iso, changeRequestId: id<Ids.ChangeRequestId>().nullable(), note: str }))
    .min(1),
  status: z.enum(WORKSPACE_STATUSES),
  createdAt: iso,
  completedAt: nullableIso,
  cancelledAt: nullableIso,
});

const milestone = z.object({
  id: id<Ids.MilestoneId>(),
  workspaceId: id<Ids.WorkspaceId>(),
  order: z.number().int(),
  title: str,
  description: str,
  targetDate: iso,
  sharePercent: z.number().int(),
  status: z.enum(MILESTONE_STATUSES),
  evidenceNote: str,
  changeRequestNote: str,
  startedAt: nullableIso,
  submittedAt: nullableIso,
  approvedAt: nullableIso,
  updatedAt: iso,
});

const siteUpdate = z.object({
  id: id<Ids.SiteUpdateId>(),
  workspaceId: id<Ids.WorkspaceId>(),
  authorId: id<Ids.UserId>(),
  date: iso,
  notes: str,
  progressPercent: z.number().int().min(0).max(100),
  attachments: z.array(attachment),
  createdAt: iso,
});

const document = z.object({ id: id<Ids.DocumentId>(), workspaceId: id<Ids.WorkspaceId>(), addedBy: id<Ids.UserId>(), file: attachment });

const changeRequest = z.object({
  id: id<Ids.ChangeRequestId>(),
  workspaceId: id<Ids.WorkspaceId>(),
  proposedBy: id<Ids.UserId>(),
  kinds: z.array(z.enum(['scope', 'date', 'price'])),
  reason: str,
  scopeNote: str,
  newTotalPaise: paise.nullable(),
  newEndDate: nullableIso,
  status: z.enum(CHANGE_REQUEST_STATUSES),
  responseNote: str,
  createdAt: iso,
  resolvedAt: nullableIso,
});

const activity = z.object({
  id: id<Ids.ActivityId>(),
  projectId: id<Ids.ProjectId>(),
  workspaceId: id<Ids.WorkspaceId>().nullable(),
  type: z.enum([
    'project_published',
    'project_updated',
    'quote_submitted',
    'quote_revised',
    'quote_accepted',
    'workspace_created',
    'milestone_started',
    'milestone_submitted',
    'milestone_approved',
    'milestone_changes_requested',
    'milestone_updated',
    'site_update_posted',
    'document_added',
    'document_removed',
    'change_proposed',
    'change_accepted',
    'change_rejected',
    'change_withdrawn',
    'message_sent',
    'project_completed',
    'project_cancelled',
    'review_submitted',
  ]),
  actorId: id<Ids.UserId>(),
  at: iso,
  summary: str,
});

const conversation = z.object({
  id: id<Ids.ConversationId>(),
  projectId: id<Ids.ProjectId>(),
  ownerId: id<Ids.UserId>(),
  contractorId: id<Ids.UserId>(),
  kind: z.enum(['enquiry', 'project']),
  closedReason: str.nullable(),
  lastReadAt: z.record(z.string(), iso),
  createdAt: iso,
});

const message = z.object({ id: id<Ids.MessageId>(), conversationId: id<Ids.ConversationId>(), senderId: id<Ids.UserId>(), body: str, sentAt: iso });

const notification = z.object({
  id: id<Ids.NotificationId>(),
  recipientId: id<Ids.UserId>(),
  category: z.enum(NOTIFICATION_CATEGORIES),
  title: str,
  body: str,
  link: z.string().startsWith('/').max(300),
  createdAt: iso,
  readAt: nullableIso,
  muted: z.boolean(),
});

const table = <T extends z.ZodType>(row: T) => z.record(z.string(), row);

export const demoStateSchema: z.ZodType<DemoState> = z.object({
  meta: z.object({ schemaVersion: z.literal(SCHEMA_VERSION), seedAnchor: iso, activePersonaId: id<Ids.UserId>().nullable() }),
  users: table(user),
  ownerSettings: table(ownerSettings),
  contractorProfiles: table(contractorProfile),
  portfolio: table(portfolioItem),
  projects: table(project),
  leadStates: table(z.object({ contractorId: id<Ids.UserId>(), projectId: id<Ids.ProjectId>(), disposition: z.enum(['saved', 'ignored']), updatedAt: iso })),
  invitations: table(z.object({ ownerId: id<Ids.UserId>(), contractorId: id<Ids.UserId>(), projectId: id<Ids.ProjectId>(), createdAt: iso })),
  shortlist: table(z.object({ ownerId: id<Ids.UserId>(), contractorId: id<Ids.UserId>(), createdAt: iso })),
  quotes: table(quote),
  workspaces: table(workspace),
  milestones: table(milestone),
  siteUpdates: table(siteUpdate),
  documents: table(document),
  changeRequests: table(changeRequest),
  activity: table(activity),
  conversations: table(conversation),
  messages: table(message),
  notifications: table(notification),
  reviews: table(review),
});

/** Cross-record checks Zod can't express. Returns a description of the first problem, or null. */
export function referentialProblem(s: DemoState): string | null {
  for (const p of Object.values(s.projects)) if (!s.users[p.ownerId]) return `project ${p.id} has unknown owner`;
  for (const q of Object.values(s.quotes)) {
    if (!s.projects[q.projectId]) return `quote ${q.id} has unknown project`;
    if (!s.contractorProfiles[q.contractorId]) return `quote ${q.id} has unknown contractor`;
  }
  const wsProjects = new Set<string>();
  for (const w of Object.values(s.workspaces)) {
    if (!s.projects[w.projectId]) return `workspace ${w.id} has unknown project`;
    if (wsProjects.has(w.projectId)) return `project ${w.projectId} has more than one workspace`;
    wsProjects.add(w.projectId);
  }
  for (const m of Object.values(s.milestones)) if (!s.workspaces[m.workspaceId]) return `milestone ${m.id} has unknown workspace`;
  for (const m of Object.values(s.messages)) if (!s.conversations[m.conversationId]) return `message ${m.id} has unknown conversation`;
  for (const c of Object.values(s.conversations)) if (!s.projects[c.projectId]) return `conversation ${c.id} has unknown project`;
  for (const p of Object.values(s.contractorProfiles)) if (!s.users[p.userId]) return `profile ${p.userId} has unknown user`;
  if (s.meta.activePersonaId && !s.users[s.meta.activePersonaId]?.isPersona) return 'active persona is not a demo persona';
  return null;
}
