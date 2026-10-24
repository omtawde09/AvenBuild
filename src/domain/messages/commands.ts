import type { ConversationId, MessageId, NotificationId, ProjectId, UserId } from '../ids';
import { links } from '../links';
import { fail } from '../result';
import { forbidden, invalid, notFound, Tx, type CommandContext, type CommandResult } from '../tx';
import type { Conversation, DemoState } from '../types';

export const MESSAGE_MAX = 2000;

export function validateMessageBody(body: string): string | null {
  const text = body.trim();
  if (!text) return 'Write a message before sending.';
  if (text.length > MESSAGE_MAX) return `Messages can be at most ${MESSAGE_MAX} characters.`;
  return null;
}

/** Find or create the single conversation for (project, contractor). Owner or that contractor may open it. */
export function ensureConversation(state: DemoState, projectId: ProjectId, contractorId: UserId, ctx: CommandContext): CommandResult<ConversationId> {
  const project = state.projects[projectId];
  if (!project) return notFound('project');
  if (ctx.actorId !== project.ownerId && ctx.actorId !== contractorId) return forbidden('You’re not part of this conversation.');
  if (!state.contractorProfiles[contractorId]) return notFound('contractor');
  const existing = Object.values(state.conversations).find((c) => c.projectId === projectId && c.contractorId === contractorId);
  if (existing) return { ok: true, value: { state, value: existing.id } };
  if (project.status === 'draft') return invalid('Publish the project before starting a conversation about it.');
  if (project.status !== 'open' && project.status !== 'reviewing' && project.status !== 'paused') {
    return invalid('This project is no longer taking enquiries.');
  }
  const tx = new Tx(state, ctx);
  const id = tx.id<ConversationId>('cnv');
  const conversation: Conversation = { id, projectId, ownerId: project.ownerId, contractorId, kind: 'enquiry', closedReason: null, lastReadAt: { [ctx.actorId]: ctx.now }, createdAt: ctx.now };
  tx.put('conversations', id, conversation);
  return tx.done(id);
}

export function sendMessage(state: DemoState, conversationId: ConversationId, body: string, ctx: CommandContext): CommandResult<MessageId> {
  const c = state.conversations[conversationId];
  if (!c) return notFound('conversation');
  if (ctx.actorId !== c.ownerId && ctx.actorId !== c.contractorId) return forbidden('You’re not part of this conversation.');
  if (c.closedReason) return invalid(`This conversation is closed. ${c.closedReason}`);
  const error = validateMessageBody(body);
  if (error) return fail('VALIDATION', error, { body: error });
  const tx = new Tx(state, ctx);
  const id = tx.id<MessageId>('msg');
  tx.put('messages', id, { id, conversationId, senderId: ctx.actorId, body: body.trim(), sentAt: ctx.now });
  // Your own message never counts as unread for you.
  tx.put('conversations', conversationId, { ...c, lastReadAt: { ...c.lastReadAt, [ctx.actorId]: ctx.now } });
  const project = state.projects[c.projectId];
  const sender = ctx.actorId === c.contractorId ? (state.contractorProfiles[c.contractorId]?.businessName ?? 'Contractor') : (state.users[c.ownerId]?.displayName ?? 'Owner');
  const recipient = ctx.actorId === c.ownerId ? c.contractorId : c.ownerId;
  if (c.kind === 'project') {
    const ws = Object.values(state.workspaces).find((w) => w.projectId === c.projectId && w.contractorId === c.contractorId);
    tx.log({ projectId: c.projectId, workspaceId: ws?.id ?? null, type: 'message_sent', summary: `Message from ${sender}` });
  }
  tx.notify({ recipientId: recipient, category: 'message', title: `New message from ${sender}`, body: `${project?.title ?? 'Project'}: ${body.trim().slice(0, 140)}`, link: links.conversation(conversationId) });
  return tx.done(id);
}

/** Opening a thread marks it read for the viewer, plus that thread's message notifications. */
export function markConversationRead(state: DemoState, conversationId: ConversationId, ctx: CommandContext): CommandResult {
  const c = state.conversations[conversationId];
  if (!c) return notFound('conversation');
  if (ctx.actorId !== c.ownerId && ctx.actorId !== c.contractorId) return forbidden('You’re not part of this conversation.');
  const link = links.conversation(conversationId);
  const stale = Object.values(state.notifications).filter((n) => n.recipientId === ctx.actorId && !n.readAt && n.link === link);
  const latest = Object.values(state.messages)
    .filter((m) => m.conversationId === conversationId)
    .reduce((max, m) => (m.sentAt > max ? m.sentAt : max), '');
  const lastRead = c.lastReadAt[ctx.actorId] ?? '';
  if (!stale.length && lastRead >= latest && lastRead) return { ok: true, value: { state, value: undefined } };
  const tx = new Tx(state, ctx);
  tx.put('conversations', conversationId, { ...c, lastReadAt: { ...c.lastReadAt, [ctx.actorId]: ctx.now > latest ? ctx.now : latest } });
  for (const n of stale) tx.put('notifications', n.id, { ...n, readAt: ctx.now });
  return tx.done(undefined);
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function setNotificationRead(state: DemoState, id: NotificationId, read: boolean, ctx: CommandContext): CommandResult {
  const n = state.notifications[id];
  if (!n) return notFound('notification');
  if (n.recipientId !== ctx.actorId) return forbidden('That notification belongs to someone else.');
  if (Boolean(n.readAt) === read) return { ok: true, value: { state, value: undefined } };
  const tx = new Tx(state, ctx);
  tx.put('notifications', id, { ...n, readAt: read ? ctx.now : null });
  return tx.done(undefined);
}

export function markAllNotificationsRead(state: DemoState, ctx: CommandContext): CommandResult<number> {
  const unread = Object.values(state.notifications).filter((n) => n.recipientId === ctx.actorId && !n.readAt);
  if (!unread.length) return { ok: true, value: { state, value: 0 } };
  const tx = new Tx(state, ctx);
  for (const n of unread) tx.put('notifications', n.id, { ...n, readAt: ctx.now });
  return tx.done(unread.length);
}
