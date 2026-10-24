import { Link } from 'react-router';
import { ChevronRight, MapPin } from 'lucide-react';
import type { DemoState, Project } from '@/domain/types';
import { StatusBadge } from '@/components/ui/Badge';
import { budgetLabel, locationLabel, projectCategoryLabel } from '@/lib/labels';
import { formatRelative } from '@/lib/format';
import { liveQuoteCount, unseenQuoteCount } from '@/domain/projects/selectors';
import { workspaceForProject, workspaceMilestones, workspaceProgress } from '@/domain/workspace/selectors';
import { SeedArt } from '@/components/domain/SeedArt';
import { projectArtKey } from '@/lib/art';
import { ProgressBar } from '@/components/ui/Feedback';
import { cn } from '@/lib/cn';

/** One project as a list row: status, key facts and what's happening next. */
export function ProjectRow({ project, state, layout = 'row' }: { project: Project; state: DemoState; layout?: 'row' | 'card' }) {
  const quotes = liveQuoteCount(state, project.id);
  const unseen = unseenQuoteCount(state, project.id);
  const ws = workspaceForProject(state, project.id);
  const progress = ws ? workspaceProgress(workspaceMilestones(state, ws.id)) : null;
  const to = project.status === 'draft' ? `/owner/projects/${project.id}/edit` : `/owner/projects/${project.id}`;

  const status = (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge kind="project" status={project.status} />
      {project.status === 'open' || project.status === 'reviewing' || project.status === 'paused' ? (
        <span className="text-xs text-ink-2">
          {quotes} {quotes === 1 ? 'quote' : 'quotes'}
          {unseen ? <strong className="ml-1 font-semibold text-brick-strong">· {unseen} new</strong> : null}
        </span>
      ) : null}
    </div>
  );

  if (layout === 'card') {
    return (
      <Link to={to} className="group flex h-full flex-col overflow-hidden border border-line bg-surface hover:border-ink">
        <div className="aspect-[16/9] border-b border-line">
          <SeedArt art={projectArtKey(project)} decorative />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          {status}
          <h3 className="font-semibold group-hover:underline group-hover:underline-offset-2">{project.title || 'Untitled draft'}</h3>
          <p className="text-sm text-ink-2">
            {projectCategoryLabel(project)} · {locationLabel(project)}
          </p>
          <p className="mt-auto font-mono text-sm tabular">{budgetLabel(project.budget)}</p>
          {progress !== null ? <ProgressBar value={progress} label="Agreed progress" /> : null}
        </div>
      </Link>
    );
  }

  return (
    <Link to={to} className="group grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-1 py-3.5 hover:bg-surface sm:px-3">
      <div className="min-w-0 space-y-1.5">
        {status}
        <p className={cn('font-semibold group-hover:underline group-hover:underline-offset-2', !project.title && 'text-ink-3')}>{project.title || 'Untitled draft'}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-ink-2">
          <span>{projectCategoryLabel(project)}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden className="size-3.5" />
            {locationLabel(project)}
          </span>
          <span className="font-mono tabular">{budgetLabel(project.budget)}</span>
          <span className="text-ink-3">Updated {formatRelative(project.updatedAt)}</span>
        </p>
        {progress !== null ? <ProgressBar value={progress} label={`Agreed progress for ${project.title}`} className="max-w-xs" /> : null}
      </div>
      <ChevronRight aria-hidden className="size-5 text-ink-3 group-hover:text-ink" />
    </Link>
  );
}
