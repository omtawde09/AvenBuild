import { Hammer } from 'lucide-react';
import { useActiveRole } from '@/app/store/demoStore';
import { roleHome } from '@/domain/roles';
import { ButtonLink } from '@/components/ui/Button';
import { PageHeader } from './PageHeader';

/** Clearly marked placeholder for a route whose screen is delivered in a later build phase. */
export function PhasePlaceholder({ title, phase, description }: { title: string; phase: number; description: string }) {
  const role = useActiveRole();
  return (
    <>
      <PageHeader title={title} />
      <div className="flex max-w-xl gap-4 border border-dashed border-line-strong p-5">
        <Hammer aria-hidden className="mt-0.5 size-6 shrink-0 text-ink-3" />
        <div>
          <p className="font-semibold">Coming in Phase {phase} of this demo build</p>
          <p className="mt-1 text-sm text-ink-2">{description}</p>
          {role ? (
            <ButtonLink to={roleHome[role]} variant="secondary" size="sm" className="mt-4">
              Back to dashboard
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </>
  );
}
