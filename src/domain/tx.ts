import type { ActivityId, IdFactory, IdPrefix, NotificationId, ProjectId, UserId, WorkspaceId } from './ids';
import type { ActivityEvent, ActivityType, DemoState, ISODate, ISODateTime, Notification, NotificationCategory, TableName } from './types';
import { fail, ok, type DomainError, type Result } from './result';

/** Everything a command needs from the outside world. Injected so tests are deterministic. */
export interface CommandContext {
  actorId: UserId;
  now: ISODateTime;
  today: ISODate;
  newId: IdFactory;
}

type Row<T extends TableName> = DemoState[T][string];

/**
 * Immutable transaction over DemoState. Each write copies only the touched table, so the previous
 * state object is never mutated and the store can swap the whole state atomically on success.
 */
export class Tx {
  private state: DemoState;
  readonly ctx: CommandContext;

  constructor(state: DemoState, ctx: CommandContext) {
    this.state = state;
    this.ctx = ctx;
  }

  get s(): DemoState {
    return this.state;
  }

  id<T extends string>(prefix: IdPrefix): T {
    return this.ctx.newId(prefix) as T;
  }

  put<T extends TableName>(table: T, key: string, row: Row<T>): void {
    this.state = { ...this.state, [table]: { ...this.state[table], [key]: row } };
  }

  remove<T extends TableName>(table: T, key: string): void {
    const next = { ...this.state[table] };
    delete next[key];
    this.state = { ...this.state, [table]: next };
  }

  /** Append an activity log entry. */
  log(e: { projectId: ProjectId; workspaceId?: WorkspaceId | null; type: ActivityType; summary: string; actorId?: UserId }): void {
    const id = this.id<ActivityId>('act');
    const event: ActivityEvent = {
      id,
      projectId: e.projectId,
      workspaceId: e.workspaceId ?? null,
      type: e.type,
      actorId: e.actorId ?? this.ctx.actorId,
      at: this.ctx.now,
      summary: e.summary,
    };
    this.put('activity', id, event);
  }

  /** Create an in-app notification for another user, honouring their category preferences. */
  notify(n: { recipientId: UserId; category: NotificationCategory; title: string; body: string; link: string }): void {
    if (n.recipientId === this.ctx.actorId) return;
    const id = this.id<NotificationId>('ntf');
    const notification: Notification = {
      id,
      recipientId: n.recipientId,
      category: n.category,
      title: n.title,
      body: n.body,
      link: n.link,
      createdAt: this.ctx.now,
      readAt: null,
      muted: !notificationsEnabled(this.state, n.recipientId, n.category),
    };
    this.put('notifications', id, notification);
  }

  done<V>(value: V): Result<{ state: DemoState; value: V }> {
    return ok({ state: this.state, value });
  }
}

export function notificationsEnabled(state: DemoState, userId: UserId, category: NotificationCategory): boolean {
  if (category === 'system') return true;
  const prefs = state.ownerSettings[userId]?.notificationPrefs ?? state.contractorProfiles[userId]?.notificationPrefs;
  return prefs ? prefs[category] : true;
}

export type CommandResult<V = undefined> = Result<{ state: DemoState; value: V }>;

export const invalid = (message: string): { ok: false; error: DomainError } => fail('INVALID_TRANSITION', message);
export const notFound = (what: string): { ok: false; error: DomainError } => fail('NOT_FOUND', `That ${what} no longer exists.`);
export const forbidden = (message: string): { ok: false; error: DomainError } => fail('FORBIDDEN', message);
