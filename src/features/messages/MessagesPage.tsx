import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router';
import { ArrowDown, ChevronLeft, Lock, MessagesSquare, Send } from 'lucide-react';
import { useActorId, useData } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import type { ConversationId } from '@/domain/ids';
import { MESSAGE_MAX, markConversationRead, sendMessage, validateMessageBody } from '@/domain/messages/commands';
import { conversationMessages, conversationsFor, partyName } from '@/domain/messages/selectors';
import { dateOf } from '@/domain/time';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Avatar } from '@/components/ui/Feedback';
import { FieldError } from '@/components/ui/Field';
import { formatDate, formatRelative, formatTime } from '@/lib/format';
import { cn } from '@/lib/cn';

function ConversationList({ activeId }: { activeId?: string }) {
  const data = useData();
  const me = useActorId();
  const rows = useMemo(() => conversationsFor(data, me), [data, me]);
  if (!rows.length) {
    return (
      <EmptyState icon={<MessagesSquare />} title="No conversations yet" className="m-4">
        Conversations start from a project — ask a question on a lead, or message a contractor from their profile.
      </EmptyState>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {rows.map(({ conversation: c, last, unread }) => {
        const other = me === c.ownerId ? c.contractorId : c.ownerId;
        const project = data.projects[c.projectId];
        return (
          <li key={c.id}>
            <NavLink
              to={`/messages/${c.id}`}
              className={cn('flex gap-3 px-4 py-3 hover:bg-surface', c.id === activeId && 'bg-sunken')}
              aria-current={c.id === activeId ? 'page' : undefined}
            >
              <Avatar name={partyName(data, other)} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={cn('truncate text-sm', unread ? 'font-bold' : 'font-medium')}>{partyName(data, other)}</span>
                  <span className="shrink-0 text-xs text-ink-3">{last ? formatRelative(last.sentAt) : ''}</span>
                </span>
                <span className="block truncate text-xs text-ink-3">{project?.title}</span>
                <span className="mt-0.5 flex items-center gap-2">
                  {unread ? (
                    <span className="shrink-0 rounded-full bg-brick px-1.5 font-mono text-[0.6875rem] leading-5 text-white">
                      {unread}
                      <span className="sr-only"> unread</span>
                    </span>
                  ) : null}
                  <span className={cn('truncate text-sm', unread ? 'text-ink' : 'text-ink-2')}>{last ? `${last.senderId === me ? 'You: ' : ''}${last.body}` : 'No messages yet'}</span>
                  {c.closedReason ? <Lock aria-label="Closed" className="size-3.5 shrink-0 text-ink-3" /> : null}
                </span>
              </span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

function Thread({ conversationId }: { conversationId: string }) {
  const data = useData();
  const me = useActorId();
  const command = useCommand();
  const c = data.conversations[conversationId];
  const messages = useMemo(() => (c ? conversationMessages(data, c.id) : []), [data, c]);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  // Opening (or receiving new messages while viewing) marks the thread read for the viewer.
  const latest = messages.at(-1)?.sentAt ?? '';
  const lastRead = c?.lastReadAt[me] ?? '';
  useEffect(() => {
    if (c && (lastRead < latest || !lastRead || Object.values(data.notifications).some((n) => n.recipientId === me && !n.readAt && n.link === `/messages/${c.id}`))) {
      command((s, ctx) => markConversationRead(s, c.id as ConversationId, ctx));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the thread or its newest message changes
  }, [c?.id, latest, me]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const grew = messages.length > lastCount.current;
    const first = lastCount.current === 0;
    lastCount.current = messages.length;
    if (first || (grew && (atBottom || messages.at(-1)?.senderId === me))) el.scrollTop = el.scrollHeight;
  }, [messages, atBottom, me]);

  if (!c || (c.ownerId !== me && c.contractorId !== me)) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Conversation not found</h1>
        <p className="mt-1 text-ink-2">It may have been removed, or it belongs to someone else.</p>
        <Link to="/messages" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-2">
          All messages
        </Link>
      </div>
    );
  }
  const other = me === c.ownerId ? c.contractorId : c.ownerId;
  const project = data.projects[c.projectId];
  const ws = Object.values(data.workspaces).find((w) => w.projectId === c.projectId && w.contractorId === c.contractorId);
  const projectLink = ws ? `/workspace/${ws.id}` : me === c.ownerId ? `/owner/projects/${c.projectId}` : `/contractor/leads/${c.projectId}`;

  const send = () => {
    const problem = validateMessageBody(body);
    if (problem) {
      setError(problem);
      return;
    }
    const r = command((s, ctx) => sendMessage(s, c.id as ConversationId, body, ctx), { quietValidation: true });
    if (r.ok) {
      setBody('');
      setError(null);
    } else setError(r.error.fieldErrors?.body ?? r.error.message);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b border-line px-2 py-2 sm:px-4">
        <Link to="/messages" className="inline-flex size-11 items-center justify-center rounded-sm hover:bg-sunken md:hidden" aria-label="Back to all conversations">
          <ChevronLeft aria-hidden className="size-5" />
        </Link>
        <Avatar name={partyName(data, other)} size="sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold">{partyName(data, other)}</h1>
          <Link to={projectLink} className="block truncate text-xs text-ink-2 underline underline-offset-2">
            {project?.title ?? 'Project'} · {c.kind === 'project' ? 'project conversation' : 'enquiry'}
          </Link>
        </div>
      </header>
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
        }}
        className="relative min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5"
        role="log"
        tabIndex={0}
        aria-label={`Messages with ${partyName(data, other)}`}
        aria-live="polite"
      >
        {messages.length ? (
          <ol className="space-y-3">
            {messages.map((m, i) => {
              const day = dateOf(m.sentAt);
              const prev = messages[i - 1];
              const showDay = !prev || dateOf(prev.sentAt) !== day;
              const mine = m.senderId === me;
              return (
                <li key={m.id}>
                  {showDay ? <p className="my-3 text-center text-xs font-semibold tracking-wide text-ink-3 uppercase">{formatDate(day)}</p> : null}
                  <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[85%] rounded-md px-3 py-2 sm:max-w-[70%]', mine ? 'bg-ink text-paper' : 'border border-line bg-surface')}>
                      <p className={cn('text-xs font-semibold', mine ? 'text-paper/80' : 'text-ink-2')}>{mine ? 'You' : partyName(data, m.senderId)}</p>
                      <p className="text-[0.9375rem] break-words whitespace-pre-line">{m.body}</p>
                      <p className={cn('mt-0.5 text-right text-[0.6875rem]', mine ? 'text-paper/70' : 'text-ink-3')}>{formatTime(m.sentAt)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-10 text-center text-sm text-ink-3">No messages yet. Say hello — keep contact and site-visit arrangements here.</p>
        )}
      </div>
      {!atBottom ? (
        <div className="relative">
          <Button
            size="sm"
            variant="secondary"
            className="absolute -top-12 left-1/2 -translate-x-1/2 shadow-raised"
            icon={<ArrowDown aria-hidden className="size-4" />}
            onClick={() => {
              const el = scroller.current;
              if (el) el.scrollTop = el.scrollHeight;
            }}
          >
            Jump to latest
          </Button>
        </div>
      ) : null}
      {c.closedReason ? (
        <p className="flex items-center gap-2 border-t border-line bg-sunken px-4 py-3 text-sm text-ink-2">
          <Lock aria-hidden className="size-4" /> This conversation is closed. {c.closedReason}
        </p>
      ) : (
        <form
          noValidate
          className="border-t border-line bg-surface px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor="composer" className="sr-only">
            Message to {partyName(data, other)}
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id="composer"
              rows={2}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  send();
                }
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby="composer-help"
              placeholder="Write a message"
              className="block max-h-40 min-h-11 w-full min-w-0 resize-y rounded-sm border border-line-strong bg-paper px-3 py-2 text-[0.9375rem] aria-invalid:border-bad"
            />
            <Button type="submit" icon={<Send aria-hidden className="size-4" />} aria-label="Send message">
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
          {error ? <FieldError>{error}</FieldError> : null}
          <p id="composer-help" className="mt-1 text-xs text-ink-3">
            {body.length > MESSAGE_MAX - 200 ? `${body.length}/${MESSAGE_MAX} · ` : ''}Ctrl + Enter to send
          </p>
        </form>
      )}
    </div>
  );
}

/** Two-pane messages on desktop; list or thread on phones. */
export function MessagesPage() {
  const { conversationId } = useParams();
  return (
    <div className="-mx-4 -mt-5 flex h-[calc(100dvh-3.5rem-2.25rem)] border-line md:mx-0 md:mt-0 md:h-[calc(100dvh-3.5rem-2.25rem-4rem)] md:border lg:h-[calc(100dvh-3.5rem-2.25rem-4.5rem)]">
      <section aria-label="Conversations" className={cn('min-h-0 w-full overflow-y-auto border-line md:block md:w-80 md:shrink-0 md:border-r', conversationId ? 'hidden' : 'block')}>
        <h1 className={cn('px-4 pt-4 pb-2 text-xl font-semibold', conversationId && 'sr-only md:not-sr-only')}>Messages</h1>
        <ConversationList activeId={conversationId} />
      </section>
      <section aria-label="Conversation" className={cn('min-h-0 min-w-0 flex-1', conversationId ? 'flex' : 'hidden md:flex')}>
        {conversationId ? (
          <div className="flex min-h-0 w-full flex-col">
            <Thread key={conversationId} conversationId={conversationId} />
          </div>
        ) : (
          <div className="m-auto max-w-sm p-6 text-center text-ink-2">
            <MessagesSquare aria-hidden className="mx-auto size-8 text-ink-3" />
            <p className="mt-2">Choose a conversation to read it.</p>
          </div>
        )}
      </section>
    </div>
  );
}
