import type { ServiceCategoryId } from '@/data/categories';
import type {
  ActivityId,
  AttachmentId,
  ChangeRequestId,
  ConversationId,
  DocumentId,
  LineItemId,
  MessageId,
  MilestoneId,
  NotificationId,
  PortfolioItemId,
  ProjectId,
  QuoteId,
  ReviewId,
  SiteUpdateId,
  UserId,
  WorkspaceId,
} from './ids';
import type { Role } from './roles';
import type { ChangeRequestStatus, MilestoneStatus, ProjectStatus, QuoteStatus, WorkspaceStatus } from './status';

export type { ServiceCategoryId };

/** Calendar date, local, `YYYY-MM-DD`. */
export type ISODate = string;
/** Timestamp, ISO-8601 UTC. */
export type ISODateTime = string;
/** Money in integer paise (1 rupee = 100 paise). */
export type Paise = number;

export const UNITS = ['sq_ft', 'sq_m', 'cu_m', 'rft', 'nos', 'kg', 'lump_sum', 'day'] as const;
export type Unit = (typeof UNITS)[number];

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const NOTIFICATION_CATEGORIES = ['project', 'quote', 'message', 'milestone', 'change', 'review', 'system'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
export type NotificationPrefs = Record<NotificationCategory, boolean>;

export type VerificationStatus = 'sample_demo' | 'not_submitted' | 'pending_demo';

// ── People ────────────────────────────────────────────────────────────────────

export interface User {
  id: UserId;
  role: Role;
  displayName: string;
  city: string;
  locality: string;
  isPersona: boolean;
  isSeed: boolean;
  createdAt: ISODateTime;
}

export interface OwnerSettings {
  userId: UserId;
  contactPreference: 'messages_only' | 'messages_and_site_visits';
  notificationPrefs: NotificationPrefs;
}

export interface ServiceArea {
  city: string;
  localities: string[];
}

export interface ContractorProfile {
  userId: UserId;
  businessName: string;
  contactName: string;
  bio: string;
  services: ServiceCategoryId[];
  serviceAreas: ServiceArea[];
  yearsExperience: number;
  teamSize: number;
  availability: { status: 'available' | 'limited' | 'unavailable'; availableFrom: ISODate };
  typicalProjectRange: { minPaise: Paise; maxPaise: Paise };
  contactPreferences: { siteVisits: boolean; preferredHours: string };
  qualifications: {
    licenceNumber: string;
    licenceStatus: VerificationStatus;
    gstNumber: string;
    gstStatus: VerificationStatus;
  };
  /** Seeded illustrative value; null when not applicable. Labelled "Sample" in the UI. */
  responseTimeSampleHours: number | null;
  visibility: 'listed' | 'hidden';
  quoteDefaults: { validityDays: number; taxPercent: number; inclusions: string[]; exclusions: string[] };
  notificationPrefs: NotificationPrefs;
  isSeed: boolean;
  updatedAt: ISODateTime;
}

export interface AttachmentMeta {
  id: AttachmentId;
  name: string;
  mimeType: string;
  sizeBytes: number;
  addedAt: ISODateTime;
  /** session: preview lives in memory until refresh; seed: bundled illustration; none: no preview. */
  previewKind: 'session' | 'seed' | 'none';
  /** Key of a bundled illustration when previewKind is "seed". */
  seedArt?: string | undefined;
}

export interface PortfolioItem {
  id: PortfolioItemId;
  contractorId: UserId;
  title: string;
  category: ServiceCategoryId;
  description: string;
  approxValue: { minPaise: Paise; maxPaise: Paise } | null;
  completedOn: ISODate;
  city: string;
  images: AttachmentMeta[];
  isSeed: boolean;
}

export interface Review {
  id: ReviewId;
  contractorId: UserId;
  /** Null for seeded historical reviews that predate this demo's projects. */
  projectId: ProjectId | null;
  workspaceId: WorkspaceId | null;
  ownerId: UserId | null;
  reviewerLabel: string;
  projectTitle: string;
  rating: number;
  dimensions: { communication: number | null; quality: number | null; scheduleClarity: number | null };
  text: string;
  createdAt: ISODateTime;
  isSeed: boolean;
}

// ── Projects ──────────────────────────────────────────────────────────────────

export const PROPERTY_TYPES = ['apartment', 'independent_house', 'commercial', 'industrial', 'plot', 'other'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const START_PREFERENCES = ['asap', 'within_month', 'flexible', 'specific_date'] as const;
export type StartPreference = (typeof START_PREFERENCES)[number];

export const MATERIAL_RESPONSIBILITY = ['contractor', 'owner', 'shared'] as const;
export type MaterialResponsibility = (typeof MATERIAL_RESPONSIBILITY)[number];

export type Budget = { kind: 'range'; minPaise: Paise; maxPaise: Paise } | { kind: 'undisclosed' };

export interface Project {
  id: ProjectId;
  ownerId: UserId;
  status: ProjectStatus;
  /** Null only while a draft has not chosen a category yet. */
  category: ServiceCategoryId | null;
  title: string;
  scope: string;
  scopeItems: string[];
  propertyType: PropertyType | null;
  location: { city: string; locality: string; landmark: string };
  budget: Budget;
  startPreference: StartPreference | null;
  targetStartDate: ISODate | null;
  durationEstimate: { value: number; unit: 'days' | 'weeks' } | null;
  siteVisit: { days: Weekday[]; window: string };
  materialResponsibility: MaterialResponsibility | null;
  attachments: AttachmentMeta[];
  accessNotes: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  publishedAt: ISODateTime | null;
  pausedFromStatus: 'open' | 'reviewing' | null;
  closedReason: string | null;
  closedAt: ISODateTime | null;
  draftStep: number;
  isSeed: boolean;
}

export interface LeadState {
  contractorId: UserId;
  projectId: ProjectId;
  disposition: 'saved' | 'ignored';
  updatedAt: ISODateTime;
}

export interface QuoteInvitation {
  ownerId: UserId;
  contractorId: UserId;
  projectId: ProjectId;
  createdAt: ISODateTime;
}

export interface ShortlistEntry {
  ownerId: UserId;
  contractorId: UserId;
  createdAt: ISODateTime;
}

// ── Quotes ────────────────────────────────────────────────────────────────────

export interface LineItem {
  id: LineItemId;
  description: string;
  /** Up to 2 decimal places, > 0. */
  quantity: number;
  unit: Unit;
  ratePaise: Paise;
}

export type Discount = { kind: 'none' } | { kind: 'percent'; percent: number } | { kind: 'flat'; paise: Paise };

export interface ProposedMilestone {
  title: string;
  sharePercent: number;
}

export interface QuoteContent {
  lineItems: LineItem[];
  discount: Discount;
  taxPercent: number;
  startWindow: { earliest: ISODate; latest: ISODate };
  durationDays: number;
  proposedMilestones: ProposedMilestone[];
  inclusions: string[];
  exclusions: string[];
  assumptions: string[];
  validUntil: ISODate;
  note: string;
}

export interface QuoteSnapshot {
  revision: number;
  content: QuoteContent;
  submittedAt: ISODateTime;
}

export type DeclineReason = 'owner' | 'awarded_elsewhere' | 'project_closed';

export interface Quote {
  id: QuoteId;
  projectId: ProjectId;
  contractorId: UserId;
  status: QuoteStatus;
  revision: number;
  /** Draft content while status is "draft"; afterwards, the last submitted version (what the owner sees). */
  content: QuoteContent;
  /** Unsubmitted edits made while revising (after a revision request or a withdrawal). */
  pendingContent: QuoteContent | null;
  history: QuoteSnapshot[];
  revisionRequest: { message: string; at: ISODateTime } | null;
  declineReason: DeclineReason | null;
  declineNote: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  submittedAt: ISODateTime | null;
  viewedAt: ISODateTime | null;
  decidedAt: ISODateTime | null;
  withdrawnAt: ISODateTime | null;
  isSeed: boolean;
}

// ── Workspace ─────────────────────────────────────────────────────────────────

export interface AgreementVersion {
  revision: number;
  totalPaise: Paise;
  startDate: ISODate;
  endDate: ISODate;
  at: ISODateTime;
  changeRequestId: ChangeRequestId | null;
  note: string;
}

export interface Workspace {
  id: WorkspaceId;
  projectId: ProjectId;
  ownerId: UserId;
  contractorId: UserId;
  acceptedQuoteId: QuoteId;
  acceptedQuoteRevision: number;
  /** Frozen copy of the accepted quote content. Never edited. */
  acceptedContent: QuoteContent;
  agreement: AgreementVersion[];
  status: WorkspaceStatus;
  createdAt: ISODateTime;
  completedAt: ISODateTime | null;
  cancelledAt: ISODateTime | null;
}

export interface Milestone {
  id: MilestoneId;
  workspaceId: WorkspaceId;
  order: number;
  title: string;
  description: string;
  targetDate: ISODate;
  sharePercent: number;
  status: MilestoneStatus;
  evidenceNote: string;
  changeRequestNote: string;
  startedAt: ISODateTime | null;
  submittedAt: ISODateTime | null;
  approvedAt: ISODateTime | null;
  updatedAt: ISODateTime;
}

export interface SiteUpdate {
  id: SiteUpdateId;
  workspaceId: WorkspaceId;
  authorId: UserId;
  date: ISODate;
  notes: string;
  progressPercent: number;
  attachments: AttachmentMeta[];
  createdAt: ISODateTime;
}

export interface WorkspaceDocument {
  id: DocumentId;
  workspaceId: WorkspaceId;
  addedBy: UserId;
  file: AttachmentMeta;
}

export interface ChangeRequest {
  id: ChangeRequestId;
  workspaceId: WorkspaceId;
  proposedBy: UserId;
  kinds: Array<'scope' | 'date' | 'price'>;
  reason: string;
  scopeNote: string;
  newTotalPaise: Paise | null;
  newEndDate: ISODate | null;
  status: ChangeRequestStatus;
  responseNote: string;
  createdAt: ISODateTime;
  resolvedAt: ISODateTime | null;
}

export type ActivityType =
  | 'project_published'
  | 'project_updated'
  | 'quote_submitted'
  | 'quote_revised'
  | 'quote_accepted'
  | 'workspace_created'
  | 'milestone_started'
  | 'milestone_submitted'
  | 'milestone_approved'
  | 'milestone_changes_requested'
  | 'milestone_updated'
  | 'site_update_posted'
  | 'document_added'
  | 'document_removed'
  | 'change_proposed'
  | 'change_accepted'
  | 'change_rejected'
  | 'change_withdrawn'
  | 'message_sent'
  | 'project_completed'
  | 'project_cancelled'
  | 'review_submitted';

export interface ActivityEvent {
  id: ActivityId;
  projectId: ProjectId;
  workspaceId: WorkspaceId | null;
  type: ActivityType;
  actorId: UserId;
  at: ISODateTime;
  summary: string;
}

// ── Communication ─────────────────────────────────────────────────────────────

export interface Conversation {
  id: ConversationId;
  projectId: ProjectId;
  ownerId: UserId;
  contractorId: UserId;
  kind: 'enquiry' | 'project';
  /** Read-only once the project was awarded to someone else or closed. */
  closedReason: string | null;
  lastReadAt: Partial<Record<UserId, ISODateTime>>;
  createdAt: ISODateTime;
}

export interface Message {
  id: MessageId;
  conversationId: ConversationId;
  senderId: UserId;
  body: string;
  sentAt: ISODateTime;
}

export interface Notification {
  id: NotificationId;
  recipientId: UserId;
  category: NotificationCategory;
  title: string;
  body: string;
  link: string;
  createdAt: ISODateTime;
  readAt: ISODateTime | null;
  /** Recorded but not counted in badges when the recipient muted the category. */
  muted: boolean;
}

// ── Root state ────────────────────────────────────────────────────────────────

export const SCHEMA_VERSION = 1 as const;

export interface DemoMeta {
  schemaVersion: typeof SCHEMA_VERSION;
  seedAnchor: ISODate;
  activePersonaId: UserId | null;
}

export interface DemoState {
  meta: DemoMeta;
  users: Record<string, User>;
  ownerSettings: Record<string, OwnerSettings>;
  contractorProfiles: Record<string, ContractorProfile>;
  portfolio: Record<string, PortfolioItem>;
  projects: Record<string, Project>;
  leadStates: Record<string, LeadState>;
  invitations: Record<string, QuoteInvitation>;
  shortlist: Record<string, ShortlistEntry>;
  quotes: Record<string, Quote>;
  workspaces: Record<string, Workspace>;
  milestones: Record<string, Milestone>;
  siteUpdates: Record<string, SiteUpdate>;
  documents: Record<string, WorkspaceDocument>;
  changeRequests: Record<string, ChangeRequest>;
  activity: Record<string, ActivityEvent>;
  conversations: Record<string, Conversation>;
  messages: Record<string, Message>;
  notifications: Record<string, Notification>;
  reviews: Record<string, Review>;
}

export type TableName = Exclude<keyof DemoState, 'meta'>;

export const leadKey = (contractorId: UserId, projectId: ProjectId) => `${contractorId}:${projectId}`;
export const invitationKey = (contractorId: UserId, projectId: ProjectId) => `${contractorId}:${projectId}`;
export const shortlistKey = (ownerId: UserId, contractorId: UserId) => `${ownerId}:${contractorId}`;
