import { useNavigate, useSearchParams } from 'react-router';
import { ArrowRight, Building2, HardHat } from 'lucide-react';
import { personaRole, useDemoStore } from '@/app/store/demoStore';
import { personaCards } from '@/data/personas';
import { roleHome, roleLabel } from '@/domain/roles';
import { safeNext } from '@/app/navigation';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';

/** Account chooser: one tap to continue as an owner or a contractor. */
export function StartPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const activeId = useDemoStore((s) => s.data.meta.activePersonaId);
  const setPersona = useDemoStore((s) => s.setPersona);
  const next = params.get('next');
  const ordered = params.get('role') === 'contractor' ? [...personaCards].reverse() : personaCards;

  return (
    <section className="container-page max-w-3xl py-12 md:py-20">
      <h1 className="text-3xl font-semibold md:text-4xl">Welcome to AvenBuild</h1>
      <p className="mt-2 text-lg text-ink-2">Choose an account to continue.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {ordered.map((p) => {
          const Icon = p.role === 'owner' ? Building2 : HardHat;
          const active = p.id === activeId;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  const role = personaRole(p.id);
                  if (!role) return;
                  setPersona(p.id);
                  toast.info(`Signed in as ${p.name}.`);
                  navigate(safeNext(next, role) ?? roleHome[role], { replace: true });
                }}
                className={cn(
                  'group flex h-full w-full flex-col gap-4 rounded-md border bg-surface p-5 text-left transition-colors hover:border-ink',
                  active ? 'border-ink' : 'border-line-strong',
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="inline-flex size-12 items-center justify-center rounded-md bg-ink text-paper">
                    <Icon aria-hidden className="size-6" />
                  </span>
                  <ArrowRight aria-hidden className="size-5 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                </span>
                <span>
                  <span className="eyebrow block">{roleLabel[p.role]}</span>
                  <span className="mt-1 block text-lg leading-snug font-semibold">{p.name}</span>
                  <span className="mt-1 block text-sm text-ink-2">{p.summary}</span>
                </span>
                <span className="mt-auto flex flex-wrap gap-1.5">
                  {p.tryThis.map((t) => (
                    <span key={t} className="rounded-xs bg-sunken px-2 py-0.5 text-xs font-medium text-ink-2">
                      {t}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
