import { useMemo } from 'react';
import { Outlet, useParams } from 'react-router';
import { MessageSquare } from 'lucide-react';
import { useActorId, useData } from '@/app/store/demoStore';
import { currentAgreement, isParticipant, workspaceMilestones, workspaceProgress } from '@/domain/workspace/selectors';
import { partyName } from '@/domain/messages/selectors';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Feedback';
import { TabNav } from '@/components/ui/Controls';
import { RecordNotFound } from '@/features/public/NotFoundPage';
import { formatDate, formatMoney } from '@/lib/format';
import type { WorkspaceContext } from './context';

/** Shared project workspace shell: same record for both parties, with role-specific actions inside each tab. */
export function WorkspaceLayout() {
  const { workspaceId = '' } = useParams();
  const data = useData();
  const me = useActorId();
  const ws = data.workspaces[workspaceId];
  const project = ws ? data.projects[ws.projectId] : undefined;
  const milestones = useMemo(() => (ws ? workspaceMilestones(data, ws.id) : []), [data, ws]);

  if (!ws || !project) return <RecordNotFound what="workspace" backTo="/workspace" backLabel="All workspaces" />;
  if (!isParticipant(ws, me)) {
    return (
      <section className="py-10">
        <p className="eyebrow">Not part of this project</p>
        <h1 className="mt-2 text-2xl font-semibold">You’re not part of this project</h1>
        <p className="mt-2 max-w-lg text-ink-2">Only the property owner and the contractor whose quote was accepted can open this workspace. (In this demo this is a convenience check, not a security control.)</p>
        <ButtonLink to="/workspace" className="mt-5">
          My workspaces
        </ButtonLink>
      </section>
    );
  }
  const role = me === ws.ownerId ? 'owner' : 'contractor';
  const agreement = currentAgreement(ws);
  const progress = workspaceProgress(milestones);
  const counterpart = role === 'owner' ? partyName(data, ws.contractorId) : partyName(data, ws.ownerId);
  const conversation = Object.values(data.conversations).find((c) => c.projectId === project.id && c.contractorId === ws.contractorId);
  const base = `/workspace/${ws.id}`;
  const openChanges = Object.values(data.changeRequests).filter((c) => c.workspaceId === ws.id && c.status === 'proposed').length;
  const awaiting = milestones.filter((m) => m.status === 'submitted').length;

  return (
    <>
      <PageHeader
        title={project.title}
        crumbs={[{ label: 'Workspaces', to: '/workspace' }, { label: project.title }]}
        meta={
          <>
            <StatusBadge kind="workspace" status={ws.status} />
            <StatusBadge kind="project" status={project.status} />
            <span>
              {role === 'owner' ? 'Contractor' : 'Owner'}: <strong className="font-semibold">{counterpart}</strong>
            </span>
            <span className="font-mono tabular">Agreed {formatMoney(agreement.totalPaise)}</span>
            <span>
              {formatDate(agreement.startDate)} – {formatDate(agreement.endDate)}
            </span>
          </>
        }
        actions={
          conversation ? (
            <ButtonLink to={`/messages/${conversation.id}`} variant="secondary" icon={<MessageSquare aria-hidden className="size-4" />}>
              Messages
            </ButtonLink>
          ) : null
        }
      >
        <ProgressBar value={progress} label="Agreed progress" className="max-w-md" />
        <p className="-mt-1 text-xs text-ink-3">Progress counts approved milestones in full and milestones awaiting approval at half their share.</p>
      </PageHeader>
      <TabNav
        label="Workspace sections"
        className="mb-6"
        items={[
          { to: base, label: 'Overview' },
          { to: `${base}/milestones`, label: 'Milestones', count: awaiting || undefined },
          { to: `${base}/updates`, label: 'Site updates' },
          { to: `${base}/documents`, label: 'Documents' },
          { to: `${base}/changes`, label: 'Changes', count: openChanges || undefined },
          { to: `${base}/activity`, label: 'Activity' },
          ...(ws.status === 'completed' ? [{ to: `${base}/review`, label: 'Review' }] : []),
        ]}
      />
      <Outlet context={{ ws, project, me, role, data } satisfies WorkspaceContext} />
    </>
  );
}
