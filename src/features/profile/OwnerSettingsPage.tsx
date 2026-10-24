import { useState } from 'react';
import { Save } from 'lucide-react';
import { useActorId, useData } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import { updateOwnerSettings, type OwnerSettingsInput } from '@/domain/profile/commands';
import type { OwnerSettings } from '@/domain/types';
import { PageHeader, StickyActions } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/Field';
import { SectionHeading } from '@/components/ui/Feedback';
import { allNotifications } from '@/data/seed/builder';
import { DemoDataPanel } from './DemoDataPanel';
import { NotificationPrefsFields } from './NotificationPrefsFields';

const CITIES = ['Pune', 'Pimpri-Chinchwad', 'Mumbai', 'Nashik', 'Bengaluru', 'Hyderabad'];

export function OwnerSettingsPage() {
  const data = useData();
  const me = useActorId();
  const command = useCommand();
  const user = data.users[me]!;
  const settings: OwnerSettings = data.ownerSettings[me] ?? { userId: me, contactPreference: 'messages_only', notificationPrefs: { ...allNotifications } };
  const initial: OwnerSettingsInput = { displayName: user.displayName, city: user.city, locality: user.locality, contactPreference: settings.contactPreference, notificationPrefs: settings.notificationPrefs };
  const [form, setForm] = useState<OwnerSettingsInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  return (
    <>
      <PageHeader title="Settings" crumbs={[{ label: 'Home', to: '/owner' }, { label: 'Settings' }]} />
      <form
        noValidate
        className="grid max-w-2xl gap-10"
        onSubmit={(e) => {
          e.preventDefault();
          const r = command((s, c) => updateOwnerSettings(s, form, c), { success: 'Settings saved.', quietValidation: true });
          if (r.ok) setErrors({});
          else if (r.error.fieldErrors) setErrors(r.error.fieldErrors);
        }}
      >
        <section aria-labelledby="profile" className="grid gap-4">
          <SectionHeading id="profile" title="Profile" />
          <TextField label="Name" required value={form.displayName} error={errors.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="City" required options={[...new Set([...CITIES, form.city])].filter(Boolean).map((c) => ({ value: c, label: c }))} value={form.city} error={errors.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <TextField label="Locality" optional value={form.locality} error={errors.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} />
          </div>
          <SelectField
            label="How contractors can reach you"
            options={[
              { value: 'messages_only', label: 'In-app messages only' },
              { value: 'messages_and_site_visits', label: 'In-app messages, and site visits during my listed hours' },
            ]}
            value={form.contactPreference}
            onChange={(e) => setForm({ ...form, contactPreference: e.target.value as OwnerSettingsInput['contactPreference'] })}
          />
        </section>
        <section aria-labelledby="notifications" className="grid gap-4">
          <SectionHeading id="notifications" title="Notifications" />
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
