import { SCHEMA_VERSION, invitationKey, leadKey, shortlistKey, type DemoState, type ISODate } from '@/domain/types';
import { seedClock } from './builder';
import { seedCollab } from './collab';
import { seedContractorProfiles, seedOwnerSettings, seedPortfolio, seedReviews, seedUsers } from './people';
import { seedInvitations, seedLeadStates, seedProjects, seedQuotes, seedShortlist } from './projects';

const byId = <T extends { id: string }>(rows: T[]): Record<string, T> => Object.fromEntries(rows.map((r) => [r.id, r]));
const byKey = <T>(rows: T[], key: (r: T) => string): Record<string, T> => Object.fromEntries(rows.map((r) => [key(r), r]));

/**
 * Build the deterministic demo scenario. Every timestamp is an offset from `anchor` (local midnight of the
 * reset day), so content and relationships are identical on every reset and dates never go stale.
 */
export function buildSeed(anchor: ISODate): DemoState {
  const t = seedClock(anchor);
  const quotes = seedQuotes(t);
  const collab = seedCollab(t, quotes);
  return {
    meta: { schemaVersion: SCHEMA_VERSION, seedAnchor: anchor, activePersonaId: null },
    users: byId(seedUsers(t)),
    ownerSettings: byKey(seedOwnerSettings(), (s) => s.userId),
    contractorProfiles: byKey(seedContractorProfiles(t), (p) => p.userId),
    portfolio: byId(seedPortfolio(t)),
    projects: byId(seedProjects(t)),
    leadStates: byKey(seedLeadStates(t), (l) => leadKey(l.contractorId, l.projectId)),
    invitations: byKey(seedInvitations(t), (i) => invitationKey(i.contractorId, i.projectId)),
    shortlist: byKey(seedShortlist(t), (s) => shortlistKey(s.ownerId, s.contractorId)),
    quotes: byId(quotes),
    workspaces: byId(collab.workspaces),
    milestones: byId(collab.milestones),
    siteUpdates: byId(collab.siteUpdates),
    documents: byId(collab.documents),
    changeRequests: byId(collab.changeRequests),
    activity: byId(collab.activity),
    conversations: byId(collab.conversations),
    messages: byId(collab.messages),
    notifications: byId(collab.notifications),
    reviews: byId(seedReviews(t)),
  };
}
