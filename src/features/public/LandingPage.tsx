import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Building2, HardHat } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/Controls';
import { DemoLabel } from '@/components/ui/Badge';
import { SERVICE_CATEGORY_IDS, serviceCategories } from '@/data/categories';
import { SectionDrawing } from './SectionDrawing';

const lifecycle = [
  ['Brief', 'Owner describes scope, site, budget and timing in a structured form.'],
  ['Match', 'Contractors see the lead only if trade and service area fit — with the reasons shown.'],
  ['Quote', 'Itemised quotes: quantities, rates, tax, inclusions, exclusions and validity.'],
  ['Compare', 'Quotes side by side on what is actually included, not just the total.'],
  ['Award', 'One quote is accepted. Competing quotes are closed with a clear status.'],
  ['Workspace', 'A shared project space for messages, documents and change requests.'],
  ['Milestones', 'Contractor submits work for review; owner approves or asks for changes.'],
  ['Review', 'After completion, the owner reviews the contractor. One review per project.'],
] as const;

const ownerSteps = [
  ['Post a structured brief', 'Pick the trade, describe the scope, add locality, budget range, start preference and site-visit windows. Save a draft any time.'],
  ['Compare like with like', 'Quotes arrive as line items with stated inclusions, exclusions and assumptions, so you can see what each price covers.'],
  ['Ask, revise, decide', 'Message contractors, request a revision on a quote, then accept one. Others are informed automatically.'],
  ['Track the work', 'Milestones and dated site updates sit in one workspace. Approve each stage or request changes with a note.'],
] as const;

const contractorSteps = [
  ['See leads that fit', 'Your feed only shows open projects in your trades and service areas, with the matching reasons spelled out.'],
  ['Quote line by line', 'Build a quote from quantities and rates. Totals, discount and tax are calculated for you — no rounding surprises.'],
  ['Revise without starting over', 'If the owner asks for changes, revise the same quote. Earlier versions stay in its history.'],
  ['Deliver against milestones', 'Post site updates, submit milestones for approval and keep agreed changes on record.'],
] as const;

const principles = [
  ['Sample data is labelled as sample data.', 'Every seeded profile carries a demo label. Nothing in this prototype claims a licence, GST number or identity has been checked.'],
  ['Scope is written down before money is discussed.', 'Quotes must state inclusions, exclusions, assumptions and a validity date. Agreed prices change only through an accepted change request.'],
  ['No payments, no escrow, no hidden fees.', 'This demo does not take or hold money. Milestone values are shown for planning only.'],
  ['You decide; the record keeps everyone honest.', 'Owners and contractors make their own agreements. The workspace keeps a dated activity log of who did what.'],
] as const;

const sampleLines = [
  ['Surface preparation & crack filling', '1,150', 'sq ft', '18.00', '20,700.00'],
  ['APP membrane, 4 mm, torch-applied', '1,150', 'sq ft', '62.00', '71,300.00'],
  ['Protective screed, 25 mm', '1,150', 'sq ft', '24.00', '27,600.00'],
  ['Pond test, 48 hours', '1', 'lump sum', '3,500.00', '3,500.00'],
] as const;

export function LandingPage() {
  const [audience, setAudience] = useState<'owner' | 'contractor'>('owner');
  const steps = audience === 'owner' ? ownerSteps : contractorSteps;

  return (
    <>
      {/* Hero */}
      <section className="container-page grid gap-10 pt-10 pb-12 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:pb-20">
        <div>
          <p className="eyebrow">Property owners &amp; contractors · India</p>
          <h1 className="mt-4 text-display font-extrabold font-condensed">
            Briefed clearly.
            <br />
            Quoted line by line.
            <br />
            <span className="text-brick">Built in the open.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-2">
            A marketplace for construction work that follows the job past the first enquiry — from a structured brief, through itemised
            quotes and a fair comparison, to milestones, site updates and a review.
          </p>
          <div className="mt-8 grid gap-3 sm:max-w-xl sm:grid-cols-2">
            <Link
              to="/start?role=owner"
              className="group flex min-h-16 items-center gap-3 rounded-sm bg-ink px-4 py-3 text-paper hover:bg-ink-2"
            >
              <Building2 aria-hidden className="size-6 shrink-0" />
              <span className="flex-1 leading-tight">
                <span className="block text-xs tracking-wide text-paper/70 uppercase">I own a property</span>
                <span className="block font-semibold">Post a project</span>
              </span>
              <ArrowRight aria-hidden className="size-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/start?role=contractor"
              className="group flex min-h-16 items-center gap-3 rounded-sm border border-ink bg-surface px-4 py-3 hover:bg-sunken"
            >
              <HardHat aria-hidden className="size-6 shrink-0" />
              <span className="flex-1 leading-tight">
                <span className="block text-xs tracking-wide text-ink-3 uppercase">I’m a contractor</span>
                <span className="block font-semibold">Find matching work</span>
              </span>
              <ArrowRight aria-hidden className="size-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-3">
            Interactive demo — no sign-up. Everything you do stays in this browser.{' '}
            <Link to="/help" className="font-semibold text-ink-2 underline underline-offset-2">
              What that means
            </Link>
          </p>
        </div>
        <figure className="border border-line bg-surface p-3 text-ink sm:p-5">
          <SectionDrawing className="h-auto w-full" />
          <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-3 text-sm text-ink-3">
            <span>Section A–A · G+1 residence, terrace waterproofing scope highlighted</span>
            <span className="font-mono text-xs">DWG 01 / ILLUSTRATIVE</span>
          </figcaption>
        </figure>
      </section>

      {/* Lifecycle */}
      <section aria-labelledby="lifecycle-title" className="border-y border-line bg-surface">
        <div className="container-page py-10 md:py-14">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h2 id="lifecycle-title" className="max-w-xl text-2xl font-semibold md:text-3xl">
              One record from the first brief to the final review.
            </h2>
            <p className="max-w-md text-ink-2">Every stage has a visible status, so neither side has to guess what happens next.</p>
          </div>
          <ol className="mt-8 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {lifecycle.map(([title, body], i) => (
              <li key={title} className="bg-surface p-4">
                <p className="font-mono text-sm text-brick">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-1 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-2">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* How it works */}
      <section id="how" aria-labelledby="how-title" className="container-page scroll-mt-4 py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 id="how-title" className="mt-3 text-2xl font-semibold md:text-3xl">
              Two roles, one shared project.
            </h2>
            <p className="mt-3 text-ink-2">
              Owners and contractors see the same project from their own side. Choose a view to see what each one does.
            </p>
            <SegmentedControl
              className="mt-6"
              label="Show steps for"
              value={audience}
              onChange={setAudience}
              options={[
                { value: 'owner', label: 'Property owners' },
                { value: 'contractor', label: 'Contractors' },
              ]}
            />
          </div>
          <ol className="divide-y divide-line border-y border-line" aria-live="polite">
            {steps.map(([title, body], i) => (
              <li key={title} className="grid grid-cols-[2.5rem_1fr] gap-x-3 py-5 sm:grid-cols-[3.5rem_1fr]">
                <span className="font-condensed text-3xl leading-none font-bold text-ink-3 sm:text-4xl">{i + 1}</span>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-ink-2">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sample quote */}
      <section aria-labelledby="quote-title" className="bg-ink text-paper">
        <div className="container-page grid gap-8 py-12 md:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <p className="eyebrow !text-paper/60">What a quote looks like</p>
            <h2 id="quote-title" className="mt-3 text-2xl font-semibold md:text-3xl">
              Prices you can read, not just a number.
            </h2>
            <p className="mt-3 text-paper/80">
              Every quote lists quantities, units and rates, then states what is included, what is not, and how long the price holds.
              Comparisons line these up side by side.
            </p>
          </div>
          <div className="min-w-0 border border-paper/20 bg-[#26231f] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Terrace waterproofing · 1,150 sq ft</p>
              <DemoLabel className="!border-paper/40 !text-paper/70">Sample quote · illustrative</DemoLabel>
            </div>
            <ul className="mt-4 divide-y divide-paper/10 border-y border-paper/20 text-sm sm:hidden">
              {sampleLines.map(([item, qty, unit, rate, amount]) => (
                <li key={item} className="py-2">
                  <p>{item}</p>
                  <p className="mt-0.5 flex justify-between gap-2 font-mono text-paper/80 tabular">
                    <span>
                      {qty} {unit} × ₹{rate}
                    </span>
                    <span className="text-paper">₹{amount}</span>
                  </p>
                </li>
              ))}
              <li className="flex justify-between py-2 font-mono tabular">
                <span className="font-sans text-paper/70">Subtotal</span>₹1,23,100.00
              </li>
              <li className="flex justify-between py-2 font-mono tabular">
                <span className="font-sans text-paper/70">GST 18% (demo figure)</span>₹22,158.00
              </li>
              <li className="flex justify-between py-2 font-mono text-base tabular">
                <span className="font-sans font-medium">Total</span>
                <span className="text-[#f2c3a8]">₹1,45,258.00</span>
              </li>
            </ul>
            <div className="mt-4 hidden sm:block">
              <table className="w-full text-sm">
                <caption className="sr-only">Sample itemised quote</caption>
                <thead>
                  <tr className="border-b border-paper/20 text-left text-xs tracking-wide text-paper/60 uppercase">
                    <th scope="col" className="py-2 pr-3 font-medium">Item</th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">Qty</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Unit</th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">Rate ₹</th>
                    <th scope="col" className="py-2 text-right font-medium">Amount ₹</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular">
                  {sampleLines.map(([item, qty, unit, rate, amount]) => (
                    <tr key={item} className="border-b border-paper/10">
                      <td className="py-2 pr-3 font-sans">{item}</td>
                      <td className="py-2 pr-3 text-right">{qty}</td>
                      <td className="py-2 pr-3 font-sans text-paper/70">{unit}</td>
                      <td className="py-2 pr-3 text-right">{rate}</td>
                      <td className="py-2 text-right">{amount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="font-mono tabular">
                  <tr>
                    <td colSpan={4} className="pt-3 pr-3 text-right font-sans text-paper/70">
                      Subtotal
                    </td>
                    <td className="pt-3 text-right">1,23,100.00</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="pr-3 text-right font-sans text-paper/70">
                      GST 18% (demo figure)
                    </td>
                    <td className="text-right">22,158.00</td>
                  </tr>
                  <tr className="text-base font-medium">
                    <td colSpan={4} className="pt-1 pr-3 text-right font-sans">
                      Total
                    </td>
                    <td className="pt-1 text-right text-[#f2c3a8]">1,45,258.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <dl className="mt-5 grid gap-4 border-t border-paper/20 pt-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs tracking-wide text-paper/60 uppercase">Includes</dt>
                <dd className="mt-1">Material, labour, debris removal, pond test</dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-paper/60 uppercase">Excludes</dt>
                <dd className="mt-1">Parapet plaster repair, tiling over screed</dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-paper/60 uppercase">Valid until</dt>
                <dd className="mt-1">21 days from submission</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" aria-labelledby="services-title" className="container-page scroll-mt-4 py-12 md:py-16">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Services</p>
            <h2 id="services-title" className="mt-3 text-2xl font-semibold md:text-3xl">
              Twelve trades, from footings to finishes.
            </h2>
          </div>
          <p className="max-w-md text-ink-2">Pick a trade to browse demo contractors who offer it.</p>
        </div>
        <ul className="mt-8 grid border-t border-line sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_CATEGORY_IDS.map((id, i) => {
            const c = serviceCategories[id];
            return (
              <li key={id} className="border-b border-line sm:odd:border-r lg:border-r lg:[&:nth-child(3n)]:border-r-0">
                <Link
                  to={`/owner/contractors?category=${id}`}
                  className="group grid min-h-full grid-cols-[2.25rem_1fr_auto] items-start gap-x-2 px-1 py-4 hover:bg-surface sm:px-4"
                >
                  <span className="font-mono text-sm text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block font-semibold group-hover:underline group-hover:underline-offset-2">{c.label}</span>
                    <span className="mt-0.5 block text-sm text-ink-2">{c.description}</span>
                  </span>
                  <ArrowRight aria-hidden className="mt-1 size-4 text-ink-3 group-hover:text-ink" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Principles */}
      <section id="principles" aria-labelledby="principles-title" className="border-t border-line bg-surface">
        <div className="container-page grid gap-8 py-12 md:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <p className="eyebrow">Trust principles</p>
            <h2 id="principles-title" className="mt-3 text-2xl font-semibold md:text-3xl">
              What we won’t pretend.
            </h2>
            <p className="mt-3 text-ink-2">
              Trust in construction comes from written scope and a clear record — not from badges. This prototype is built around that.
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2">
            {principles.map(([title, body]) => (
              <li key={title} className="border-l-2 border-brick pl-4">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-2">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section aria-labelledby="cta-title" className="container-page py-12 md:py-16">
        <div className="flex flex-col gap-6 border border-ink p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 id="cta-title" className="text-2xl font-semibold">
              Try both sides of a project in a few minutes.
            </h2>
            <p className="mt-2 text-ink-2">
              Pick the owner or contractor persona, act on a sample project, then switch to see the other side of the same record.
            </p>
          </div>
          <ButtonLink to="/start" size="lg" icon={<ArrowRight aria-hidden className="size-5" />} className="flex-row-reverse">
            Start the demo
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
