import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CircleCheckBig } from 'lucide-react';
import { useCommand } from '@/app/store/useCommand';
import type { WorkspaceId } from '@/domain/ids';
import { completeProject } from '@/domain/workspace/commands';
import { workspaceMilestones } from '@/domain/workspace/selectors';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { useWorkspace } from './context';

/** Shows what's left before completion; lets the owner complete once every milestone is approved. */
export function CompleteProjectPanel() {
  const { ws, project, data, role } = useWorkspace();
  const command = useCommand();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const milestones = workspaceMilestones(data, ws.id);
  const remaining = milestones.filter((m) => m.status !== 'approved');
  const openChange = Object.values(data.changeRequests).some((c) => c.workspaceId === ws.id && c.status === 'proposed');
  const ready = remaining.length === 0 && !openChange;

  return (
    <section aria-labelledby="completion" className="border border-line bg-surface p-4">
      <h2 id="completion" className="font-semibold">
        Completion
      </h2>
      {ready ? (
        <p className="mt-1 text-sm text-ink-2">
          {role === 'owner' ? 'Every milestone is approved. Mark the project complete to close the workspace and leave a review.' : 'Every milestone is approved. The owner can now mark the project complete.'}
        </p>
      ) : (
        <p className="mt-1 text-sm text-ink-2">
          {remaining.length ? `${remaining.length} of ${milestones.length} milestones still need approval.` : ''} {openChange ? 'A change request is awaiting a response.' : ''}
        </p>
      )}
      {role === 'owner' ? (
        <Button className="mt-3" variant="accent" icon={<CircleCheckBig aria-hidden className="size-4" />} disabled={!ready} onClick={() => setConfirm(true)}>
          Mark project complete
        </Button>
      ) : null}
      <ConfirmDialog
        open={confirm}
        title="Mark this project complete?"
        body={`“${project.title}” will be closed and the workspace becomes read-only. You’ll be able to review the contractor.`}
        confirmLabel="Mark complete"
        tone="accent"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          const r = command((s, c) => completeProject(s, ws.id as WorkspaceId, c), { success: 'Project marked complete.' });
          if (r.ok) navigate(`/workspace/${ws.id}/review`);
        }}
      />
    </section>
  );
}
