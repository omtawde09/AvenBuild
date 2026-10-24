import { useMemo } from 'react';
import { Link } from 'react-router';
import { useActorId, useData, todayISO } from '@/app/store/demoStore';
import { contractorPipeline, type PipelineEntry } from '@/domain/leads/pipeline';
import { quoteTotal } from '@/domain/quotes/math';
import { PIPELINE_STAGES, pipelineStageMeta, type PipelineStage } from '@/domain/status';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { InlineSelect } from '@/components/ui/Field';
import { formatDate, formatMoney } from '@/lib/format';
import { pickEnum, useUrlState } from '@/lib/useUrlState';

const stageVerb: Record<PipelineStage, string> = {
  new: 'Posted',
  invited: 'Invited',
  saved: 'Saved',
  ignored: 'Ignored',
  quote_draft: 'Draft updated',
  submitted: 'Sent',
  revision_requested: 'Revision asked',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
  closed: 'Closed',
};

function entryLink(e: PipelineEntry): string {
  if (!e.quote) return `/contractor/leads/${e.project.id}`;
  if (e.stage === 'quote_draft' || e.stage === 'revision_requested') return `/contractor/leads/${e.project.id}/quote`;
  return `/contractor/quotes/${e.quote.id}`;
}

/** Every lead and quote by lifecycle stage, with the date of the event that set the stage. */
export function PipelinePage() {
  const data = useData();
  const me = useActorId();
  const today = todayISO();
  const [f, update] = useUrlState({ stage: '' }, (raw) => (pickEnum(raw.stage, PIPELINE_STAGES) ? { stage: raw.stage } : {}));
  const all = useMemo(() => contractorPipeline(data, me, today), [data, me, today]);
  const counts = useMemo(() => Object.fromEntries(PIPELINE_STAGES.map((s) => [s, all.filter((e) => e.stage === s).length])), [all]);
  const visible = f.stage ? all.filter((e) => e.stage === f.stage) : all;

  return (
    <>
      <PageHeader title="Quotes & pipeline" crumbs={[{ label: 'Home', to: '/contractor' }, { label: 'Quotes' }]} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <InlineSelect
          aria-label="Filter by stage"
          value={f.stage}
          onChange={(e) => update({ stage: e.target.value })}
          options={[{ value: '', label: `All stages (${all.length})` }, ...PIPELINE_STAGES.filter((s) => s !== 'new').map((s) => ({ value: s, label: `${pipelineStageMeta[s].label} (${counts[s] ?? 0})` }))]}
        />
        <p className="text-sm text-ink-2">{visible.length} shown</p>
      </div>
      <ul className="mb-6 flex flex-wrap gap-2" aria-label="Stage summary">
        {PIPELINE_STAGES.filter((s) => (counts[s] ?? 0) > 0).map((s) => (
          <li key={s}>
            <button type="button" onClick={() => update({ stage: f.stage === s ? '' : s })} aria-pressed={f.stage === s} className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-line-strong bg-surface px-2.5 text-sm hover:bg-sunken aria-pressed:border-ink aria-pressed:bg-sunken">
              {pipelineStageMeta[s].label}
              <span className="font-mono text-xs text-ink-3 tabular">{counts[s]}</span>
            </button>
          </li>
        ))}
      </ul>
      {visible.length ? (
        <>
          <ul className="divide-y divide-line border-y border-line md:hidden">
            {visible.map((e) => {
              const total = e.quote && e.quote.status !== 'draft' ? quoteTotal(e.quote.content) : null;
              return (
                <li key={e.project.id}>
                  <Link to={entryLink(e)} className="block px-1 py-3 hover:bg-surface">
                    <span className="flex items-center justify-between gap-2">
                      <StatusBadge kind="pipeline" status={e.stage} />
                      <span className="font-mono text-sm tabular">{total !== null ? formatMoney(total) : ''}</span>
                    </span>
                    <span className="mt-1 block font-semibold">{e.project.title}</span>
                    <span className="block text-sm text-ink-3">
                      {stageVerb[e.stage]} {formatDate(e.stageAt)}
                      {e.expired ? ' · price expired' : ''}
                      {e.quote ? ` · revision ${e.quote.revision}` : ''}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <table className="hidden w-full text-sm md:table">
            <caption className="sr-only">Pipeline</caption>
            <thead>
              <tr className="border-y border-line-strong text-left text-xs tracking-wide text-ink-3 uppercase">
                <th scope="col" className="py-2 pr-3 font-semibold">Project</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Stage</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Last event</th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold">Quote total</th>
                <th scope="col" className="py-2 font-semibold"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => {
                const total = e.quote && e.quote.status !== 'draft' ? quoteTotal(e.quote.content) : null;
                return (
                  <tr key={e.project.id} className="border-b border-line">
                    <td className="py-3 pr-3">
                      <span className="block font-medium">{e.project.title}</span>
                      <span className="text-ink-3">
                        {e.project.location.locality}, {e.project.location.city}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge kind="pipeline" status={e.stage} />
                      {e.expired ? <span className="mt-1 block text-xs text-warn">Price expired</span> : null}
                    </td>
                    <td className="py-3 pr-3 text-ink-2">
                      {stageVerb[e.stage]} {formatDate(e.stageAt)}
                    </td>
                    <td className="py-3 pr-3 text-right font-mono tabular">{total !== null ? formatMoney(total) : '—'}</td>
                    <td className="py-3 text-right">
                      <Link to={entryLink(e)} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2">
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : f.stage ? (
        <EmptyState title={`Nothing in “${pipelineStageMeta[f.stage as PipelineStage].label}”`} action={<Button variant="secondary" onClick={() => update({ stage: '' })}>Show all stages</Button>} />
      ) : (
        <EmptyState title="Your pipeline is empty" action={<ButtonLink to="/contractor/leads">Browse leads</ButtonLink>}>
          Save a lead or start a quote and it will be tracked here.
        </EmptyState>
      )}
    </>
  );
}
