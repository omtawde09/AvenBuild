import { useMemo } from 'react';
import { FolderOpen, LayoutGrid, List, Plus } from 'lucide-react';
import { useActorId, useData } from '@/app/store/demoStore';
import { ownerProjects, PROJECT_GROUPS } from '@/domain/projects/selectors';
import { PROJECT_STATUSES, projectStatusMeta, type ProjectStatus } from '@/domain/status';
import { categoryLabel } from '@/data/categories';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { InlineSelect } from '@/components/ui/Field';
import { SegmentedControl } from '@/components/ui/Controls';
import { ListToolbar, type ActiveFilter } from '@/components/ui/ListToolbar';
import { pickEnum, useUrlState } from '@/lib/useUrlState';
import { ProjectRow } from './ProjectRow';

const GROUP_VALUES = ['all', ...PROJECT_GROUPS.map((g) => g.value)] as const;
type Group = (typeof GROUP_VALUES)[number];
const SORTS = ['updated', 'title', 'budget'] as const;

const defaults = { q: '', group: 'all' as Group, status: '', sort: 'updated' as (typeof SORTS)[number], view: 'list' as 'list' | 'cards' };

export function MyProjectsPage() {
  const data = useData();
  const me = useActorId();
  const [f, update, reset] = useUrlState(defaults, (raw) => ({
    ...(raw.q !== undefined ? { q: raw.q } : {}),
    ...(pickEnum(raw.group, GROUP_VALUES) ? { group: pickEnum(raw.group, GROUP_VALUES) } : {}),
    ...(pickEnum(raw.status, PROJECT_STATUSES) ? { status: raw.status } : {}),
    ...(pickEnum(raw.sort, SORTS) ? { sort: pickEnum(raw.sort, SORTS) } : {}),
    ...(pickEnum(raw.view, ['list', 'cards'] as const) ? { view: pickEnum(raw.view, ['list', 'cards'] as const) } : {}),
  }));

  const all = useMemo(() => ownerProjects(data, me), [data, me]);
  const groupCounts = useMemo(
    () => Object.fromEntries(PROJECT_GROUPS.map((g) => [g.value, all.filter((p) => g.statuses.includes(p.status)).length])),
    [all],
  );
  const visible = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const group = PROJECT_GROUPS.find((g) => g.value === f.group);
    const rows = all.filter((p) => {
      if (group && !group.statuses.includes(p.status)) return false;
      if (f.status && p.status !== f.status) return false;
      if (q) {
        const hay = [p.title, p.scope, p.location.locality, p.location.city, p.category ? categoryLabel(p.category) : ''].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const mid = (p: (typeof rows)[number]) => (p.budget.kind === 'range' ? p.budget.maxPaise : -1);
    if (f.sort === 'title') rows.sort((a, b) => (a.title || '~').localeCompare(b.title || '~'));
    if (f.sort === 'budget') rows.sort((a, b) => mid(b) - mid(a));
    return rows;
  }, [all, f]);

  const statusOptions = [{ value: '', label: 'Any status' }, ...PROJECT_STATUSES.map((s) => ({ value: s, label: projectStatusMeta[s].label }))];
  const activeFilters: ActiveFilter[] = [
    ...(f.status ? [{ key: 'status', label: `Status: ${projectStatusMeta[f.status as ProjectStatus].label}`, clear: () => update({ status: '' }) }] : []),
    ...(f.q ? [{ key: 'q', label: `“${f.q}”`, clear: () => update({ q: '' }) }] : []),
  ];

  return (
    <>
      <PageHeader
        title="My projects"
        crumbs={[{ label: 'Home', to: '/owner' }, { label: 'Projects' }]}
        actions={
          <ButtonLink to="/owner/projects/new" icon={<Plus aria-hidden className="size-4" />}>
            Post a project
          </ButtonLink>
        }
      />
      <SegmentedControl
        label="Project group"
        className="mb-4 max-w-full overflow-x-auto"
        value={f.group}
        onChange={(group) => update({ group })}
        options={[{ value: 'all', label: 'All', count: all.length }, ...PROJECT_GROUPS.map((g) => ({ value: g.value, label: g.label, count: groupCounts[g.value] ?? 0 }))]}
      />
      <ListToolbar
        query={f.q}
        onQuery={(q) => update({ q })}
        searchLabel="Search your projects"
        placeholder="Search by title, scope or locality"
        filters={<InlineSelect aria-label="Filter by status" value={f.status} onChange={(e) => update({ status: e.target.value })} options={statusOptions} />}
        sort={
          <div className="flex items-center gap-2">
            <InlineSelect
              aria-label="Sort projects"
              value={f.sort}
              onChange={(e) => update({ sort: pickEnum(e.target.value, SORTS) ?? 'updated' })}
              options={[
                { value: 'updated', label: 'Recently updated' },
                { value: 'title', label: 'Title A–Z' },
                { value: 'budget', label: 'Highest budget' },
              ]}
            />
            <div className="hidden sm:flex" role="group" aria-label="Layout">
              <Button variant={f.view === 'list' ? 'primary' : 'secondary'} className="rounded-r-none px-3" aria-pressed={f.view === 'list'} aria-label="List layout" onClick={() => update({ view: 'list' })}>
                <List aria-hidden className="size-4" />
              </Button>
              <Button variant={f.view === 'cards' ? 'primary' : 'secondary'} className="rounded-l-none px-3" aria-pressed={f.view === 'cards'} aria-label="Card layout" onClick={() => update({ view: 'cards' })}>
                <LayoutGrid aria-hidden className="size-4" />
              </Button>
            </div>
          </div>
        }
        active={activeFilters}
        onClearAll={() => reset()}
        resultLabel={`${visible.length} of ${all.length} projects`}
      />
      {visible.length === 0 ? (
        all.length === 0 ? (
          <EmptyState icon={<FolderOpen />} title="You haven’t posted a project yet" action={<ButtonLink to="/owner/projects/new">Post a project</ButtonLink>}>
            Describe the work once; matching contractors can then send itemised quotes.
          </EmptyState>
        ) : (
          <EmptyState title="No projects match these filters" action={<Button variant="secondary" onClick={() => reset()}>Clear filters</Button>}>
            Try another status or search term.
          </EmptyState>
        )
      ) : f.view === 'cards' ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <li key={p.id}>
              <ProjectRow project={p} state={data} layout="card" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {visible.map((p) => (
            <li key={p.id}>
              <ProjectRow project={p} state={data} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
