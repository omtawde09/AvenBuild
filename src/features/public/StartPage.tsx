import { useNavigate, useSearchParams } from 'react-router';
import { ShieldOff } from 'lucide-react';
import { PersonaList } from '@/components/layout/DemoControls';
import { personaRole, useDemoStore } from '@/app/store/demoStore';
import { personaCards } from '@/data/personas';
import { roleHome, roleLabel } from '@/domain/roles';
import { safeNext } from '@/app/navigation';
import { toast } from '@/components/ui/toast';
import { Notice } from '@/components/ui/Feedback';


export function StartPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const activeId = useDemoStore((s) => s.data.meta.activePersonaId);
  const setPersona = useDemoStore((s) => s.setPersona);
  const hintRole = params.get('role');
  const next = params.get('next');
  const ordered = hintRole === 'contractor' ? [...personaCards].reverse() : personaCards;

  return (
    <section className="container-page grid gap-10 py-10 md:py-16 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="eyebrow">Choose a demo persona</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Who do you want to be for this walk-through?</h1>
        <p className="mt-3 max-w-lg text-ink-2">
          There’s no sign-up. Pick a persona to explore the app from that side. You can switch at any time from the top bar to act on
          the other side of the same projects.
        </p>
        <Notice tone="info" className="mt-6 max-w-lg" title="This is not a sign-in">
          <p className="flex gap-2">
            <ShieldOff aria-hidden className="mt-0.5 size-4 shrink-0" />
            Personas are fictional sample accounts with no password or security. Your changes are saved only in this browser and are not
            seen by anyone else.
          </p>
        </Notice>
        {next ? <p className="mt-4 text-sm text-ink-3">After choosing, you’ll continue to the page you were trying to open if it belongs to that persona.</p> : null}
      </div>
      <div>
        <h2 className="sr-only">Personas</h2>
        <PersonaList
          activeId={activeId}
          onChoose={(id) => {
            const role = personaRole(id);
            if (!role) return;
            setPersona(id);
            const card = ordered.find((p) => p.id === id);
            toast.info(`Viewing the demo as ${card?.name ?? roleLabel[role]} (${roleLabel[role]}).`);
            navigate(safeNext(next, role) ?? roleHome[role], { replace: true });
          }}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {ordered.map((p) => (
            <div key={p.id}>
              <h3 className="text-sm font-semibold">As {roleLabel[p.role].toLowerCase()}, try:</h3>
              <ul className="mt-1 list-disc pl-5 text-sm text-ink-2">
                {p.tryThis.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
