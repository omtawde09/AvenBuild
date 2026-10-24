import { Link } from 'react-router';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDemoDialogs } from '@/components/layout/demoDialogs';
import { brand } from '@/config/brand';

const limits = [
  ['No backend or database', 'All data lives in this browser’s local storage. Nothing is sent to a server, and there is no account system.'],
  ['No real sign-in', 'The two personas are fictional sample accounts. Choosing one is a testing shortcut, not authentication, and offers no security.'],
  ['No real verification', 'Labels such as “Sample verification · demo data” are illustrations. No identity, licence or GST number has been checked. Fields you fill in show “Not submitted”.'],
  ['No payments', 'The demo never asks for card or bank details and never moves money. Milestone values are shown for planning only.'],
  ['No email, SMS or push', 'Notifications appear only inside this app, in this browser.'],
  ['No cross-device or multi-user sync', 'Another device, browser or person will not see your changes. Two tabs in this same browser do stay in step.'],
  ['Files are not uploaded', 'Only a file’s name, type and size are saved. Image previews last until you refresh the page.'],
] as const;

const faqs = [
  ['How do I see both sides of a project?', 'Use “Switch persona” in the top bar (or More → Switch demo persona on a phone). Both personas read and write the same local data, so a quote sent as the contractor appears for the owner straight away.'],
  ['Are the contractors, reviews and ratings real?', 'No. Every business, person, locality detail and review is fictional sample content written for this demo.'],
  ['Why did my image preview disappear?', 'Images you pick are shown from temporary browser memory and are not stored. After a refresh the file name and size remain, but the preview is gone.'],
  ['What happens if saved data is damaged?', 'If the stored demo data can’t be read, the app restores the original sample scenario and tells you so, instead of crashing.'],
  ['Can I start over?', 'Yes. “Reset demo data” restores the original sample scenario. It removes everything you created in this browser.'],
] as const;

export function HelpPage() {
  const show = useDemoDialogs((s) => s.show);
  return (
    <div className="container-page max-w-3xl py-10 md:py-14">
      <p className="eyebrow">Help &amp; about this demo</p>
      <h1 className="mt-3 text-3xl font-semibold md:text-4xl">What {brand.name} is — and what this demo can’t do</h1>
      <p className="mt-4 text-lg text-ink-2">
        {brand.name} is a working prototype of a marketplace that connects property owners with contractors, from the first project
        brief to the final review. It is fully interactive, but everything happens locally in your browser.
      </p>

      <section aria-labelledby="limits" className="mt-10">
        <h2 id="limits" className="text-xl font-semibold">
          Demo limitations
        </h2>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {limits.map(([term, body]) => (
            <div key={term} className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:gap-6">
              <dt className="font-semibold">{term}</dt>
              <dd className="text-ink-2">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="faq" className="mt-10">
        <h2 id="faq" className="text-xl font-semibold">
          Questions
        </h2>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-1">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                {q}
                <span aria-hidden className="font-mono text-lg text-ink-3 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-4 text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="data" className="mt-10 border border-line bg-surface p-5">
        <h2 id="data" className="text-xl font-semibold">
          Demo data controls
        </h2>
        <p className="mt-2 text-ink-2">
          Reset restores the original sample projects, quotes, messages and profiles. It can’t be undone.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="danger" icon={<RotateCcw aria-hidden className="size-4" />} onClick={() => show('reset')}>
            Reset demo data
          </Button>
          <Button variant="secondary" onClick={() => show('persona')}>
            Switch demo persona
          </Button>
          <Link to="/start" className="inline-flex min-h-11 items-center px-2 font-semibold underline underline-offset-2">
            Persona selection page
          </Link>
        </div>
      </section>
    </div>
  );
}
