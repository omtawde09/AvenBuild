import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { Repeat2 } from 'lucide-react';
import { roleHome, roleLabel, type Role } from '@/domain/roles';
import { useActiveRole, useDemoStore } from '@/app/store/demoStore';
import { CONTRACTOR_PERSONA_ID, OWNER_PERSONA_ID } from '@/data/personas';
import { Button, ButtonLink } from '@/components/ui/Button';
import { toast } from '@/components/ui/toast';

/** Redirects to the account chooser when no account is active. */
export function RequirePersona({ children }: { children?: ReactNode }) {
  const role = useActiveRole();
  const location = useLocation();
  if (!role) {
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    return <Navigate to={`/start?next=${next}`} replace />;
  }
  return children ?? <Outlet />;
}

/** Shows an explicit "wrong persona" state (never a silent redirect) when the role doesn't match. */
export function RequireRole({ role }: { role: Role }) {
  const active = useActiveRole();
  const setPersona = useDemoStore((s) => s.setPersona);
  if (!active) return <RequirePersona />;
  if (active === role) return <Outlet />;
  return (
    <section className="max-w-xl py-8" aria-labelledby="wrong-role">
      <h1 id="wrong-role" className="mt-2 text-2xl font-semibold">
        This page is for {roleLabel[role]}s
      </h1>
      <p className="mt-2 text-ink-2">
        You’re signed in as a {roleLabel[active].toLowerCase()}. Switch account to open this page.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          icon={<Repeat2 aria-hidden className="size-4" />}
          onClick={() => {
            setPersona(role === 'owner' ? OWNER_PERSONA_ID : CONTRACTOR_PERSONA_ID);
            toast.info(`Switched to your ${roleLabel[role].toLowerCase()} account.`);
          }}
        >
          Switch to {roleLabel[role].toLowerCase()} account
        </Button>
        <ButtonLink to={roleHome[active]} variant="secondary">
          Go to my dashboard
        </ButtonLink>
      </div>
    </section>
  );
}
