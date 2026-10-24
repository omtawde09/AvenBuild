import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBlocker, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, Pencil, Plus, Save, Send, X } from 'lucide-react';
import { SERVICE_CATEGORY_IDS, serviceCategories } from '@/data/categories';
import { MATERIAL_RESPONSIBILITY, PROPERTY_TYPES, START_PREFERENCES, WEEKDAYS, type Project } from '@/domain/types';
import type { ProjectId } from '@/domain/ids';
import { createDraft, publishProject, updateDraft } from '@/domain/projects/commands';
import { parseRupeesToPaise } from '@/domain/money';
import { knownCities } from '@/domain/matching/filters';
import { useData, todayISO } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import { PageHeader, StickyActions } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { FieldError, SelectField, TextArea, TextField } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Notice, Stepper } from '@/components/ui/Feedback';
import { AttachmentList, FilePicker } from '@/components/domain/Attachments';
import { toast } from '@/components/ui/toast';
import { formatBudgetRange, formatDate } from '@/lib/format';
import { materialLabel, propertyTypeLabel, startPreferenceLabel, weekdayLabel } from '@/lib/labels';
import { PROJECT_LIMITS } from '@/lib/validation/project';
import { cn } from '@/lib/cn';
import { draftInputFromValues, emptyValues, STEP_FIELDS, STEPS, stepOf, valuesFromProject, wizardFieldFor, wizardSchema, type WizardValues } from './schema';

const DEMO_CITIES = ['Pune', 'Pimpri-Chinchwad', 'Mumbai', 'Nashik', 'Bengaluru', 'Hyderabad'];

function RadioCards({ name, options, legend, error, columns = 2 }: { name: keyof WizardValues; options: ReadonlyArray<{ value: string; label: string; hint?: string }>; legend: string; error?: string | undefined; columns?: 2 | 3 }) {
  const { register } = useFormContext<WizardValues>();
  return (
    <fieldset aria-invalid={error ? true : undefined}>
      <legend className="text-sm font-semibold">
        {legend} <span className="text-bad">*</span>
      </legend>
      <div className={cn('mt-2 grid gap-2', columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2')}>
        {options.map((o) => (
          <label
            key={o.value}
            className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-sm border border-line-strong bg-surface px-3 py-2.5 has-checked:border-ink has-checked:bg-sunken has-focus-visible:outline-2 has-focus-visible:outline-brick"
          >
            <input type="radio" value={o.value} {...register(name)} className="mt-1 size-4 shrink-0 accent-brick" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{o.label}</span>
              {o.hint ? <span className="block text-xs text-ink-3">{o.hint}</span> : null}
            </span>
          </label>
        ))}
      </div>
      {error ? <div className="mt-1.5"><FieldError>{error}</FieldError></div> : null}
    </fieldset>
  );
}

function StepBasics() {
  const { register, formState: { errors } } = useFormContext<WizardValues>();
  return (
    <div className="space-y-6">
      <RadioCards
        name="category"
        legend="What kind of work is it?"
        columns={3}
        error={errors.category?.message}
        options={SERVICE_CATEGORY_IDS.map((id) => ({ value: id, label: serviceCategories[id].label, hint: serviceCategories[id].description }))}
      />
      <TextField label="Project title" required description="A short, specific title, e.g. “Terrace waterproofing for a 1,150 sq ft roof”." error={errors.title?.message} {...register('title')} maxLength={PROJECT_LIMITS.titleMax + 10} />
      <SelectField label="Property type" required error={errors.propertyType?.message} placeholder="Choose a property type" options={PROPERTY_TYPES.map((t) => ({ value: t, label: propertyTypeLabel[t] }))} {...register('propertyType')} />
    </div>
  );
}

function StepScope() {
  const { register, control, formState: { errors } } = useFormContext<WizardValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'scopeItems' });
  const scope = useWatch({ control, name: 'scope' });
  return (
    <div className="space-y-6">
      <TextArea
        label="Describe the work"
        required
        description="What’s wrong or what you want built, sizes if known, and anything a contractor should see before quoting."
        error={errors.scope?.message}
        maxChars={PROJECT_LIMITS.scopeMax}
        currentLength={scope.length}
        rows={7}
        {...register('scope')}
      />
      <fieldset>
        <legend className="text-sm font-semibold">
          Key items <span className="font-normal text-ink-3">(optional)</span>
        </legend>
        <p className="text-sm text-ink-3">Short checklist items help contractors itemise their quotes.</p>
        <ul className="mt-2 space-y-2">
          {fields.map((f, i) => (
            <li key={f.id} className="flex items-start gap-2">
              <TextField label={`Item ${i + 1}`} hideLabel shellClassName="flex-1" error={errors.scopeItems?.[i]?.value?.message} {...register(`scopeItems.${i}.value` as const)} />
              <button type="button" onClick={() => remove(i)} className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-ink-2 hover:bg-sunken" aria-label={`Remove item ${i + 1}`}>
                <X aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        <Button variant="secondary" size="sm" className="mt-2" icon={<Plus aria-hidden className="size-4" />} disabled={fields.length >= PROJECT_LIMITS.scopeItemsMax} onClick={() => append({ value: '' })}>
          Add item
        </Button>
        {errors.scopeItems?.message ? <FieldError>{errors.scopeItems.message}</FieldError> : null}
      </fieldset>
    </div>
  );
}

function StepLocation({ cities }: { cities: string[] }) {
  const { register, formState: { errors } } = useFormContext<WizardValues>();
  return (
    <div className="space-y-6">
      <Notice tone="info">Only the city and locality are shown to contractors. Don’t enter your full street address.</Notice>
      <SelectField label="City" required description="Contractors see leads in the cities they serve." error={errors.city?.message} placeholder="Choose a city" options={cities.map((c) => ({ value: c, label: c }))} {...register('city')} />
      <TextField label="Locality / area" required error={errors.locality?.message} {...register('locality')} autoComplete="off" />
      <TextField label="Nearby landmark" optional error={errors.landmark?.message} {...register('landmark')} autoComplete="off" />
    </div>
  );
}

function StepBudget() {
  const { register, control, formState: { errors } } = useFormContext<WizardValues>();
  const kind = useWatch({ control, name: 'budgetKind' });
  const start = useWatch({ control, name: 'startPreference' });
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold">Budget</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="radio" value="range" {...register('budgetKind')} className="size-4 accent-brick" /> I have a budget range
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="radio" value="undisclosed" {...register('budgetKind')} className="size-4 accent-brick" /> Prefer not to say
          </label>
        </div>
        {kind === 'range' ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <TextField label="Minimum (₹)" required inputMode="decimal" prefix="₹" error={errors.budgetMin?.message} {...register('budgetMin')} />
            <TextField label="Maximum (₹)" required inputMode="decimal" prefix="₹" error={errors.budgetMax?.message} {...register('budgetMax')} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-3">Contractors will see “Budget not disclosed”. A range usually gets more comparable quotes.</p>
        )}
      </fieldset>
      <RadioCards name="startPreference" legend="When should work start?" error={errors.startPreference?.message} options={START_PREFERENCES.map((s) => ({ value: s, label: startPreferenceLabel[s] }))} />
      {start === 'specific_date' ? <TextField type="date" label="Target start date" required error={errors.targetStartDate?.message} min={todayISO()} {...register('targetStartDate')} /> : null}
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <TextField label="Expected duration" optional inputMode="numeric" description="If you know roughly how long it should take." error={errors.durationValue?.message} {...register('durationValue')} />
        <SelectField label="Unit" options={[{ value: 'days', label: 'Days' }, { value: 'weeks', label: 'Weeks' }]} {...register('durationUnit')} />
      </div>
    </div>
  );
}

function StepSite() {
  const { register, formState: { errors } } = useFormContext<WizardValues>();
  return (
    <div className="space-y-6">
      <fieldset aria-invalid={errors.siteDays ? true : undefined}>
        <legend className="text-sm font-semibold">
          Days the site can be visited <span className="text-bad">*</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <label key={d} className="flex min-h-11 min-w-14 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-line-strong bg-surface px-3 text-sm has-checked:border-ink has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-2 has-focus-visible:outline-brick">
              <input type="checkbox" value={d} {...register('siteDays')} className="sr-only" />
              {weekdayLabel[d]}
            </label>
          ))}
        </div>
        {errors.siteDays ? <div className="mt-1.5"><FieldError>{errors.siteDays.message}</FieldError></div> : null}
      </fieldset>
      <TextField label="Visiting hours" required placeholder="e.g. 10 am – 1 pm" error={errors.siteWindow?.message} {...register('siteWindow')} />
      <RadioCards name="material" legend="Who supplies materials?" error={errors.material?.message} columns={3} options={MATERIAL_RESPONSIBILITY.map((m) => ({ value: m, label: materialLabel[m] }))} />
      <TextArea label="Access and site notes" optional description="Parking, lift access, working hours allowed by your society, pets — anything that affects the work." error={errors.accessNotes?.message} rows={4} {...register('accessNotes')} />
    </div>
  );
}

function StepFiles() {
  const { control, setValue } = useFormContext<WizardValues>();
  const files = useWatch({ control, name: 'attachments' });
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-2">Photos of the problem area or drawings help contractors quote without guessing. You can skip this step.</p>
      <FilePicker label="Add photos or PDFs" max={PROJECT_LIMITS.attachmentsMax} current={files.length} onAdd={(added) => setValue('attachments', [...files, ...added], { shouldDirty: true })} />
      <AttachmentList files={files} empty="No files added yet." onRemove={(f) => setValue('attachments', files.filter((x) => x.id !== f.id), { shouldDirty: true })} />
    </div>
  );
}

function StepReview({ goTo }: { goTo: (step: number) => void }) {
  const { control } = useFormContext<WizardValues>();
  const v = useWatch({ control }) as WizardValues;
  const min = parseRupeesToPaise(v.budgetMin ?? '');
  const max = parseRupeesToPaise(v.budgetMax ?? '');
  const sections: Array<{ step: number; title: string; rows: Array<[string, string]> }> = [
    { step: 0, title: 'Basics', rows: [['Service', v.category ? serviceCategories[v.category as keyof typeof serviceCategories]?.label ?? '—' : '—'], ['Title', v.title || '—'], ['Property', v.propertyType ? propertyTypeLabel[v.propertyType as keyof typeof propertyTypeLabel] ?? '—' : '—']] },
    { step: 1, title: 'Scope', rows: [['Description', v.scope || '—'], ['Key items', v.scopeItems?.map((i) => i.value).filter(Boolean).join(' · ') || 'None']] },
    { step: 2, title: 'Location', rows: [['Area', [v.locality, v.city].filter(Boolean).join(', ') || '—'], ['Landmark', v.landmark || '—']] },
    {
      step: 3,
      title: 'Budget & timing',
      rows: [
        ['Budget', v.budgetKind === 'undisclosed' ? 'Not disclosed' : min && max ? formatBudgetRange(min, max) : '—'],
        ['Start', v.startPreference === 'specific_date' && v.targetStartDate ? `From ${formatDate(v.targetStartDate)}` : v.startPreference ? startPreferenceLabel[v.startPreference as keyof typeof startPreferenceLabel] ?? '—' : '—'],
        ['Duration', v.durationValue ? `${v.durationValue} ${v.durationUnit}` : 'Not specified'],
      ],
    },
    {
      step: 4,
      title: 'Site & materials',
      rows: [
        ['Site visits', v.siteDays?.length ? `${v.siteDays.map((d) => weekdayLabel[d as keyof typeof weekdayLabel]).join(', ')} · ${v.siteWindow || '—'}` : '—'],
        ['Materials', v.material ? materialLabel[v.material as keyof typeof materialLabel] ?? '—' : '—'],
        ['Notes', v.accessNotes || 'None'],
      ],
    },
    { step: 5, title: 'Photos & files', rows: [['Attached', v.attachments?.length ? v.attachments.map((a) => a.name).join(', ') : 'None']] },
  ];
  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-2">Check the brief before publishing. Matching contractors will be able to see it and send quotes.</p>
      {sections.map((s) => (
        <section key={s.title} className="border-t border-line pt-3" aria-label={s.title}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{s.title}</h3>
            <Button variant="ghost" size="sm" icon={<Pencil aria-hidden className="size-3.5" />} onClick={() => goTo(s.step)} aria-label={`Edit ${s.title}`}>
              Edit
            </Button>
          </div>
          <dl className="mt-1 space-y-1.5">
            {s.rows.map(([k, val]) => (
              <div key={k} className="grid gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
                <dt className="text-sm text-ink-3">{k}</dt>
                <dd className="text-sm break-words whitespace-pre-line">{val}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

/** Multi-step project brief with draft saving, per-step validation, review and publish confirmation. */
export function ProjectWizard({ project }: { project?: Project }) {
  const data = useData();
  const command = useCommand();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const today = todayISO();
  const cities = useMemo(() => [...new Set([...DEMO_CITIES, ...knownCities(data)])].sort(), [data]);
  const projectId = useRef<ProjectId | null>(project?.id ?? null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const allowLeave = useRef(false);

  const form = useForm<WizardValues>({
    defaultValues: project ? valuesFromProject(project) : emptyValues,
    resolver: zodResolver(wizardSchema(today)),
    mode: 'onTouched',
  });
  const { trigger, getValues, reset, setError, formState } = form;

  const rawStep = params.get('step');
  const requested = rawStep === null || rawStep === '' ? NaN : Number(rawStep);
  const step = Number.isInteger(requested) && requested >= 0 && requested < STEPS.length ? requested : Math.min(project?.draftStep ?? 0, STEPS.length - 1);

  const goTo = (s: number) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('step', String(s));
      return next;
    });
    document.getElementById('main')?.focus();
    window.scrollTo({ top: 0 });
  };

  /** Save whatever is entered (lenient). "created" means we navigated to the new draft's edit URL. */
  const saveDraft = (nextStep: number, announce: boolean): 'created' | 'saved' | false => {
    const input = draftInputFromValues(getValues());
    if (!projectId.current) {
      const r = command((s, c) => createDraft(s, input, nextStep, c), announce ? { success: 'Draft saved. You can come back to it any time.' } : {});
      if (!r.ok) return false;
      projectId.current = r.value;
      reset(getValues());
      // This route unmounts when we move to the draft's own edit URL, so leaving is safe.
      allowLeave.current = true;
      navigate(`/owner/projects/${r.value}/edit?step=${nextStep}`, { replace: true });
      return 'created';
    }
    const id = projectId.current;
    const r = command((s, c) => updateDraft(s, id, input, nextStep, c), announce ? { success: 'Draft saved.' } : {});
    if (!r.ok) return false;
    reset(getValues());
    return 'saved';
  };

  const next = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    const valid = fields.length ? await trigger(fields as Array<keyof WizardValues>, { shouldFocus: true }) : true;
    if (!valid) {
      toast.error('Fix the highlighted fields to continue.');
      return;
    }
    const saved = saveDraft(step + 1, false);
    if (saved === 'saved') goTo(step + 1);
  };

  const back = () => {
    const saved = saveDraft(step - 1, false);
    if (saved !== 'created') goTo(step - 1);
  };

  const startPublish = async () => {
    const valid = await trigger();
    if (!valid) {
      // Find the earliest step with a problem straight from the schema (form error state may not be subscribed here).
      const parsed = wizardSchema(today).safeParse(getValues());
      const fields = parsed.success ? [] : parsed.error.issues.map((i) => String(i.path[0]) as keyof WizardValues);
      const firstStep = fields.length ? Math.min(...fields.map(stepOf)) : step;
      toast.error('Some details are missing. We’ve taken you to the first one.');
      goTo(firstStep);
      return;
    }
    setConfirmPublish(true);
  };

  const publish = () => {
    setConfirmPublish(false);
    setPublishing(true);
    if (!saveDraft(STEPS.length - 1, false) || !projectId.current) {
      setPublishing(false);
      return;
    }
    const id = projectId.current;
    const r = command((s, c) => publishProject(s, id, c), { success: 'Published. Matching contractors can now see your project.', quietValidation: true });
    setPublishing(false);
    if (r.ok) {
      allowLeave.current = true;
      navigate(`/owner/projects/${id}`);
      return;
    }
    if (r.error.code === 'VALIDATION' && r.error.fieldErrors) {
      let first: keyof WizardValues | null = null;
      for (const [path, message] of Object.entries(r.error.fieldErrors)) {
        const field = wizardFieldFor(path);
        if (field) {
          setError(field, { message });
          first ??= field;
        }
      }
      toast.error(r.error.message);
      if (first) goTo(stepOf(first));
    }
  };

  const blocker = useBlocker(({ currentLocation, nextLocation }) => !allowLeave.current && formState.isDirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!formState.isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [formState.isDirty]);

  const isLast = step === STEPS.length - 1;

  return (
    <FormProvider {...form}>
      <PageHeader
        title={project ? 'Continue your draft' : 'Post a project'}
        crumbs={[{ label: 'Projects', to: '/owner/projects' }, { label: project ? 'Edit draft' : 'New project' }]}
        meta={<span>Drafts are private. Contractors only see the project after you publish it.</span>}
      >
        <Stepper steps={STEPS} current={step} className="mt-2" />
      </PageHeader>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (isLast) void startPublish();
          else void next();
        }}
        className="max-w-2xl"
        aria-label={`Project brief, step ${step + 1}: ${STEPS[step]}`}
      >
        <h2 className="mb-4 text-xl font-semibold">{STEPS[step]}</h2>
        {step === 0 ? <StepBasics /> : null}
        {step === 1 ? <StepScope /> : null}
        {step === 2 ? <StepLocation cities={cities} /> : null}
        {step === 3 ? <StepBudget /> : null}
        {step === 4 ? <StepSite /> : null}
        {step === 5 ? <StepFiles /> : null}
        {step === 6 ? <StepReview goTo={goTo} /> : null}

        <StickyActions>
          {step > 0 ? (
            <Button variant="ghost" onClick={back} icon={<ArrowLeft aria-hidden className="size-4" />} className="mr-auto">
              Back
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => saveDraft(step, true)} icon={<Save aria-hidden className="size-4" />}>
            Save draft
          </Button>
          {isLast ? (
            <Button type="submit" variant="accent" busy={publishing} icon={<Send aria-hidden className="size-4" />}>
              Publish project
            </Button>
          ) : (
            <Button type="submit" icon={<ArrowRight aria-hidden className="size-4" />} className="flex-row-reverse">
              Next
            </Button>
          )}
        </StickyActions>
      </form>

      <ConfirmDialog
        open={confirmPublish}
        title="Publish this project?"
        body="Contractors whose trade and service area match will see it in their lead feed and can send quotes. You can pause or close it later, but category, city and budget can’t be changed after publishing."
        confirmLabel="Publish"
        tone="accent"
        onCancel={() => setConfirmPublish(false)}
        onConfirm={publish}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave without saving?"
        body="You have changes on this step that haven’t been saved to your draft."
        confirmLabel="Save draft and leave"
        cancelLabel="Stay here"
        onCancel={() => blocker.reset?.()}
        onConfirm={() => {
          if (saveDraft(step, false)) blocker.proceed?.();
          else blocker.reset?.();
        }}
      >
        <button type="button" className="min-h-11 text-sm font-semibold text-bad underline underline-offset-2" onClick={() => blocker.proceed?.()}>
          Leave without saving
        </button>
      </ConfirmDialog>
    </FormProvider>
  );
}
