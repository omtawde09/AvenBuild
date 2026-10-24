import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useLocation } from 'react-router';
import { Plus, Save, X } from 'lucide-react';
import { useActorId, useData } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import { updateContractorProfile, type ContractorProfileInput } from '@/domain/profile/commands';
import { aggregateReviews } from '@/domain/reviews/aggregate';
import { SERVICE_CATEGORY_IDS, serviceCategories, type ServiceCategoryId } from '@/data/categories';
import type { ContractorProfile } from '@/domain/types';
import { paiseToRupeeInput, parseRupeesToPaise } from '@/domain/money';
import { PageHeader, StickyActions } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Checkbox, FieldError, SelectField, TextArea, TextField } from '@/components/ui/Field';
import { SectionHeading } from '@/components/ui/Feedback';
import { RatingBreakdown } from '@/components/domain/Reputation';
import { availabilityLabel } from '@/lib/labels';
import { formatDate } from '@/lib/format';

interface Values {
  businessName: string;
  contactName: string;
  bio: string;
  services: string[];
  areas: Array<{ city: string; localities: string }>;
  yearsExperience: string;
  teamSize: string;
  availabilityStatus: ContractorProfile['availability']['status'];
  availableFrom: string;
  rangeMin: string;
  rangeMax: string;
  siteVisits: boolean;
  preferredHours: string;
  licenceNumber: string;
  gstNumber: string;
}

const CITIES = ['Pune', 'Pimpri-Chinchwad', 'Mumbai', 'Nashik', 'Bengaluru', 'Hyderabad'];

function toValues(p: ContractorProfile): Values {
  return {
    businessName: p.businessName,
    contactName: p.contactName,
    bio: p.bio,
    services: [...p.services],
    areas: p.serviceAreas.map((a) => ({ city: a.city, localities: a.localities.join(', ') })),
    yearsExperience: String(p.yearsExperience),
    teamSize: String(p.teamSize),
    availabilityStatus: p.availability.status,
    availableFrom: p.availability.availableFrom,
    rangeMin: paiseToRupeeInput(p.typicalProjectRange.minPaise),
    rangeMax: paiseToRupeeInput(p.typicalProjectRange.maxPaise),
    siteVisits: p.contactPreferences.siteVisits,
    preferredHours: p.contactPreferences.preferredHours,
    licenceNumber: p.qualifications.licenceNumber,
    gstNumber: p.qualifications.gstNumber,
  };
}

const intOrNaN = (s: string) => (/^\d{1,5}$/.test(s.trim()) ? Number(s) : NaN);

export function ContractorProfileEditor() {
  const data = useData();
  const me = useActorId();
  const command = useCommand();
  const { hash } = useLocation();
  const profile = data.contractorProfiles[me]!;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, control, handleSubmit, reset, formState } = useForm<Values>({ defaultValues: toValues(profile) });
  const areas = useFieldArray({ control, name: 'areas' });
  const bio = useWatch({ control, name: 'bio' });
  const reviews = useMemo(() => Object.values(data.reviews).filter((r) => r.contractorId === me).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data, me]);
  const rating = aggregateReviews(reviews);

  useEffect(() => {
    if (hash === '#reviews') document.getElementById('reviews')?.scrollIntoView();
  }, [hash]);

  const onSubmit = handleSubmit((v) => {
    const input: ContractorProfileInput = {
      businessName: v.businessName,
      contactName: v.contactName,
      bio: v.bio,
      services: v.services.filter((s): s is ServiceCategoryId => (SERVICE_CATEGORY_IDS as ReadonlyArray<string>).includes(s)),
      serviceAreas: v.areas.map((a) => ({ city: a.city, localities: a.localities.split(',').map((l) => l.trim()).filter(Boolean) })),
      yearsExperience: intOrNaN(v.yearsExperience),
      teamSize: intOrNaN(v.teamSize),
      availability: { status: v.availabilityStatus, availableFrom: v.availableFrom },
      typicalProjectRange: { minPaise: parseRupeesToPaise(v.rangeMin) ?? 0, maxPaise: parseRupeesToPaise(v.rangeMax) ?? 0 },
      contactPreferences: { siteVisits: v.siteVisits, preferredHours: v.preferredHours },
      qualifications: { licenceNumber: v.licenceNumber, gstNumber: v.gstNumber },
      visibility: profile.visibility,
      quoteDefaults: profile.quoteDefaults,
      notificationPrefs: profile.notificationPrefs,
    };
    const r = command((s, c) => updateContractorProfile(s, input, c), { success: 'Profile saved. Owners searching for contractors now see these details.', quietValidation: true });
    if (r.ok) {
      setErrors({});
      reset(v);
    } else if (r.error.fieldErrors) {
      setErrors(r.error.fieldErrors);
    }
  });

  return (
    <>
      <PageHeader
        title="Business profile"
        crumbs={[{ label: 'Home', to: '/contractor' }, { label: 'Profile' }]}
        actions={
          <ButtonLink to="/contractor/portfolio" variant="secondary">
            Manage portfolio
          </ButtonLink>
        }
      />
      <form noValidate onSubmit={onSubmit} className="grid max-w-3xl gap-10">
        <section aria-labelledby="basics" className="grid gap-5">
          <SectionHeading id="basics" title="Business" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Business name" required error={errors.businessName} {...register('businessName')} />
            <TextField label="Contact person" required error={errors.contactName} {...register('contactName')} />
          </div>
          <TextArea label="About your business" required rows={5} error={errors.bio} maxChars={1200} currentLength={bio.length} {...register('bio')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Years of experience" required inputMode="numeric" error={errors.yearsExperience} {...register('yearsExperience')} />
            <TextField label="Team size" required inputMode="numeric" error={errors.teamSize} {...register('teamSize')} />
          </div>
        </section>

        <section aria-labelledby="services" className="grid gap-4">
          <SectionHeading id="services" title="Services" description="Your leads and search listing use these." />
          <fieldset aria-invalid={errors.services ? true : undefined}>
            <legend className="sr-only">Services you offer</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICE_CATEGORY_IDS.map((id) => (
                <label key={id} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-sm border border-line-strong bg-surface px-3 has-checked:border-ink has-checked:bg-sunken has-focus-visible:outline-2 has-focus-visible:outline-brick">
                  <input type="checkbox" value={id} {...register('services')} className="size-4 accent-brick" />
                  <span className="text-sm">{serviceCategories[id].label}</span>
                </label>
              ))}
            </div>
            {errors.services ? <div className="mt-1.5"><FieldError>{errors.services}</FieldError></div> : null}
          </fieldset>
        </section>

        <section aria-labelledby="areas" className="grid gap-4">
          <SectionHeading id="areas" title="Service areas" description="Cities you work in. Localities are optional." />
          <ul className="space-y-3">
            {areas.fields.map((f, i) => (
              <li key={f.id} className="grid gap-2 border border-line bg-surface p-3 sm:grid-cols-[12rem_1fr_auto] sm:items-start">
                <SelectField label="City" options={[...new Set([...CITIES, f.city])].filter(Boolean).map((c) => ({ value: c, label: c }))} {...register(`areas.${i}.city` as const)} />
                <TextField label="Localities" optional description="Comma-separated" {...register(`areas.${i}.localities` as const)} />
                <button type="button" onClick={() => areas.remove(i)} aria-label={`Remove service area ${i + 1}`} className="inline-flex size-11 items-center justify-center self-end rounded-sm text-ink-2 hover:bg-sunken">
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="secondary" className="justify-self-start" icon={<Plus aria-hidden className="size-4" />} onClick={() => areas.append({ city: 'Pune', localities: '' })}>
            Add city
          </Button>
          {errors.serviceAreas ? <FieldError>{errors.serviceAreas}</FieldError> : null}
        </section>

        <section aria-labelledby="availability" className="grid gap-4">
          <SectionHeading id="availability" title="Availability and project size" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Availability" options={(['available', 'limited', 'unavailable'] as const).map((s) => ({ value: s, label: availabilityLabel[s] }))} {...register('availabilityStatus')} />
            <TextField type="date" label="Available from" error={errors['availability.availableFrom']} {...register('availableFrom')} />
            <TextField label="Typical project size from (₹)" prefix="₹" inputMode="decimal" error={errors['typicalProjectRange.minPaise']} {...register('rangeMin')} />
            <TextField label="Typical project size up to (₹)" prefix="₹" inputMode="decimal" error={errors['typicalProjectRange.maxPaise']} {...register('rangeMax')} />
          </div>
          <Checkbox label="I do site visits before quoting" {...register('siteVisits')} />
          <TextField label="Preferred contact hours" error={errors['contactPreferences.preferredHours']} {...register('preferredHours')} />
        </section>

        <section aria-labelledby="credentials" className="grid gap-4">
          <SectionHeading id="credentials" title="Licence and GST" description="Optional." />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <TextField label="Licence or registration number" optional error={errors['qualifications.licenceNumber']} {...register('licenceNumber')} />
            </div>
            <div className="space-y-2">
              <TextField label="GSTIN" optional error={errors['qualifications.gstNumber']} {...register('gstNumber')} />
            </div>
          </div>
        </section>

        <StickyActions>
          {formState.isDirty ? <p className="mr-auto text-sm text-ink-3">Unsaved changes</p> : null}
          <Button variant="secondary" disabled={!formState.isDirty} onClick={() => { reset(toValues(profile)); setErrors({}); }}>
            Undo changes
          </Button>
          <Button type="submit" icon={<Save aria-hidden className="size-4" />}>
            Save profile
          </Button>
        </StickyActions>
      </form>

      <section id="reviews" aria-labelledby="reviews-heading" className="mt-14 max-w-3xl scroll-mt-20">
        <SectionHeading id="reviews-heading" title="Your reviews" />
        <div className="mt-4">
          <RatingBreakdown rating={rating} />
        </div>
        {reviews.length ? (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {reviews.map((r) => (
              <li key={r.id} className="py-4">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <strong>{r.rating}/5</strong>
                  <span className="text-ink-2">{r.projectTitle}</span>
                  <span className="text-ink-3">
                    · {r.reviewerLabel} · {formatDate(r.createdAt)}
                  </span>
                </p>
                <p className="mt-1">{r.text}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-3">No reviews yet. They appear after owners mark projects complete.</p>
        )}
      </section>
    </>
  );
}
