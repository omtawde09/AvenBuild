import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bookmark, BookmarkCheck, MessageSquare, Send } from 'lucide-react';
import { useActorId, useData } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import type { ProjectId, UserId } from '@/domain/ids';
import { inviteToQuote } from '@/domain/projects/commands';
import { setShortlisted } from '@/domain/leads/commands';
import { ensureConversation } from '@/domain/messages/commands';
import { ownerProjects } from '@/domain/projects/selectors';
import { isOpenForQuotes, matchProject } from '@/domain/matching/match';
import { invitationKey, shortlistKey } from '@/domain/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/cn';

export function ShortlistButton({ contractorId, compact = false }: { contractorId: UserId; compact?: boolean }) {
  const data = useData();
  const me = useActorId();
  const command = useCommand();
  const on = Boolean(data.shortlist[shortlistKey(me, contractorId)]);
  const name = data.contractorProfiles[contractorId]?.businessName ?? 'Contractor';
  const toggle = () =>
    command((s, c) => setShortlisted(s, contractorId, !on, c), {
      success: on ? `Removed ${name} from your shortlist.` : `Added ${name} to your shortlist.`,
      ...(on ? { undo: { run: () => command((s, c) => setShortlisted(s, contractorId, true, c)) } } : {}),
    });
  return (
    <Button
      variant="secondary"
      size={compact ? 'sm' : 'md'}
      aria-pressed={on}
      onClick={toggle}
      icon={on ? <BookmarkCheck aria-hidden className="size-4 text-brick" /> : <Bookmark aria-hidden className="size-4" />}
    >
      {on ? 'Shortlisted' : 'Shortlist'}
    </Button>
  );
}

/** Pick one of the owner's open projects, then invite to quote or start an enquiry conversation. */
export function ProjectPickerDialog({ contractorId, mode, open, onClose }: { contractorId: UserId; mode: 'invite' | 'message'; open: boolean; onClose: () => void }) {
  const data = useData();
  const me = useActorId();
  const command = useCommand();
  const navigate = useNavigate();
  const profile = data.contractorProfiles[contractorId];
  const candidates = useMemo(() => ownerProjects(data, me).filter((p) => (mode === 'invite' ? isOpenForQuotes(p) : ['open', 'reviewing', 'paused', 'awarded', 'in_progress'].includes(p.status))), [data, me, mode]);
  const [picked, setPicked] = useState<string>('');
  if (!profile) return null;

  const status = (pid: string) => {
    if (data.invitations[invitationKey(contractorId, pid as ProjectId)]) return 'Already invited';
    const q = Object.values(data.quotes).find((x) => x.projectId === pid && x.contractorId === contractorId && x.status !== 'draft');
    if (q) return 'Already quoted';
    return null;
  };

  const confirm = () => {
    const pid = picked as ProjectId;
    if (!pid) return;
    if (mode === 'invite') {
      const r = command((s, c) => inviteToQuote(s, pid, contractorId, c), { success: `${profile.businessName} has been invited to quote.` });
      if (r.ok) onClose();
    } else {
      const existing = Object.values(data.conversations).find((c) => c.projectId === pid && c.contractorId === contractorId);
      if (existing) {
        onClose();
        navigate(`/messages/${existing.id}`);
        return;
      }
      const r = command((s, c) => ensureConversation(s, pid, contractorId, c));
      if (r.ok) {
        onClose();
        navigate(`/messages/${r.value}`);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === 'invite' ? `Invite ${profile.businessName} to quote` : `Message ${profile.businessName}`}
      description={mode === 'invite' ? 'They’ll get a notification and see the project in their lead feed.' : 'Conversations are tied to a project so both sides know what’s being discussed.'}
      footer={
        candidates.length ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={!picked || (mode === 'invite' && Boolean(status(picked)))} icon={mode === 'invite' ? <Send aria-hidden className="size-4" /> : <MessageSquare aria-hidden className="size-4" />}>
              {mode === 'invite' ? 'Send invitation' : 'Open conversation'}
            </Button>
          </>
        ) : (
          <ButtonLink to="/owner/projects/new" onClick={onClose}>
            Post a project
          </ButtonLink>
        )
      }
    >
      {candidates.length ? (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Which project?</legend>
          <ul className="grid gap-2">
            {candidates.map((p) => {
              const st = mode === 'invite' ? status(p.id) : null;
              const fit = matchProject(profile, p);
              return (
                <li key={p.id}>
                  <label className={cn('flex cursor-pointer items-start gap-3 rounded-sm border border-line-strong px-3 py-2.5 has-checked:border-ink has-checked:bg-sunken', st && 'opacity-60')}>
                    <input type="radio" name="project" value={p.id} checked={picked === p.id} onChange={() => setPicked(p.id)} className="mt-1 size-4 accent-brick" />
                    <span className="min-w-0 text-sm">
                      <span className="block font-medium">{p.title}</span>
                      <span className="block text-ink-3">
                        {p.location.locality}, {p.location.city}
                        {st ? ` · ${st}` : !fit.reasons.some((r) => r.kind === 'service') && mode === 'invite' ? ' · outside their listed services' : ''}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : (
        <p className="text-sm text-ink-2">
          {mode === 'invite' ? 'You don’t have a project that’s open for quotes. Publish a project first.' : 'You don’t have an active project to discuss yet.'}
        </p>
      )}
    </Dialog>
  );
}
