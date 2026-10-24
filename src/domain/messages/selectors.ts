import type { UserId } from '../ids';
import type { Conversation, DemoState, Message, Notification } from '../types';

export function conversationMessages(state: DemoState, conversationId: string): Message[] {
  return Object.values(state.messages)
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt) || a.id.localeCompare(b.id));
}

/** Messages from the other party sent after the viewer's lastReadAt. */
export function unreadCount(state: DemoState, c: Conversation, viewerId: UserId): number {
  const lastRead = c.lastReadAt[viewerId] ?? '';
  return Object.values(state.messages).filter((m) => m.conversationId === c.id && m.senderId !== viewerId && m.sentAt > lastRead).length;
}

export interface ConversationRow {
  conversation: Conversation;
  last: Message | null;
  unread: number;
}

export function conversationsFor(state: DemoState, userId: UserId): ConversationRow[] {
  const lastBy = new Map<string, Message>();
  for (const m of Object.values(state.messages)) {
    const cur = lastBy.get(m.conversationId);
    if (!cur || m.sentAt > cur.sentAt) lastBy.set(m.conversationId, m);
  }
  return Object.values(state.conversations)
    .filter((c) => c.ownerId === userId || c.contractorId === userId)
    .map((conversation) => ({ conversation, last: lastBy.get(conversation.id) ?? null, unread: unreadCount(state, conversation, userId) }))
    .sort((a, b) => (b.last?.sentAt ?? b.conversation.createdAt).localeCompare(a.last?.sentAt ?? a.conversation.createdAt));
}

export function unreadConversationCount(state: DemoState, userId: UserId): number {
  return conversationsFor(state, userId).filter((r) => r.unread > 0).length;
}

export function notificationsFor(state: DemoState, userId: UserId): Notification[] {
  return Object.values(state.notifications)
    .filter((n) => n.recipientId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}

/** Badge count: unread and not muted by the recipient's preferences. */
export function unreadNotificationCount(state: DemoState, userId: UserId): number {
  return Object.values(state.notifications).filter((n) => n.recipientId === userId && !n.readAt && !n.muted).length;
}

/** Display name for any participant: business name for contractors, display name for owners. */
export function partyName(state: DemoState, userId: string): string {
  return state.contractorProfiles[userId]?.businessName ?? state.users[userId]?.displayName ?? 'Unknown';
}
