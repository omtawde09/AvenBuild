import type { ProjectId, UserId } from '../ids';
import { forbidden, notFound, Tx, type CommandContext, type CommandResult } from '../tx';
import type { DemoState, LeadState, ShortlistEntry } from '../types';
import { leadKey, shortlistKey } from '../types';

/** Save, ignore or clear (null) a lead for the acting contractor. Returns the previous disposition for undo. */
export function setLeadDisposition(state: DemoState, projectId: ProjectId, disposition: LeadState['disposition'] | null, ctx: CommandContext): CommandResult<LeadState['disposition'] | null> {
  if (!state.contractorProfiles[ctx.actorId]) return forbidden('Only contractors can save or ignore leads.');
  if (!state.projects[projectId]) return notFound('project');
  const key = leadKey(ctx.actorId, projectId);
  const previous = state.leadStates[key]?.disposition ?? null;
  const tx = new Tx(state, ctx);
  if (disposition === null) tx.remove('leadStates', key);
  else tx.put('leadStates', key, { contractorId: ctx.actorId, projectId, disposition, updatedAt: ctx.now });
  return tx.done(previous);
}

export function setShortlisted(state: DemoState, contractorId: UserId, shortlisted: boolean, ctx: CommandContext): CommandResult {
  if (state.users[ctx.actorId]?.role !== 'owner') return forbidden('Only owners keep a shortlist.');
  if (!state.contractorProfiles[contractorId]) return notFound('contractor');
  const key = shortlistKey(ctx.actorId, contractorId);
  const tx = new Tx(state, ctx);
  if (shortlisted) {
    if (!state.shortlist[key]) {
      const entry: ShortlistEntry = { ownerId: ctx.actorId, contractorId, createdAt: ctx.now };
      tx.put('shortlist', key, entry);
    }
  } else tx.remove('shortlist', key);
  return tx.done(undefined);
}
