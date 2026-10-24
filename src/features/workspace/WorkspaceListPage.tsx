import { useMemo } from 'react';
import { Link } from 'react-router';
import { HardHat } from 'lucide-react';
import { useActorId, useData } from '@/app/store/demoStore';
import { currentAgreement, workspaceMilestones, workspaceProgress } from '@/domain/workspace/selectors';
import { partyName } from '@/domain/messages/selectors';
import { useActiveRole } from '@/app/store/demoStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState, ProgressBar } from '@/components/ui/Feedback';
import { formatDate, formatMoney } from '@/lib/format';

export function WorkspaceListPage() {
  const data = useData();
  const me = useActorId();
  const role = useActiveRole();
  const list = useMemo(
    () =>
      Object.values(data.workspaces)
        .filter((w) => w.ownerId === me || w.contractorId === me)
        .sort((a, b) => (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1) || b.createdAt.localeCompare(a.createdAt)),
    [data, me],
  );
  return (
    <>
      <PageHeader title="Workspaces" crumbs={[{ label: 'Home', to: role === 'owner' ? '/owner' : '/contractor' }, { label: 'Workspaces' }]} />
      {list.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {list.map((w) => {
            const p = data.projects[w.projectId];
            const a = currentAgreement(w);
            const progress = workspaceProgress(workspaceMilestones(data, w.id));
            return (
              <li key={w.id}>
                <Link to={`/workspace/${w.id}`} className="group grid gap-2 px-1 py-4 hover:bg-surface sm:grid-cols-[1fr_16rem] sm:items-center sm:px-3">
                  <span className="min-w-0 space-y-1">
                    <StatusBadge kind="workspace" status={w.status} />
                    <span className="block font-semibold group-hover:underline group-hover:underline-offset-2">{p?.title}</span>
                    <span className="block text-sm text-ink-2">
                      With {partyName(data, me === w.ownerId ? w.contractorId : w.ownerId)} · <span className="font-mono tabular">{formatMoney(a.totalPaise)}</span> · {formatDate(a.startDate)} – {formatDate(a.endDate)}
                    </span>
                  </span>
                  <ProgressBar value={progress} label={`Agreed progress for ${p?.title ?? 'project'}`} />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={<HardHat />} title="No workspaces yet" action={role === 'owner' ? <ButtonLink to="/owner/projects">My projects</ButtonLink> : <ButtonLink to="/contractor/leads">Find leads</ButtonLink>}>
          {role === 'owner' ? 'Accept a quote on one of your projects to start a shared workspace.' : 'When an owner accepts one of your quotes, the shared workspace appears here.'}
        </EmptyState>
      )}
    </>
  );
}
