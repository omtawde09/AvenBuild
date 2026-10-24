import { Building2, ChevronDown, HardHat, RotateCcw } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useDemoDialogs } from '@/components/layout/demoDialogs';

const guides = [
  {
    icon: Building2,
    title: 'For property owners',
    steps: ['Post a project with photos, budget and timing', 'Compare itemised quotes side by side', 'Accept one, then track milestones and updates'],
  },
  {
    icon: HardHat,
    title: 'For contractors',
    steps: ['See leads in your trades and areas', 'Send an itemised quote with your terms', 'Post site updates and submit milestones'],
  },
] as const;

const faqs = [
  ['How do I switch between owner and contractor?', 'Open the account menu (your initials, top right) and choose Switch account.'],
  ['Who can see my project?', 'Only contractors whose trade and service area match. Your address and phone number are never shown.'],
  ['Can I change a quote after sending it?', 'Withdraw it and resubmit, or wait for the owner to ask for a revision. Earlier versions stay on record.'],
  ['How do price or date changes work after a job starts?', 'Either side proposes a change request. The agreement updates only when the other side accepts it.'],
  ['When can I leave a review?', 'After the owner marks the project complete. One review per project.'],
] as const;

export function HelpPage() {
  const show = useDemoDialogs((s) => s.show);
  return (
    <div className="container-page max-w-3xl py-10 md:py-14">
      <h1 className="text-3xl font-semibold md:text-4xl">Help</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {guides.map(({ icon: Icon, title, steps }) => (
          <section key={title} aria-label={title} className="rounded-md border border-line bg-surface p-5">
            <span className="inline-flex size-10 items-center justify-center rounded-md bg-ink text-paper">
              <Icon aria-hidden className="size-5" />
            </span>
            <h2 className="mt-3 font-semibold">{title}</h2>
            <ol className="mt-2 space-y-2">
              {steps.map((s, i) => (
                <li key={s} className="flex gap-2 text-sm text-ink-2">
                  <span className="font-mono text-brick">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section aria-labelledby="faq" className="mt-10">
        <h2 id="faq" className="text-xl font-semibold">
          Common questions
        </h2>
        <div className="mt-3 divide-y divide-line border-y border-line">
          {faqs.map(([q, a]) => (
            <details key={q} className="group">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-2 font-medium">
                {q}
                <ChevronDown aria-hidden className="size-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="trouble" className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-4">
        <div>
          <h2 id="trouble" className="font-semibold">
            Troubleshooting
          </h2>
          <p className="text-sm text-ink-2">Start over with the original projects and accounts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/start" variant="secondary">
            Switch account
          </ButtonLink>
          <Button variant="danger" icon={<RotateCcw aria-hidden className="size-4" />} onClick={() => show('reset')}>
            Reset app data
          </Button>
        </div>
      </section>
    </div>
  );
}
