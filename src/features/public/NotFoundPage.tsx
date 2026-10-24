import { useActiveRole } from '@/app/store/demoStore';
import { roleHome } from '@/domain/roles';
import { ButtonLink } from '@/components/ui/Button';

export function NotFoundPage() {
  const role = useActiveRole();
  return (
    <section className="container-page py-16">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-3xl font-semibold">This page doesn’t exist</h1>
      <p className="mt-2 max-w-lg text-ink-2">The link may be mistyped, or the page may have been removed.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {role ? <ButtonLink to={roleHome[role]}>Go to my dashboard</ButtonLink> : <ButtonLink to="/start">Get started</ButtonLink>}
        <ButtonLink to="/" variant="secondary">
          Home page
        </ButtonLink>
      </div>
    </section>
  );
}

/** In-shell not-found state for unknown record IDs. */
export function RecordNotFound({ what, backTo, backLabel }: { what: string; backTo: string; backLabel: string }) {
  return (
    <section className="py-10">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-2 text-2xl font-semibold">We couldn’t find that {what}</h1>
      <p className="mt-2 max-w-lg text-ink-2">
        It may have been deleted or moved.
      </p>
      <ButtonLink to={backTo} className="mt-5">
        {backLabel}
      </ButtonLink>
    </section>
  );
}
