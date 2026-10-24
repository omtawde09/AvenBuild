import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm, useWatch, type Control, type UseFormRegister } from 'react-hook-form';
import { Link, useBlocker, useNavigate, useParams } from 'react-router';
import { FilePlus2, Plus, Save, Send, Trash2, X } from 'lucide-react';
import { useActorId, useData, todayISO } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import type { LineItemId, ProjectId, QuoteId } from '@/domain/ids';
import { randomIdFactory } from '@/domain/ids';
import { discardQuoteDraft, saveQuoteDraft, startQuote, submitQuote } from '@/domain/quotes/commands';
import { editableContent } from '@/domain/quotes/status';
import { isOpenForQuotes } from '@/domain/matching/match';
import { safeQuoteTotals, validateQuoteNumbers } from '@/domain/quotes/math';
import { validateQuoteForSubmit, QUOTE_LIMITS } from '@/lib/validation/quote';
import { UNITS, type Unit } from '@/domain/types';
import { serviceCategories } from '@/data/categories';
import { PageHeader, StickyActions } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { FieldError, SelectField, TextArea, TextField } from '@/components/ui/Field';
import { Notice, SectionHeading } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/Badge';
import { TotalsBlock } from '@/components/domain/QuoteBreakdown';
import { RecordNotFound } from '@/features/public/NotFoundPage';
import { toast } from '@/components/ui/toast';
import { localeConfig } from '@/config/locale';
import { budgetLabel, locationLabel } from '@/lib/labels';
import { formatDate, formatMoneyExact, unitLabel } from '@/lib/format';
import { contentFromValues, formPath, valuesFromContent, type ComposerValues } from './convert';

type Errors = Record<string, string>;

function TermsList({ name, label, control, register, errors, required }: { name: 'inclusions' | 'exclusions' | 'assumptions'; label: string; control: Control<ComposerValues>; register: UseFormRegister<ComposerValues>; errors: Errors; required?: boolean }) {
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <fieldset>
      <legend className="text-sm font-semibold">
        {label} {required ? <span className="text-bad">*</span> : <span className="font-normal text-ink-3">(optional)</span>}
      </legend>
      <ul className="mt-2 space-y-2">
        {fields.map((f, i) => (
          <li key={f.id} className="flex items-start gap-2">
            <TextField label={`${label} ${i + 1}`} hideLabel shellClassName="flex-1" {...register(`${name}.${i}.value` as const)} />
            <button type="button" onClick={() => remove(i)} aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-2 hover:bg-sunken">
              <X aria-hidden className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <Button size="sm" variant="secondary" className="mt-2" icon={<Plus aria-hidden className="size-4" />} disabled={fields.length >= QUOTE_LIMITS.listItemsMax} onClick={() => append({ value: '' })}>
        Add
      </Button>
      {errors[name] ? <FieldError>{errors[name]}</FieldError> : null}
    </fieldset>
  );
}

/** Itemised quote editor with live totals. Owners never see drafts or unsent revision edits. */
export function QuoteComposerPage() {
  const { projectId = '' } = useParams();
  const data = useData();
  const me = useActorId();
  const today = todayISO();
  const command = useCommand();
  const navigate = useNavigate();
  const project = data.projects[projectId];
  const quote = project ? (Object.values(data.quotes).find((q) => q.projectId === project.id && q.contractorId === me) ?? null) : null;

  if (!project || project.status === 'draft' || !data.contractorProfiles[me]) return <RecordNotFound what="lead" backTo="/contractor/leads" backLabel="Back to leads" />;

  const crumbs = [
    { label: 'Leads', to: '/contractor/leads' },
    { label: project.title, to: `/contractor/leads/${project.id}` },
    { label: 'Quote' },
  ];

  if (!quote) {
    const open = isOpenForQuotes(project);
    return (
      <>
        <PageHeader title="Quote" crumbs={crumbs} />
        {open ? (
          <div className="max-w-lg space-y-4">
            <p className="text-ink-2">You haven’t started a quote for this project yet.</p>
            <Button
              variant="accent"
              icon={<FilePlus2 aria-hidden className="size-4" />}
              onClick={() => command((s, c) => startQuote(s, project.id as ProjectId, c))}
            >
              Start a quote
            </Button>
          </div>
        ) : (
          <Notice tone="warn" title="This project isn’t accepting quotes">
            {project.status === 'paused' ? 'The owner has paused it.' : 'It has been awarded, closed or cancelled.'}
          </Notice>
        )}
      </>
    );
  }

  if (quote.status === 'submitted' || quote.status === 'viewed' || quote.status === 'accepted' || quote.status === 'declined') {
    return (
      <>
        <PageHeader title="Quote" crumbs={crumbs} meta={<StatusBadge kind="quote" status={quote.status} />} />
        <Notice tone="info" title={quote.status === 'accepted' ? 'This quote was accepted' : quote.status === 'declined' ? 'This quote was declined' : 'Your quote is with the owner'}>
          {quote.status === 'submitted' || quote.status === 'viewed' ? 'To change it, withdraw it first or wait for the owner to ask for a revision.' : 'Decided quotes can’t be edited.'}
        </Notice>
        <ButtonLink to={`/contractor/quotes/${quote.id}`} className="mt-4">
          View quote
        </ButtonLink>
      </>
    );
  }

  return <Composer key={`${quote.id}-${quote.status}-${quote.revision}`} quoteId={quote.id as QuoteId} crumbs={crumbs} today={today} onDone={(to) => navigate(to)} />;
}

function Composer({ quoteId, crumbs, today, onDone }: { quoteId: QuoteId; crumbs: Array<{ label: string; to?: string }>; today: string; onDone: (to: string) => void }) {
  const data = useData();
  const command = useCommand();
  const quote = data.quotes[quoteId]!;
  const project = data.projects[quote.projectId]!;
  const revising = quote.status !== 'draft';
  const [errors, setErrors] = useState<Errors>({});
  const [confirm, setConfirm] = useState<'submit' | 'discard' | null>(null);
  // Set before navigating away on purpose so the unsaved-changes guard doesn't block it.
  const leaving = useRef(false);

  const { register, control, handleSubmit, getValues, reset, formState } = useForm<ComposerValues>({ defaultValues: valuesFromContent(editableContent(quote)) });
  const lines = useFieldArray({ control, name: 'lineItems' });
  const milestones = useFieldArray({ control, name: 'milestones' });
  const watched = useWatch({ control }) as ComposerValues;
  const strict = useMemo(() => contentFromValues({ ...getValues(), ...watched }, 'strict'), [watched, getValues]);
  const totals = safeQuoteTotals(strict);
  const lineIssues = validateQuoteNumbers(strict);
  const shareSum = (watched.milestones ?? []).reduce((s, m) => s + (Number(m.share) || 0), 0);
  const defaultUnit: Unit = project.category ? serviceCategories[project.category].defaultUnit : 'lump_sum';

  const blocker = useBlocker(({ currentLocation, nextLocation }) => !leaving.current && formState.isDirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!formState.isDirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [formState.isDirty]);

  const save = (announce: boolean) => {
    const r = command((s, c) => saveQuoteDraft(s, quoteId, contentFromValues(getValues(), 'lenient'), c), announce ? { success: revising ? 'Changes saved. The owner still sees your previous version.' : 'Quote draft saved.' } : {});
    if (r.ok) reset(getValues());
    return r.ok;
  };

  const validate = (): boolean => {
    const errs = validateQuoteForSubmit(contentFromValues(getValues(), 'strict'), today);
    const mapped: Errors = {};
    for (const [path, msg] of Object.entries(errs)) {
      const key = formPath(path);
      if (!(key in mapped)) mapped[key] = msg;
    }
    setErrors(mapped);
    if (Object.keys(mapped).length) {
      toast.error('Some quote details need attention.');
      const first = Object.keys(mapped)[0]!;
      const el = document.querySelector<HTMLElement>(`[name="${first}"]`) ?? document.getElementById(`err-${first.replace(/\./g, '-')}`);
      el?.focus();
      el?.scrollIntoView({ block: 'center' });
      return false;
    }
    return true;
  };

  const submit = () => {
    setConfirm(null);
    const content = contentFromValues(getValues(), 'strict');
    leaving.current = true;
    const r = command((s, c) => submitQuote(s, quoteId, content, c), { success: revising ? 'Revision sent to the owner.' : 'Quote submitted. The owner has been notified.', quietValidation: true });
    if (r.ok) {
      onDone(`/contractor/quotes/${quoteId}`);
      return;
    }
    leaving.current = false;
    if (r.error.fieldErrors) {
      const mapped: Errors = {};
      for (const [p, m] of Object.entries(r.error.fieldErrors)) mapped[formPath(p)] ??= m;
      setErrors(mapped);
      toast.error(r.error.message);
    }
  };

  const err = (k: string) => errors[k];

  return (
    <>
      <PageHeader
        title={revising ? `Revise quote · revision ${quote.revision + 1}` : 'Build your quote'}
        crumbs={crumbs}
        meta={
          <>
            <StatusBadge kind="quote" status={quote.status} />
            <span>{project.title}</span>
            <span>{locationLabel(project)}</span>
            <span className="font-mono tabular">Owner budget: {budgetLabel(project.budget)}</span>
          </>
        }
      />
      {quote.status === 'revision_requested' && quote.revisionRequest ? (
        <Notice tone="warn" className="mb-6" title="The owner asked for a revision">
          “{quote.revisionRequest.message}” Your previous version stays on record and remains what the owner sees until you send this revision.
        </Notice>
      ) : null}
      {quote.status === 'withdrawn' ? (
        <Notice tone="info" className="mb-6" title="You withdrew this quote">
          You can revise and resubmit it while the project is still open.
        </Notice>
      ) : null}

      <form
        noValidate
        onSubmit={handleSubmit(() => {
          if (validate()) setConfirm('submit');
        })}
        className="space-y-10"
      >
        <section aria-labelledby="items">
          <SectionHeading id="items" title="Line items" />
          {err('lineItems') ? <div id="err-lineItems"><FieldError>{err('lineItems')}</FieldError></div> : null}
          <ol className="mt-3 space-y-3">
            {lines.fields.map((f, i) => {
              const lineId = watched.lineItems?.[i]?.lineId;
              const amount = totals?.lines.find((l) => l.id === lineId)?.amountPaise;
              return (
                <li key={f.id} className="border border-line bg-surface p-3">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,2.4fr)_minmax(5rem,0.8fr)_minmax(6rem,0.9fr)_minmax(6rem,1fr)_auto] md:items-start">
                    <TextField label={`Item ${i + 1} description`} error={err(`lineItems.${i}.description`)} {...register(`lineItems.${i}.description` as const)} />
                    <TextField label="Quantity" inputMode="decimal" error={err(`lineItems.${i}.quantity`)} {...register(`lineItems.${i}.quantity` as const)} />
                    <SelectField label="Unit" options={UNITS.map((u) => ({ value: u, label: unitLabel[u] ?? u }))} {...register(`lineItems.${i}.unit` as const)} />
                    <TextField label="Rate (₹)" inputMode="decimal" prefix="₹" error={err(`lineItems.${i}.rate`)} {...register(`lineItems.${i}.rate` as const)} />
                    <div className="flex items-end justify-between gap-2 md:flex-col md:items-end">
                      <p className="text-sm">
                        <span className="block text-xs font-semibold text-ink-3 md:sr-only">Amount</span>
                        <span className="font-mono tabular">{amount !== undefined ? formatMoneyExact(amount) : '—'}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => lines.remove(i)}
                        disabled={lines.fields.length === 1}
                        aria-label={`Remove item ${i + 1}`}
                        className="inline-flex size-11 items-center justify-center rounded-sm text-ink-2 hover:bg-bad-tint hover:text-bad disabled:opacity-40"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <Button
            variant="secondary"
            className="mt-3"
            icon={<Plus aria-hidden className="size-4" />}
            disabled={lines.fields.length >= QUOTE_LIMITS.lineItemsMax}
            onClick={() => lines.append({ lineId: randomIdFactory('li') as LineItemId, description: '', quantity: '', unit: defaultUnit, rate: '' })}
          >
            Add line item
          </Button>
        </section>

        <section aria-labelledby="pricing" className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            <SectionHeading id="pricing" title="Discount and tax" />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Discount"
                options={[
                  { value: 'none', label: 'No discount' },
                  { value: 'percent', label: 'Percentage of subtotal' },
                  { value: 'flat', label: 'Fixed amount (₹)' },
                ]}
                {...register('discountKind')}
              />
              {watched.discountKind && watched.discountKind !== 'none' ? (
                <TextField label={watched.discountKind === 'percent' ? 'Discount (%)' : 'Discount (₹)'} inputMode="decimal" error={err('discountValue')} {...register('discountValue')} />
              ) : null}
              <TextField label={`${localeConfig.taxLabel} (%)`} inputMode="decimal" error={err('taxPercent')} {...register('taxPercent')} />
            </div>
          </div>
          <div className="border border-line bg-surface p-4" aria-live="polite">
            <h3 className="mb-2 font-semibold">Totals</h3>
            <TotalsBlock content={strict} />
            {!totals && lineIssues[0] ? <p className="mt-2 text-sm text-warn">{lineIssues[0].message}</p> : null}
          </div>
        </section>

        <section aria-labelledby="schedule" className="space-y-4">
          <SectionHeading id="schedule" title="Schedule and validity" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField type="date" label="Earliest start" min={today} error={err('earliest')} {...register('earliest')} />
            <TextField type="date" label="Latest start" min={today} error={err('latest')} {...register('latest')} />
            <TextField label="Duration (days)" inputMode="numeric" error={err('durationDays')} {...register('durationDays')} />
            <TextField type="date" label="Price valid until" min={today} error={err('validUntil')} {...register('validUntil')} />
          </div>
        </section>

        <section aria-labelledby="milestones" className="space-y-3">
          <SectionHeading id="milestones" title="Proposed milestones" description="Optional · shares must total 100%" />
          <ol className="space-y-2">
            {milestones.fields.map((f, i) => (
              <li key={f.id} className="grid grid-cols-[1fr_6rem_auto] items-start gap-2">
                <TextField label={`Milestone ${i + 1}`} hideLabel placeholder="e.g. Surface preparation" {...register(`milestones.${i}.title` as const)} />
                <TextField label={`Milestone ${i + 1} share (%)`} hideLabel inputMode="numeric" suffix="%" {...register(`milestones.${i}.share` as const)} />
                <button type="button" onClick={() => milestones.remove(i)} aria-label={`Remove milestone ${i + 1}`} className="inline-flex size-11 items-center justify-center rounded-sm text-ink-2 hover:bg-sunken">
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary" icon={<Plus aria-hidden className="size-4" />} disabled={milestones.fields.length >= QUOTE_LIMITS.milestonesMax} onClick={() => milestones.append({ title: '', share: '' })}>
              Add milestone
            </Button>
            {milestones.fields.length ? <span className={shareSum === 100 ? 'text-sm text-ok' : 'text-sm text-warn'}>Total: {shareSum}%</span> : null}
          </div>
          {err('milestones') ? <div id="err-milestones"><FieldError>{err('milestones')}</FieldError></div> : null}
        </section>

        <section aria-labelledby="terms" className="space-y-6">
          <SectionHeading id="terms" title="What’s included" />
          <div className="grid gap-6 lg:grid-cols-3">
            <TermsList name="inclusions" label="Included" control={control} register={register} errors={errors} required />
            <TermsList name="exclusions" label="Not included" control={control} register={register} errors={errors} required />
            <TermsList name="assumptions" label="Assumptions" control={control} register={register} errors={errors} />
          </div>
          <TextArea label="Note to the owner" optional rows={3} error={err('note')} maxChars={QUOTE_LIMITS.noteMax} currentLength={(watched.note ?? '').length} {...register('note')} />
        </section>

        <StickyActions>
          <p className="mr-auto text-sm">
            <span className="text-ink-3">Total </span>
            <strong className="font-mono tabular">{totals ? formatMoneyExact(totals.totalPaise) : '—'}</strong>
          </p>
          {revising && quote.pendingContent ? (
            <Button variant="ghost" onClick={() => setConfirm('discard')}>
              Discard changes
            </Button>
          ) : null}
          {!revising ? (
            <Button variant="ghost" onClick={() => setConfirm('discard')}>
              Delete draft
            </Button>
          ) : null}
          <Button variant="secondary" icon={<Save aria-hidden className="size-4" />} onClick={() => save(true)}>
            Save
          </Button>
          <Button type="submit" variant="accent" icon={<Send aria-hidden className="size-4" />}>
            {revising ? 'Send revision' : 'Submit quote'}
          </Button>
        </StickyActions>
      </form>

      <ConfirmDialog
        open={confirm === 'submit'}
        title={revising ? 'Send this revision?' : 'Submit this quote?'}
        body={
          <>
            The owner will be notified and can accept, decline or ask for changes. Total: <strong className="font-mono">{totals ? formatMoneyExact(totals.totalPaise) : '—'}</strong>, valid until{' '}
            {watched.validUntil ? formatDate(watched.validUntil) : '—'}.
          </>
        }
        confirmLabel={revising ? 'Send revision' : 'Submit quote'}
        tone="accent"
        onCancel={() => setConfirm(null)}
        onConfirm={submit}
      />
      <ConfirmDialog
        open={confirm === 'discard'}
        title={revising ? 'Discard unsent changes?' : 'Delete this draft?'}
        body={revising ? 'Your edits since the last version you sent will be lost.' : 'The draft was never visible to the owner. This can’t be undone.'}
        confirmLabel={revising ? 'Discard changes' : 'Delete draft'}
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          leaving.current = true;
          const r = command((s, c) => discardQuoteDraft(s, quoteId, c), { success: revising ? 'Changes discarded.' : 'Draft deleted.' });
          if (r.ok) onDone(revising ? `/contractor/quotes/${quoteId}` : `/contractor/leads/${project.id}`);
          else leaving.current = false;
        }}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave without saving?"
        body="You have changes that haven’t been saved."
        confirmLabel="Save and leave"
        cancelLabel="Stay here"
        onCancel={() => blocker.reset?.()}
        onConfirm={() => {
          if (save(false)) blocker.proceed?.();
          else blocker.reset?.();
        }}
      >
        <button type="button" className="min-h-11 text-sm font-semibold text-bad underline underline-offset-2" onClick={() => blocker.proceed?.()}>
          Leave without saving
        </button>
      </ConfirmDialog>
      <p className="mt-8 text-sm text-ink-3">
        <Link to={`/contractor/leads/${project.id}`} className="underline underline-offset-2">
          Back to the brief
        </Link>
      </p>
    </>
  );
}
