import { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  Building2,
  ClipboardList,
  FileText,
  HardHat,
  History,
  Inbox,
  ListChecks,
  MapPin,
  MessagesSquare,
  Scale,
  Send,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/Controls';
import { CategoryIcon } from '@/components/domain/CategoryIcon';
import { SERVICE_CATEGORY_IDS, serviceCategories } from '@/data/categories';
import { SectionDrawing } from './SectionDrawing';

type Step = readonly [icon: LucideIcon, title: string, body: string];

const ownerSteps: ReadonlyArray<Step> = [
  [ClipboardList, 'Post your project', 'Scope, photos, budget and timing.'],
  [Scale, 'Compare quotes', 'Line by line, side by side.'],
  [MessagesSquare, 'Choose with confidence', 'Ask questions, request changes, accept one.'],
  [ListChecks, 'Track the work', 'Approve each milestone as it’s done.'],
];

const contractorSteps: ReadonlyArray<Step> = [
  [Inbox, 'Get matching leads', 'Only your trades, only your areas.'],
  [FileText, 'Quote line by line', 'Totals and tax worked out for you.'],
  [Send, 'Win the job', 'Revise easily if the owner asks.'],
  [HardHat, 'Deliver and get reviewed', 'Updates, milestones, then a review.'],
];

const reasons: ReadonlyArray<Step> = [
  [FileText, 'Itemised quotes', 'Every price shows what’s in and what’s out.'],
  [MapPin, 'Local matches', 'Leads go to contractors who serve your area.'],
  [History, 'One shared record', 'Messages, files and changes in one place.'],
  [Star, 'Honest reviews', 'Only from completed projects.'],
];

const sampleLines = [
  ['Surface preparation & crack filling', '1,150 sq ft × ₹18', '₹20,700'],
  ['APP membrane, 4 mm', '1,150 sq ft × ₹62', '₹71,300'],
  ['Protective screed, 25 mm', '1,150 sq ft × ₹24', '₹27,600'],
  ['Pond test, 48 hours', '1 × ₹3,500', '₹3,500'],
] as const;

function StepList({ steps }: { steps: ReadonlyArray<Step> }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2" aria-live="polite">
      {steps.map(([Icon, title, body], i) => (
        <li key={title} className="flex gap-3 rounded-md border border-line bg-surface p-4">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-brick-tint text-brick-strong">
            <Icon aria-hidden className="size-5" />
          </span>
          <span>
            <span className="block font-semibold">
              <span className="sr-only">Step {i + 1}: </span>
              {title}
            </span>
            <span className="block text-sm text-ink-2">{body}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function LandingPage() {
  const [audience, setAudience] = useState<'owner' | 'contractor'>('owner');

  return (
    <>
      {/* Hero */}
      <section className="container-page grid grid-cols-1 gap-10 pt-10 pb-12 *:min-w-0 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:pb-20">
        <div>
          <p className="eyebrow">For property owners &amp; contractors</p>
          <h1 className="mt-4 text-display font-extrabold font-condensed">
            Briefed clearly.
            <br />
            Quoted line by line.
            <br />
            <span className="text-brick">Built in the open.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-2">Post a project, compare itemised quotes and track the work — all in one place.</p>
          <div className="mt-8 grid gap-3 sm:max-w-xl sm:grid-cols-2">
            <Link to="/start?role=owner" className="group flex min-h-16 items-center gap-3 rounded-md bg-ink px-4 py-3 text-paper hover:bg-ink-2">
              <Building2 aria-hidden className="size-6 shrink-0" />
              <span className="flex-1 leading-tight">
                <span className="block text-xs tracking-wide text-paper/70 uppercase">I own a property</span>
                <span className="block font-semibold">Post a project</span>
              </span>
              <ArrowRight aria-hidden className="size-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/start?role=contractor" className="group flex min-h-16 items-center gap-3 rounded-md border border-ink bg-surface px-4 py-3 hover:bg-sunken">
              <HardHat aria-hidden className="size-6 shrink-0" />
              <span className="flex-1 leading-tight">
                <span className="block text-xs tracking-wide text-ink-3 uppercase">I’m a contractor</span>
                <span className="block font-semibold">Find matching work</span>
              </span>
              <ArrowRight aria-hidden className="size-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
        <figure className="rounded-md border border-line bg-surface p-3 text-ink sm:p-5">
          <SectionDrawing className="h-auto w-full" />
          <figcaption className="mt-3 border-t border-line pt-3 text-sm text-ink-3">Terrace waterproofing scope, marked on the section</figcaption>
        </figure>
      </section>

      {/* How it works */}
      <section id="how" aria-labelledby="how-title" className="scroll-mt-4 border-y border-line bg-sunken/50">
        <div className="container-page py-12 md:py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="how-title" className="text-2xl font-semibold md:text-3xl">
              How it works
            </h2>
            <SegmentedControl
              label="Show steps for"
              value={audience}
              onChange={setAudience}
              options={[
                { value: 'owner', label: 'Owners' },
                { value: 'contractor', label: 'Contractors' },
              ]}
            />
          </div>
          <div className="mt-6">
            <StepList steps={audience === 'owner' ? ownerSteps : contractorSteps} />
          </div>
        </div>
      </section>

      {/* Example quote */}
      <section aria-labelledby="quote-title" className="bg-ink text-paper">
        <div className="container-page grid grid-cols-1 gap-8 py-12 *:min-w-0 md:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-14">
          <div>
            <h2 id="quote-title" className="text-2xl font-semibold md:text-3xl">
              Prices you can read.
            </h2>
            <p className="mt-3 text-paper/80">Quantities, rates, inclusions and exclusions — so you know exactly what you’re paying for.</p>
          </div>
          <div className="rounded-md border border-paper/20 bg-[#26231f] p-4 sm:p-5">
            <p className="font-semibold">Terrace waterproofing · example quote</p>
            <ul className="mt-3 divide-y divide-paper/10 border-y border-paper/20 text-sm">
              {sampleLines.map(([item, calc, amount]) => (
                <li key={item} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block">{item}</span>
                    <span className="block font-mono text-xs text-paper/60 tabular">{calc}</span>
                  </span>
                  <span className="shrink-0 font-mono tabular">{amount}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 font-mono text-sm tabular">
              <div className="flex justify-between">
                <dt className="font-sans text-paper/70">GST 18%</dt>
                <dd>₹22,158</dd>
              </div>
              <div className="flex justify-between text-base">
                <dt className="font-sans font-medium">Total</dt>
                <dd className="text-[#f2c3a8]">₹1,45,258</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-xs bg-paper/10 px-2 py-1">✓ Debris removal</span>
              <span className="rounded-xs bg-paper/10 px-2 py-1">✓ Pond test</span>
              <span className="rounded-xs bg-paper/10 px-2 py-1">✕ Parapet repair</span>
              <span className="rounded-xs bg-paper/10 px-2 py-1">Valid 21 days</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" aria-labelledby="services-title" className="container-page scroll-mt-4 py-12 md:py-16">
        <h2 id="services-title" className="text-2xl font-semibold md:text-3xl">
          Services
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {SERVICE_CATEGORY_IDS.map((id) => (
            <li key={id}>
              <Link
                to={`/owner/contractors?category=${id}`}
                title={serviceCategories[id].description}
                className="group flex min-h-14 items-center gap-3 rounded-md border border-line bg-surface px-3 py-2 hover:border-ink"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-sunken text-ink-2 group-hover:bg-ink group-hover:text-paper">
                  <CategoryIcon category={id} className="size-[1.125rem]" />
                </span>
                <span className="text-sm font-medium">{serviceCategories[id].label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Why */}
      <section aria-labelledby="why-title" className="border-t border-line bg-surface">
        <div className="container-page py-12 md:py-16">
          <h2 id="why-title" className="text-2xl font-semibold md:text-3xl">
            Why AvenBuild
          </h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map(([Icon, title, body]) => (
              <li key={title}>
                <Icon aria-hidden className="size-6 text-brick" />
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-2">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section aria-labelledby="cta-title" className="container-page py-12 md:py-16">
        <div className="flex flex-col gap-5 rounded-md bg-brick-tint p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <h2 id="cta-title" className="text-2xl font-semibold">
            Ready to start?
          </h2>
          <ButtonLink to="/start" size="lg" variant="accent" icon={<ArrowRight aria-hidden className="size-5" />} className="flex-row-reverse">
            Get started
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
