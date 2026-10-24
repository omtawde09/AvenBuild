import type { ReactNode } from 'react';
import { Check, Circle, CircleDot, CircleSlash, Clock, OctagonAlert, PauseCircle, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  changeRequestStatusMeta,
  milestoneStatusMeta,
  pipelineStageMeta,
  projectStatusMeta,
  quoteStatusMeta,
  workspaceStatusMeta,
  type ChangeRequestStatus,
  type EffectiveQuoteStatus,
  type MilestoneStatus,
  type PipelineStage,
  type ProjectStatus,
  type StatusTone,
  type WorkspaceStatus,
} from '@/domain/status';

const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-neutral-tint text-neutral border-neutral/25',
  info: 'bg-info-tint text-info border-info/25',
  accent: 'bg-brick-tint text-brick-strong border-brick/25',
  ok: 'bg-ok-tint text-ok border-ok/25',
  warn: 'bg-warn-tint text-warn border-warn/30',
  bad: 'bg-bad-tint text-bad border-bad/25',
  muted: 'bg-surface text-ink-3 border-line-strong',
};

const toneIcon: Record<StatusTone, typeof Check> = {
  neutral: Check,
  info: CircleDot,
  accent: Clock,
  ok: Check,
  warn: OctagonAlert,
  bad: X,
  muted: Circle,
};

export function Badge({ tone = 'neutral', children, icon, className }: { tone?: StatusTone; children: ReactNode; icon?: ReactNode | false; className?: string }) {
  const Icon = toneIcon[tone];
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-xs border px-1.5 py-0.5 text-xs leading-4 font-semibold whitespace-nowrap',
        toneClasses[tone],
        className,
      )}
    >
      {icon === false ? null : (icon ?? <Icon aria-hidden className="size-3.5 shrink-0" strokeWidth={2.4} />)}
      <span className="truncate">{children}</span>
    </span>
  );
}

type StatusBadgeProps =
  | { kind: 'project'; status: ProjectStatus }
  | { kind: 'quote'; status: EffectiveQuoteStatus }
  | { kind: 'pipeline'; status: PipelineStage }
  | { kind: 'milestone'; status: MilestoneStatus }
  | { kind: 'change'; status: ChangeRequestStatus }
  | { kind: 'workspace'; status: WorkspaceStatus };

/** Status label with colour + icon + text (never colour alone). */
export function StatusBadge(props: StatusBadgeProps & { className?: string }) {
  const meta = (() => {
    switch (props.kind) {
      case 'project':
        return projectStatusMeta[props.status];
      case 'quote':
        return quoteStatusMeta[props.status];
      case 'pipeline':
        return pipelineStageMeta[props.status];
      case 'milestone':
        return milestoneStatusMeta[props.status];
      case 'change':
        return changeRequestStatusMeta[props.status];
      case 'workspace':
        return workspaceStatusMeta[props.status];
    }
  })();
  const icon =
    props.kind === 'project' && props.status === 'paused' ? (
      <PauseCircle aria-hidden className="size-3.5" />
    ) : props.kind === 'project' && props.status === 'cancelled' ? (
      <CircleSlash aria-hidden className="size-3.5" />
    ) : undefined;
  return (
    <Badge tone={meta.tone} icon={icon} className={props.className}>
      {meta.label}
    </Badge>
  );
}

/** Labels content that is sample/demo data rather than a verified fact. */
export function DemoLabel({ children = 'Demo data', className }: { children?: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs border border-dashed border-ink-3/60 px-1.5 py-0.5 font-mono text-[0.6875rem] leading-4 tracking-wide text-ink-3 uppercase',
        className,
      )}
    >
      {children}
    </span>
  );
}
