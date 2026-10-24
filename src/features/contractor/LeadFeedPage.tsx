import { useMemo } from 'react';
import { Link } from 'react-router';
import { Bookmark, BookmarkCheck, CalendarDays, EyeOff, MapPin, RotateCcw } from 'lucide-react';
import { useActorId, useData, todayISO } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import type { ProjectId } from '@/domain/ids';
import { setLeadDisposition } from '@/domain/leads/commands';
import { pipelineStage } from '@/domain/leads/pipeline';
import { BUDGET_BANDS, buildLeadRows, defaultLeadFilters, filterLeads, type LeadRow, type LeadSort, type LeadView } from '@/domain/matching/filters';
import { SERVICE_CATEGORY_IDS, categoryLabel } from '@/data/categories';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { InlineSelect } from '@/components/ui/Field';
import { TabStrip } from '@/components/ui/Controls';
import { ListToolbar, type ActiveFilter } from '@/components/ui/ListToolbar';
import { budgetLabel, startLabel } from '@/lib/labels';
import { formatRelative } from '@/lib/format';
import { pickEnum, useUrlState } from '@/lib/useUrlState';

const VIEWS = ['matched', 'saved', 'ignored'] as const;
const SORTS = ['newest', 'start_soonest', 'budget_high', 'budget_low', 'fewest_quotes'] as const;
const BANDS = BUDGET_BANDS.map((b) => b.value);
const defaults = { view: 'matched' as LeadView, q: '', category: '', city: '', budget: '', within: '0', sort: 'newest' as LeadSort };

function LeadItem({ row }: { row: LeadRow }) {
  const data = useData();
  const me = useActorId();
  const today = todayISO();
  const command = useCommand();
  const p = row.project;
  const pid = p.id as ProjectId;
  const quote = Object.values(data.quotes).find((q) => q.projectId === p.id && q.contractorId === me) ?? null;
  const stage = pipelineStage(data, me, p, quote, today).stage;

  const setDisposition = (d: 'saved' | 'ignored' | null, message: string) =>
    command((s, c) => setLeadDisposition(s, pid, d, c), {
      success: message,
      undo: { run: (previous) => command((s, c) => setLeadDisposition(s, pid, previous, c)) },
    });

  return (
    <li className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:px-2">
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="pipeline" status={stage} />
          <StatusBadge kind="project" status={p.status} />
        </div>
        <Link to={`/contractor/leads/${p.id}`} className="block text-lg leading-snug font-semibold underline-offset-2 hover:underline">
          {p.title}
        </Link>
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-2">
          <span>{p.category ? categoryLabel(p.category) : ''}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden className="size-3.5" />
            {p.location.locality}, {p.location.city}
          </span>
          <span className="font-mono tabular">{budgetLabel(p.budget)}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays aria-hidden className="size-3.5" />
            {startLabel(p)}
          </span>
        </p>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ok" aria-label="Why this lead matches">
          {row.match.reasons.map((r) => (
            <li key={r.label}>✓ {r.label}</li>
          ))}
          {row.match.misses
            .filter((m) => m.kind === 'budget' || m.kind === 'timing')
            .map((m) => (
              <li key={m.label} className="text-warn">
                ! {m.label}
              </li>
            ))}
        </ul>
        <p className="text-xs text-ink-3">
          Posted {p.publishedAt ? formatRelative(p.publishedAt) : ''} · {row.quoteCount} {row.quoteCount === 1 ? 'quote' : 'quotes'} so far
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-2 sm:flex-col sm:items-end">
        <ButtonLink to={`/contractor/leads/${p.id}`} size="sm">
          View lead
        </ButtonLink>
        {row.disposition === 'ignored' ? (
          <Button size="sm" variant="secondary" icon={<RotateCcw aria-hidden className="size-4" />} onClick={() => setDisposition(null, 'Lead restored to your feed.')}>
            Restore
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="secondary"
              aria-pressed={row.disposition === 'saved'}
              icon={row.disposition === 'saved' ? <BookmarkCheck aria-hidden className="size-4 text-brick" /> : <Bookmark aria-hidden className="size-4" />}
              onClick={() => setDisposition(row.disposition === 'saved' ? null : 'saved', row.disposition === 'saved' ? 'Removed from saved leads.' : 'Lead saved.')}
            >
              {row.disposition === 'saved' ? 'Saved' : 'Save'}
            </Button>
            {!quote ? (
              <Button size="sm" variant="ghost" icon={<EyeOff aria-hidden className="size-4" />} onClick={() => setDisposition('ignored', 'Lead hidden. Find it under “Ignored”.')}>
                Ignore
              </Button>
            ) : null}
          </>
        )}
      </div>
    </li>
  );
}

export function LeadFeedPage() {
  const data = useData();
  const me = useActorId();
  const today = todayISO();
  const profile = data.contractorProfiles[me];
  const [f, update] = useUrlState(defaults, (raw) => ({
    ...(pickEnum(raw.view, VIEWS) ? { view: pickEnum(raw.view, VIEWS) } : {}),
    ...(raw.q !== undefined ? { q: raw.q } : {}),
    ...(pickEnum(raw.category, SERVICE_CATEGORY_IDS) ? { category: raw.category } : {}),
    ...(raw.city ? { city: raw.city } : {}),
    ...(pickEnum(raw.budget, BANDS) ? { budget: raw.budget } : {}),
    ...(pickEnum(raw.within, ['30', '60', '90'] as const) ? { within: raw.within } : {}),
    ...(pickEnum(raw.sort, SORTS) ? { sort: pickEnum(raw.sort, SORTS) } : {}),
  }));

  const rows = useMemo(() => buildLeadRows(data, me, today), [data, me, today]);
  const visible = useMemo(
    () =>
      filterLeads(
        rows,
        {
          view: f.view,
          query: f.q,
          category: pickEnum(f.category, SERVICE_CATEGORY_IDS) ?? '',
          city: f.city,
          budget: pickEnum(f.budget, BANDS) ?? '',
          startWithinDays: Number(f.within) as 0 | 30 | 60 | 90,
          sort: f.sort,
        },
        today,
      ),
    [rows, f, today],
  );
  const counts = useMemo(() => Object.fromEntries(VIEWS.map((v) => [v, filterLeads(rows, { ...defaultLeadFilters, view: v }, today).length])), [rows, today]);

  const myCategories = profile?.services ?? [];
  const myCities = profile?.serviceAreas.map((a) => a.city) ?? [];
  const active: ActiveFilter[] = [
    ...(f.q ? [{ key: 'q', label: `“${f.q}”`, clear: () => update({ q: '' }) }] : []),
    ...(f.category ? [{ key: 'category', label: categoryLabel(f.category as (typeof SERVICE_CATEGORY_IDS)[number]), clear: () => update({ category: '' }) }] : []),
    ...(f.city ? [{ key: 'city', label: f.city, clear: () => update({ city: '' }) }] : []),
    ...(f.budget ? [{ key: 'budget', label: BUDGET_BANDS.find((b) => b.value === f.budget)?.label ?? '', clear: () => update({ budget: '' }) }] : []),
    ...(f.within !== '0' ? [{ key: 'within', label: `Starts within ${f.within} days`, clear: () => update({ within: '0' }) }] : []),
  ];
  const clearFilters = () => update({ q: '', category: '', city: '', budget: '', within: '0' });

  const filterControls = (
    <>
      <InlineSelect aria-label="Service" value={f.category} onChange={(e) => update({ category: e.target.value })} options={[{ value: '', label: 'All my services' }, ...myCategories.map((c) => ({ value: c, label: categoryLabel(c) }))]} className="w-full lg:w-auto" />
      <InlineSelect aria-label="City" value={f.city} onChange={(e) => update({ city: e.target.value })} options={[{ value: '', label: 'All my areas' }, ...myCities.map((c) => ({ value: c, label: c }))]} className="w-full lg:w-auto" />
      <InlineSelect aria-label="Budget" value={f.budget} onChange={(e) => update({ budget: e.target.value })} options={[{ value: '', label: 'Any budget' }, ...BUDGET_BANDS.map((b) => ({ value: b.value, label: b.label }))]} className="w-full lg:w-auto" />
      <InlineSelect
        aria-label="Start timing"
        value={f.within}
        onChange={(e) => update({ within: e.target.value })}
        options={[
          { value: '0', label: 'Any start date' },
          { value: '30', label: 'Starts within 30 days' },
          { value: '60', label: 'Starts within 60 days' },
          { value: '90', label: 'Starts within 90 days' },
        ]}
        className="w-full lg:w-auto"
      />
    </>
  );

  return (
    <>
      <PageHeader
        title="Leads"
        crumbs={[{ label: 'Home', to: '/contractor' }, { label: 'Leads' }]}
        meta={<span>Open projects that match your services and service areas. Matching is rule-based — the reasons are shown on each lead.</span>}
      />
      <TabStrip
        label="Lead views"
        className="mb-4"
        value={f.view}
        onChange={(view) => update({ view })}
        items={[
          { value: 'matched', label: 'Matched', count: counts.matched ?? 0 },
          { value: 'saved', label: 'Saved', count: counts.saved ?? 0 },
          { value: 'ignored', label: 'Ignored', count: counts.ignored ?? 0 },
        ]}
      />
      <ListToolbar
        query={f.q}
        onQuery={(q) => update({ q })}
        searchLabel="Search leads"
        placeholder="Search title, scope or locality"
        filters={filterControls}
        sort={
          <InlineSelect
            aria-label="Sort leads"
            value={f.sort}
            onChange={(e) => update({ sort: pickEnum(e.target.value, SORTS) ?? 'newest' })}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'start_soonest', label: 'Starting soonest' },
              { value: 'budget_high', label: 'Budget: high to low' },
              { value: 'budget_low', label: 'Budget: low to high' },
              { value: 'fewest_quotes', label: 'Fewest quotes' },
            ]}
          />
        }
        active={active}
        onClearAll={clearFilters}
        resultLabel={`${visible.length} ${visible.length === 1 ? 'lead' : 'leads'}`}
      />
      {visible.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {visible.map((r) => (
            <LeadItem key={r.project.id} row={r} />
          ))}
        </ul>
      ) : active.length ? (
        <EmptyState title="No leads match these filters" action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}>
          Active filters: {active.map((a) => a.label).join(', ')}.
        </EmptyState>
      ) : f.view === 'saved' ? (
        <EmptyState title="No saved leads" action={<Button variant="secondary" onClick={() => update({ view: 'matched' })}>Browse matched leads</Button>}>
          Save leads you want to come back to.
        </EmptyState>
      ) : f.view === 'ignored' ? (
        <EmptyState title="Nothing ignored">Leads you hide with “Ignore” appear here so you can restore them.</EmptyState>
      ) : (
        <EmptyState title="No matching leads right now" action={<ButtonLink to="/contractor/profile" variant="secondary">Edit services & areas</ButtonLink>}>
          Leads appear when owners publish projects in your trades and service areas. Adding services or cities widens your feed.
        </EmptyState>
      )}
    </>
  );
}
