import { useState } from 'react';
import { Link } from 'react-router';
import { Save } from 'lucide-react';
import { useActorId, useData } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import { updateContractorProfile } from '@/domain/profile/commands';
import type { ContractorProfile, NotificationPrefs } from '@/domain/types';
import { categoryLabel } from '@/data/categories';
import { PageHeader, StickyActions } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { SelectField, TextArea, TextField } from '@/components/ui/Field';
import { Notice, SectionHeading } from '@/components/ui/Feedback';
import { availabilityLabel } from '@/lib/labels';
import { localeConfig } from '@/config/locale';
import { DemoDataPanel } from './DemoDataPanel';
import { NotificationPrefsFields } from './NotificationPrefsFields';

interface Form {
  visibility: ContractorProfile['visibility'];
  availabilityStatus: ContractorProfile['availability']['status'];
  availableFrom: string;
  validityDays: string;
  taxPercent: string;
  inclusions: string;
  exclusions: string;
  notificationPrefs: NotificationPrefs;
}

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);

function toForm(p: ContractorProfile): Form {
  return {
    visibility: p.visibility,
    availabilityStatus: p.availability.status,
    availableFrom: p.availability.availableFrom,
    validityDays: String(p.quoteDefaults.validityDays),
    taxPercent: String(p.quoteDefaults.taxPercent),
    inclusions: p.quoteDefaults.inclusions.join('\n'),
    exclusions: p.quoteDefaults.exclusions.join('\n'),
    notificationPrefs: p.notificationPrefs,
  };
}

export function ContractorSettingsPage() {
  const data = useData();
  const me = useActorId();
  const command = useCommand();
  const profile = data.contractorProfiles[me]!;
  const initial = toForm(profile);
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const save = () => {
    const num = (s: string) => (/^\d{1,3}(\.\d{1,2})?$/.test(s.trim()) ? Number(s) : NaN);
    const r = command(
      (s, c) =>
        updateContractorProfile(
          s,
          {
            ...profile,
            visibility: form.visibility,
            availability: { status: form.availabilityStatus, availableFrom: form.availableFrom },
            quoteDefaults: { validityDays: num(form.validityDays), taxPercent: num(form.taxPercent), inclusions: lines(form.inclusions).slice(0, 12), exclusions: lines(form.exclusions).slice(0, 12) },
            notificationPrefs: form.notificationPrefs,
            qualifications: { licenceNumber: profile.qualifications.licenceNumber, gstNumber: profile.qualifications.gstNumber },
          },
          c,
        ),
      { success: 'Settings saved.', quietValidation: true },
    );
    if (r.ok) setErrors({});
    else if (r.error.fieldErrors) setErrors(r.error.fieldErrors);
  };

  return (
    <>
      <PageHeader title="Settings" crumbs={[{ label: 'Home', to: '/contractor' }, { label: 'Settings' }]} meta={<span>Visibility, availability, quote defaults and notifications.</span>} />
      <form
        noValidate
        className="grid max-w-2xl gap-10"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <section aria-labelledby="visibility" className="grid gap-4">
          <SectionHeading id="visibility" title="Profile visibility" />
          <SelectField
            label="Who can find your profile"
            options={[
              { value: 'listed', label: 'Listed — owners can find me and I receive matching leads' },
              { value: 'hidden', label: 'Hidden — not in search and no new leads' },
            ]}
            value={form.visibility}
            onChange={(e) => setForm({ ...form, visibility: e.target.value as Form['visibility'] })}
          />
          {form.visibility === 'hidden' ? <Notice tone="warn">While hidden you won’t appear in owner searches or receive new leads. Existing quotes and jobs continue.</Notice> : null}
          <p className="text-sm text-ink-2">
            Services: {profile.services.map(categoryLabel).join(', ')} · Areas: {profile.serviceAreas.map((a) => a.city).join(', ')}.{' '}
            <Link to="/contractor/profile" className="font-semibold underline underline-offset-2">
              Edit in your profile
            </Link>
          </p>
        </section>

        <section aria-labelledby="availability" className="grid gap-4">
          <SectionHeading id="availability" title="Availability" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Status" options={(['available', 'limited', 'unavailable'] as const).map((s) => ({ value: s, label: availabilityLabel[s] }))} value={form.availabilityStatus} onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value as Form['availabilityStatus'] })} />
            <TextField type="date" label="Available from" value={form.availableFrom} error={errors['availability.availableFrom']} onChange={(e) => setForm({ ...form, availableFrom: e.target.value })} />
          </div>
        </section>

        <section aria-labelledby="quote-defaults" className="grid gap-4">
          <SectionHeading id="quote-defaults" title="Quote defaults" description="Pre-filled into every new quote. You can change them per quote." />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Price valid for (days)" inputMode="numeric" value={form.validityDays} error={errors['quoteDefaults.validityDays']} onChange={(e) => setForm({ ...form, validityDays: e.target.value })} />
            <TextField label={`${localeConfig.taxLabel} (%)`} inputMode="decimal" description="Demo input only — not tax advice." value={form.taxPercent} error={errors['quoteDefaults.taxPercent']} onChange={(e) => setForm({ ...form, taxPercent: e.target.value })} />
          </div>
          <TextArea label="Standard inclusions" description="One per line." rows={4} value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} />
          <TextArea label="Standard exclusions" description="One per line." rows={4} value={form.exclusions} onChange={(e) => setForm({ ...form, exclusions: e.target.value })} />
        </section>

        <section aria-labelledby="notif" className="grid gap-4">
          <SectionHeading id="notif" title="Notifications" />
          <NotificationPrefsFields value={form.notificationPrefs} onChange={(notificationPrefs) => setForm({ ...form, notificationPrefs })} />
        </section>

        <StickyActions>
          {dirty ? <p className="mr-auto text-sm text-ink-3">Unsaved changes</p> : null}
          <Button variant="secondary" disabled={!dirty} onClick={() => { setForm(initial); setErrors({}); }}>
            Undo changes
          </Button>
          <Button type="submit" disabled={!dirty} icon={<Save aria-hidden className="size-4" />}>
            Save settings
          </Button>
        </StickyActions>
      </form>
      <div className="mt-10 max-w-2xl">
        <DemoDataPanel />
      </div>
    </>
  );
}
