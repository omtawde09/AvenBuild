import { useNavigate, useLocation } from 'react-router';
import { ArrowRight, Building2, HardHat } from 'lucide-react';
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/toast';
import { personaCards } from '@/data/personas';
import { roleLabel } from '@/domain/roles';
import { landingAfterSwitch } from '@/app/navigation';
import { useDemoDialogs } from './demoDialogs';
import { personaRole, useDemoStore } from '@/app/store/demoStore';
import { cn } from '@/lib/cn';

export function PersonaList({ onChoose, activeId }: { onChoose: (id: (typeof personaCards)[number]['id']) => void; activeId: string | null }) {
  return (
    <ul className="grid gap-3">
      {personaCards.map((p) => {
        const Icon = p.role === 'owner' ? Building2 : HardHat;
        const active = p.id === activeId;
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onChoose(p.id)}
              className={cn(
                'group flex w-full items-start gap-3 rounded-sm border px-3 py-3 text-left transition-colors',
                active ? 'border-ink bg-sunken' : 'border-line-strong bg-surface hover:border-ink',
              )}
              aria-current={active || undefined}
            >
              <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-sm bg-ink text-paper">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="eyebrow block">{roleLabel[p.role]}</span>
                <span className="block font-semibold">{p.name}</span>
                <span className="mt-0.5 block text-sm text-ink-2">{p.summary}</span>
                {active ? <span className="mt-1 block text-sm font-semibold text-ok">Signed in</span> : null}
              </span>
              <ArrowRight aria-hidden className="mt-3 size-4 shrink-0 text-ink-3 group-hover:text-ink" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Account switch + reset dialogs, rendered once per layout. */
export function DemoControlDialogs() {
  const open = useDemoDialogs((s) => s.open);
  const show = useDemoDialogs((s) => s.show);
  const activeId = useDemoStore((s) => s.data.meta.activePersonaId);
  const setPersona = useDemoStore((s) => s.setPersona);
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <>
      <Dialog
        open={open === 'persona'}
        onClose={() => show(null)}
        title="Switch account"
      >
        <PersonaList
          activeId={activeId}
          onChoose={(id) => {
            const role = personaRole(id);
            show(null);
            if (!role || id === activeId) return;
            setPersona(id);
            const card = personaCards.find((p) => p.id === id);
            toast.info(`Switched to ${card?.name ?? roleLabel[role]}.`);
            navigate(landingAfterSwitch(pathname, role));
          }}
        />
      </Dialog>
      <ConfirmDialog
        open={open === 'reset'}
        title="Reset all data?"
        body="Projects, quotes, messages, reviews and profile changes will go back to the starting set. This can't be undone."
        confirmLabel="Reset data"
        tone="danger"
        onCancel={() => show(null)}
        onConfirm={() => {
          show(null);
          resetDemo();
          navigate('/start');
          toast.success('Data reset.');
        }}
      />
    </>
  );
}

