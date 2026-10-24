import { useNavigate, useParams } from 'react-router';
import { Bookmark, BookmarkCheck, EyeOff, FilePlus2, MessageSquare, RotateCcw } from 'lucide-react';
import { useActorId, useData, todayISO } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import type { ProjectId, UserId } from '@/domain/ids';
import { matchProject, isOpenForQuotes } from '@/domain/matching/match';
import { pipelineStage } from '@/domain/leads/pipeline';
import { setLeadDisposition } from '@/domain/leads/commands';
import { startQuote } from '@/domain/quotes/commands';
import { ensureConversation } from '@/domain/messages/commands';
import { liveQuoteCount } from '@/domain/projects/selectors';
import { invitationKey, leadKey } from '@/domain/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Facts, Notice, SectionHeading } from '@/components/ui/Feedback';
import { AttachmentList } from '@/components/domain/Attachments';
import { RecordNotFound } from '@/features/public/NotFoundPage';
import { budgetLabel, durationLabel, materialLabel, projectCategoryLabel, propertyTypeLabel, siteVisitLabel, startLabel } from '@/lib/labels';
import { formatDate } from '@/lib/format';
import { MatchChips } from './MatchChips';

/** Contractor view of a project brief. Owner contact details are never shown; contact happens in-app. */
export function LeadDetailPage() {
  const { projectId = '' } = useParams();
  const data = useData();
  const me = useActorId();
  const today = todayISO();
  const command = useCommand();
  const navigate = useNavigate();
  const project = data.projects[projectId];
  const profile = data.contractorProfiles[me];
  const quote = project ? (Object.values(data.quotes).find((q) => q.projectId === project.id && q.contractorId === me) ?? null) : null;
  const invited = project ? Boolean(data.invitations[invitationKey(me, project.id as ProjectId)]) : false;

  // Contractors can see a project they matched, were invited to, or already engaged with; never someone's draft.
  if (!project || !profile || project.status === 'draft') return <RecordNotFound what="lead" backTo="/contractor/leads" backLabel="Back to leads" />;
  const match = matchProject(profile, project, { invited, today });
  const engaged = Boolean(quote) || invited || Boolean(data.leadStates[leadKey(me, project.id as ProjectId)]);
  if (!match.eligible && !engaged) return <RecordNotFound what="lead" backTo="/contractor/leads" backLabel="Back to leads" />;

  const pid = project.id as ProjectId;
  const stage = pipelineStage(data, me, project, quote, today);
  const disposition = data.leadStates[leadKey(me, pid)]?.disposition ?? null;
  const open = isOpenForQuotes(project);
  const owner = data.users[project.ownerId];

  const startOrContinue = () => {
    if (quote) {
      navigate(quote.status === 'draft' || quote.status === 'revision_requested' || quote.status === 'withdrawn' ? `/contractor/leads/${pid}/quote` : `/contractor/quotes/${quote.id}`);
      return;
    }
    const r = command((s, c) => startQuote(s, pid, c));
    if (r.ok) navigate(`/contractor/leads/${pid}/quote`);
  };

  const ask = () => {
    const r = command((s, c) => ensureConversation(s, pid, me as UserId, c));
    if (r.ok) navigate(`/messages/${r.value}`);
  };

  const quoteLabel = !quote ? 'Start a quote' : quote.status === 'draft' ? 'Continue quote draft' : quote.status === 'revision_requested' ? 'Revise quote' : quote.status === 'withdrawn' ? 'Revise and resubmit' : 'View your quote';
  const quoteBlocked = !quote && !open;
  const notOpenReason = project.status === 'paused' ? 'The owner has paused this project, so it isn’t accepting quotes right now.' : 'This project is no longer accepting quotes.';

  return (
    <>
      <PageHeader
        title={project.title}
        crumbs={[{ label: 'Leads', to: '/contractor/leads' }, { label: project.title }]}
        meta={
          <>
            <StatusBadge kind="pipeline" status={stage.stage} />
            <StatusBadge kind="project" status={project.status} />
            <span>{projectCategoryLabel(project)}</span>
            <span>
              {project.location.locality}, {project.location.city}
            </span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" icon={<MessageSquare aria-hidden className="size-4" />} onClick={ask} disabled={!open && !Object.values(data.conversations).some((c) => c.projectId === pid && c.contractorId === me)}>
              Ask a question
            </Button>
            <Button variant="accent" icon={<FilePlus2 aria-hidden className="size-4" />} onClick={startOrContinue} disabled={quoteBlocked} aria-describedby={quoteBlocked ? 'quote-blocked' : undefined}>
              {quoteLabel}
            </Button>
          </>
        }
      />
      {quoteBlocked ? (
        <Notice id="quote-blocked" tone="warn" className="mb-6" title="Quotes are closed">
          {notOpenReason}
        </Notice>
      ) : null}
      {quote?.status === 'revision_requested' && quote.revisionRequest ? (
        <Notice tone="warn" className="mb-6" title={`The owner asked for a revision on ${formatDate(quote.revisionRequest.at)}`}>
          “{quote.revisionRequest.message}”
        </Notice>
      ) : null}
      {invited ? (
        <Notice tone="info" className="mb-6" title="You were invited to quote">
          The owner picked your profile for this project.
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-10 *:min-w-0 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          <section aria-labelledby="scope">
            <SectionHeading id="scope" title="Scope of work" />
            <p className="mt-3 whitespace-pre-line">{project.scope}</p>
            {project.scopeItems.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {project.scopeItems.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            ) : null}
          </section>
          <section aria-labelledby="details">
            <SectionHeading id="details" title="Site and schedule" />
            <Facts
              className="mt-3"
              items={[
                { label: 'Property', value: project.propertyType ? propertyTypeLabel[project.propertyType] : '—' },
                { label: 'Locality', value: `${project.location.locality}, ${project.location.city}${project.location.landmark ? ` (near ${project.location.landmark.replace(/^near\s+/i, '')})` : ''}` },
                { label: 'Budget', value: <span className="font-mono tabular">{budgetLabel(project.budget)}</span> },
                { label: 'Start', value: startLabel(project) },
                { label: 'Duration', value: durationLabel(project) },
                { label: 'Site visits', value: siteVisitLabel(project) },
                { label: 'Materials', value: project.materialResponsibility ? materialLabel[project.materialResponsibility] : '—' },
                { label: 'Owner’s notes', value: project.accessNotes || '—' },
              ]}
            />
          </section>
          <section aria-labelledby="files">
            <SectionHeading id="files" title="Photos & files" />
            <AttachmentList className="mt-3" files={project.attachments} empty="The owner didn’t attach any files." />
          </section>
        </div>
        <aside className="space-y-6" aria-label="Lead summary">
          <section aria-labelledby="why" className="border border-line bg-surface p-4">
            <h2 id="why" className="font-semibold">
              Why it matches
            </h2>
            <MatchChips className="mt-2" reasons={match.reasons} misses={match.misses} />
          </section>
          <section aria-labelledby="lead-facts">
            <h2 id="lead-facts" className="sr-only">
              Lead facts
            </h2>
            <Facts
              columns={1}
              items={[
                { label: 'Posted', value: project.publishedAt ? formatDate(project.publishedAt) : '—' },
                { label: 'Quotes so far', value: String(liveQuoteCount(data, pid)) },
                { label: 'Owner', value: owner ? owner.displayName.split(' ')[0] : 'Property owner' },
              ]}
            />
          </section>
          <section aria-label="Lead actions" className="flex flex-wrap gap-2">
            {disposition === 'ignored' ? (
              <Button variant="secondary" icon={<RotateCcw aria-hidden className="size-4" />} onClick={() => command((s, c) => setLeadDisposition(s, pid, null, c), { success: 'Lead restored to your feed.' })}>
                Restore to feed
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  aria-pressed={disposition === 'saved'}
                  icon={disposition === 'saved' ? <BookmarkCheck aria-hidden className="size-4 text-brick" /> : <Bookmark aria-hidden className="size-4" />}
                  onClick={() => command((s, c) => setLeadDisposition(s, pid, disposition === 'saved' ? null : 'saved', c), { success: disposition === 'saved' ? 'Removed from saved leads.' : 'Lead saved.' })}
                >
                  {disposition === 'saved' ? 'Saved' : 'Save lead'}
                </Button>
                {!quote ? (
                  <Button
                    variant="ghost"
                    icon={<EyeOff aria-hidden className="size-4" />}
                    onClick={() => {
                      const r = command((s, c) => setLeadDisposition(s, pid, 'ignored', c), {
                        success: 'Lead hidden from your feed.',
                        undo: { run: (prev) => command((s, c) => setLeadDisposition(s, pid, prev, c)) },
                      });
                      if (r.ok) navigate('/contractor/leads');
                    }}
                  >
                    Ignore
                  </Button>
                ) : null}
              </>
            )}
            <ButtonLink to="/contractor/leads" variant="ghost">
              Back to leads
            </ButtonLink>
          </section>
        </aside>
      </div>
    </>
  );
}
