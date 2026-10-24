import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Ban, CirclePause, CirclePlay, FileStack, HardHat, Lock, Pencil, Trash2 } from 'lucide-react';
import { useActorId, useData, todayISO } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import type { ProjectId } from '@/domain/ids';
import { canProject } from '@/domain/projects/machine';
import { cancelProject, closeProject, deleteDraft, pauseProject, reopenProject, restoreDraft } from '@/domain/projects/commands';
import { ownerVisibleQuotes } from '@/domain/projects/selectors';
import { effectiveQuoteStatus } from '@/domain/quotes/status';
import { quoteTotal } from '@/domain/quotes/math';
import { partyName } from '@/domain/messages/selectors';
import { projectActivity, workspaceForProject } from '@/domain/workspace/selectors';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { EmptyState, Facts, Notice, SectionHeading } from '@/components/ui/Feedback';
import { TextArea } from '@/components/ui/Field';
import { AttachmentList } from '@/components/domain/Attachments';
import { RecordNotFound } from '@/features/public/NotFoundPage';
import { budgetLabel, durationLabel, locationLabel, materialLabel, projectCategoryLabel, propertyTypeLabel, siteVisitLabel, startLabel } from '@/lib/labels';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';

type Dialogs = 'pause' | 'reopen' | 'close' | 'cancel' | 'delete' | null;

export function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const data = useData();
  const me = useActorId();
  const command = useCommand();
  const navigate = useNavigate();
  const today = todayISO();
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();
  const project = data.projects[projectId];
  const quotes = useMemo(() => (project ? ownerVisibleQuotes(data, project.id) : []), [data, project]);
  const activity = useMemo(() => (project ? projectActivity(data, project.id).slice(0, 8) : []), [data, project]);

  if (!project || project.ownerId !== me) return <RecordNotFound what="project" backTo="/owner/projects" backLabel="Back to my projects" />;
  const id = project.id as ProjectId;
  const ws = workspaceForProject(data, id);
  const invitations = Object.values(data.invitations).filter((i) => i.projectId === id);
  const can = (a: Parameters<typeof canProject>[1]) => canProject(project, a);
  const close = () => {
    setDialog(null);
    setReason('');
    setReasonError(undefined);
  };

  const editable = project.status === 'draft' || can('edit_published').ok;

  return (
    <>
      <PageHeader
        title={project.title || 'Untitled draft'}
        crumbs={[{ label: 'Projects', to: '/owner/projects' }, { label: project.title || 'Draft' }]}
        meta={
          <>
            <StatusBadge kind="project" status={project.status} />
            <span>{projectCategoryLabel(project)}</span>
            <span>{locationLabel(project)}</span>
            {project.publishedAt ? <span>Published {formatDate(project.publishedAt)}</span> : <span>Not published</span>}
          </>
        }
        actions={
          <>
            {ws ? (
              <ButtonLink to={`/workspace/${ws.id}`} icon={<HardHat aria-hidden className="size-4" />}>
                Open workspace
              </ButtonLink>
            ) : null}
            {editable ? (
              <ButtonLink to={`/owner/projects/${id}/edit`} variant={ws ? 'secondary' : 'primary'} icon={<Pencil aria-hidden className="size-4" />}>
                {project.status === 'draft' ? 'Continue draft' : 'Edit details'}
              </ButtonLink>
            ) : null}
          </>
        }
      />

      {project.status === 'paused' ? (
        <Notice tone="warn" className="mb-6" title="This project is paused">
          Contractors can’t see it in their lead feed and quotes can’t be accepted. Reopen it to continue.
        </Notice>
      ) : null}
      {project.closedReason && (project.status === 'closed' || project.status === 'cancelled') ? (
        <Notice tone="info" className="mb-6" title={project.status === 'closed' ? 'Closed' : 'Cancelled'}>
          {project.closedReason}
          {project.closedAt ? ` · ${formatDate(project.closedAt)}` : ''}
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-10 *:min-w-0 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-10">
          <section aria-labelledby="quotes-heading">
            <SectionHeading
              id="quotes-heading"
              title={`Quotes (${quotes.length})`}
              action={
                quotes.length ? (
                  <div className="flex flex-wrap gap-2">
                    {quotes.length >= 2 ? (
                      <ButtonLink to={`/owner/projects/${id}/compare?ids=${quotes.slice(0, 4).map((q) => q.id).join(',')}`} size="sm" variant="secondary" icon={<FileStack aria-hidden className="size-4" />}>
                        Compare
                      </ButtonLink>
                    ) : null}
                    <ButtonLink to={`/owner/projects/${id}/quotes`} size="sm">
                      All quotes
                    </ButtonLink>
                  </div>
                ) : null
              }
            />
            {quotes.length ? (
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {quotes.map((q) => {
                  const total = quoteTotal(q.content);
                  return (
                    <li key={q.id}>
                      <Link to={`/owner/projects/${id}/quotes/${q.id}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 py-3 hover:bg-surface sm:px-3">
                        <span className="min-w-0">
                          <span className="block font-semibold">{partyName(data, q.contractorId)}</span>
                          <span className="block text-sm text-ink-3">
                            Revision {q.revision} · sent {q.submittedAt ? formatDate(q.submittedAt) : '—'} · valid to {formatDate(q.content.validUntil)}
                          </span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="font-mono font-semibold tabular">{total !== null ? formatMoney(total) : '—'}</span>
                          <StatusBadge kind="quote" status={effectiveQuoteStatus(q, today)} />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                className="mt-3"
                title={project.status === 'draft' ? 'Publish to receive quotes' : 'No quotes yet'}
                action={
                  project.status === 'draft' ? (
                    <ButtonLink to={`/owner/projects/${id}/edit`}>Continue draft</ButtonLink>
                  ) : can('accept_quotes').ok ? (
                    <ButtonLink to={`/owner/contractors?category=${project.category ?? ''}&city=${encodeURIComponent(project.location.city)}`} variant="secondary">
                      Invite contractors
                    </ButtonLink>
                  ) : null
                }
              >
                {project.status === 'draft'
                  ? 'Drafts are private. Once published, matching contractors can send itemised quotes.'
                  : 'Matching contractors have been notified. You can also invite specific contractors to quote.'}
              </EmptyState>
            )}
            {invitations.length ? (
              <p className="mt-3 text-sm text-ink-2">
                Invited: {invitations.map((i) => partyName(data, i.contractorId)).join(', ')}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="brief-heading">
            <SectionHeading id="brief-heading" title="Brief" />
            <p className="mt-3 whitespace-pre-line">{project.scope || <span className="text-ink-3">No description yet.</span>}</p>
            {project.scopeItems.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {project.scopeItems.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            ) : null}
            <Facts
              className="mt-5"
              items={[
                { label: 'Property', value: project.propertyType ? propertyTypeLabel[project.propertyType] : '—' },
                { label: 'Budget', value: <span className="font-mono tabular">{budgetLabel(project.budget)}</span> },
                { label: 'Start', value: startLabel(project) },
                { label: 'Duration', value: durationLabel(project) },
                { label: 'Site visits', value: siteVisitLabel(project) },
                { label: 'Materials', value: project.materialResponsibility ? materialLabel[project.materialResponsibility] : '—' },
                { label: 'Landmark', value: project.location.landmark || '—' },
                { label: 'Access notes', value: project.accessNotes || '—' },
              ]}
            />
            <h3 className="mt-6 mb-2 text-sm font-semibold">Photos & files</h3>
            <AttachmentList files={project.attachments} />
          </section>
        </div>

        <aside className="space-y-8" aria-label="Project actions and activity">
          <section aria-labelledby="manage-heading" className="border border-line bg-surface p-4">
            <h2 id="manage-heading" className="font-semibold">
              Manage project
            </h2>
            <ul className="mt-3 space-y-2">
              {project.status === 'draft' ? (
                <li>
                  <Button variant="danger" className="w-full justify-start" icon={<Trash2 aria-hidden className="size-4" />} onClick={() => setDialog('delete')}>
                    Delete draft
                  </Button>
                </li>
              ) : null}
              {can('pause').ok ? (
                <li>
                  <Button variant="secondary" className="w-full justify-start" icon={<CirclePause aria-hidden className="size-4" />} onClick={() => setDialog('pause')}>
                    Pause (hide from contractors)
                  </Button>
                </li>
              ) : null}
              {can('reopen').ok ? (
                <li>
                  <Button className="w-full justify-start" icon={<CirclePlay aria-hidden className="size-4" />} onClick={() => setDialog('reopen')}>
                    Reopen for quotes
                  </Button>
                </li>
              ) : null}
              {can('close').ok && project.status !== 'draft' ? (
                <li>
                  <Button variant="secondary" className="w-full justify-start" icon={<Lock aria-hidden className="size-4" />} onClick={() => setDialog('close')}>
                    Close without hiring
                  </Button>
                </li>
              ) : null}
              {can('cancel').ok ? (
                <li>
                  <Button variant="danger" className="w-full justify-start" icon={<Ban aria-hidden className="size-4" />} onClick={() => setDialog('cancel')}>
                    Cancel project
                  </Button>
                </li>
              ) : null}
            </ul>
            {!editable && !can('cancel').ok && project.status !== 'draft' ? <p className="mt-2 text-sm text-ink-3">This project is finished, so there’s nothing left to manage.</p> : null}
            {project.status !== 'draft' && !editable ? null : (
              <p className="mt-3 text-xs text-ink-3">Category, city and budget are fixed after publishing because quotes depend on them.</p>
            )}
          </section>

          <section aria-labelledby="activity-heading">
            <SectionHeading id="activity-heading" title="Activity" />
            {activity.length ? (
              <ol className="mt-3 space-y-3 border-l border-line-strong pl-4">
                {activity.map((a) => (
                  <li key={a.id} className="text-sm">
                    <p>{a.summary}</p>
                    <p className="text-xs text-ink-3">{formatDateTime(a.at)}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-ink-3">Events such as publishing and incoming quotes are logged here.</p>
            )}
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={dialog === 'pause'}
        title="Pause this project?"
        body="It will disappear from contractors’ lead feeds and no quote can be accepted until you reopen it. Existing quotes are kept."
        confirmLabel="Pause project"
        onCancel={close}
        onConfirm={() => {
          close();
          command((s, c) => pauseProject(s, id, c), { success: 'Project paused.', undo: { run: () => command((s, c) => reopenProject(s, id, c), { success: 'Project reopened.' }) } });
        }}
      />
      <ConfirmDialog
        open={dialog === 'reopen'}
        title="Reopen this project?"
        body="Matching contractors will see it again and you can accept quotes."
        confirmLabel="Reopen"
        onCancel={close}
        onConfirm={() => {
          close();
          command((s, c) => reopenProject(s, id, c), { success: 'Project reopened.' });
        }}
      />
      <ConfirmDialog
        open={dialog === 'close'}
        title="Close without hiring?"
        body="Contractors with open quotes will be told the project is closed. This can’t be undone — post a new project if you change your mind."
        confirmLabel="Close project"
        tone="danger"
        onCancel={close}
        onConfirm={() => {
          close();
          command((s, c) => closeProject(s, id, reason, c), { success: 'Project closed.' });
        }}
      >
        <TextArea label="Reason" optional rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'cancel'}
        title="Cancel this project?"
        body={ws ? 'Work in progress will stop and the contractor will be notified. The workspace becomes read-only. This can’t be undone.' : 'Contractors with open quotes will be notified. This can’t be undone.'}
        confirmLabel="Cancel project"
        cancelLabel="Keep project"
        tone="danger"
        onCancel={close}
        onConfirm={() => {
          const r = command((s, c) => cancelProject(s, id, reason, c), { success: 'Project cancelled.', quietValidation: true });
          if (!r.ok && r.error.fieldErrors?.reason) setReasonError(r.error.fieldErrors.reason);
          else close();
        }}
      >
        <TextArea label="Reason" required rows={3} value={reason} error={reasonError} onChange={(e) => setReason(e.target.value)} description={ws ? 'Shared with the contractor.' : undefined} />
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'delete'}
        title="Delete this draft?"
        body="The draft has never been visible to contractors. You can undo for a few seconds after deleting."
        confirmLabel="Delete draft"
        tone="danger"
        onCancel={close}
        onConfirm={() => {
          close();
          const r = command((s, c) => deleteDraft(s, id, c), {
            success: 'Draft deleted.',
            undo: {
              run: (removed) => {
                const back = command((s, c) => restoreDraft(s, removed, c), { success: 'Draft restored.' });
                if (back.ok) navigate(`/owner/projects/${removed.id}`);
              },
            },
          });
          if (r.ok) navigate('/owner/projects');
        }}
      />
    </>
  );
}
