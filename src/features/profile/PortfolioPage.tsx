import { useMemo, useState } from 'react';
import { Images, Pencil, Plus, Trash2 } from 'lucide-react';
import { useActorId, useData, todayISO } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import type { PortfolioItemId } from '@/domain/ids';
import { removePortfolioItem, restorePortfolioItem, savePortfolioItem, type PortfolioInput } from '@/domain/profile/commands';
import { categoryLabel, categoryOptions, SERVICE_CATEGORY_IDS } from '@/data/categories';
import type { AttachmentMeta, PortfolioItem } from '@/domain/types';
import { paiseToRupeeInput, parseRupeesToPaise } from '@/domain/money';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/Feedback';
import { SelectField, TextArea, TextField } from '@/components/ui/Field';
import { DemoLabel } from '@/components/ui/Badge';
import { AttachmentList, AttachmentThumb, FilePicker } from '@/components/domain/Attachments';
import { formatBudgetRange, formatMonthYear } from '@/lib/format';

interface Draft {
  title: string;
  category: string;
  description: string;
  valueMin: string;
  valueMax: string;
  completedOn: string;
  city: string;
  images: AttachmentMeta[];
}

const blank = (today: string): Draft => ({ title: '', category: '', description: '', valueMin: '', valueMax: '', completedOn: today, city: 'Pune', images: [] });

function fromItem(p: PortfolioItem): Draft {
  return {
    title: p.title,
    category: p.category,
    description: p.description,
    valueMin: p.approxValue ? paiseToRupeeInput(p.approxValue.minPaise) : '',
    valueMax: p.approxValue ? paiseToRupeeInput(p.approxValue.maxPaise) : '',
    completedOn: p.completedOn,
    city: p.city,
    images: p.images,
  };
}

function PortfolioDialog({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: PortfolioItem | null }) {
  const command = useCommand();
  const today = todayISO();
  const [d, setD] = useState<Draft>(() => (editing ? fromItem(editing) : blank(today)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const save = () => {
    const min = d.valueMin.trim() ? parseRupeesToPaise(d.valueMin) : null;
    const max = d.valueMax.trim() ? parseRupeesToPaise(d.valueMax) : null;
    const errs: Record<string, string> = {};
    if ((d.valueMin.trim() && min === null) || (d.valueMax.trim() && max === null)) errs.approxValue = 'Enter rupee amounts, e.g. 150000.';
    if ((min === null) !== (max === null) && !errs.approxValue) errs.approxValue = 'Enter both a minimum and a maximum, or leave both blank.';
    if (!(SERVICE_CATEGORY_IDS as ReadonlyArray<string>).includes(d.category)) errs.category = 'Choose a category.';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const input: PortfolioInput = {
      title: d.title,
      category: d.category as PortfolioInput['category'],
      description: d.description,
      approxValue: min !== null && max !== null ? { minPaise: min, maxPaise: max } : null,
      completedOn: d.completedOn,
      city: d.city,
      images: d.images,
    };
    const r = command((s, c) => savePortfolioItem(s, (editing?.id as PortfolioItemId) ?? null, input, c), { success: editing ? 'Portfolio entry updated.' : 'Portfolio entry added.', quietValidation: true });
    if (r.ok) onClose();
    else if (r.error.fieldErrors) setErrors(r.error.fieldErrors);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Edit portfolio entry' : 'Add portfolio entry'}
      description="Describe completed work owners can relate to. In this demo, photos are previews only and aren’t uploaded."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{editing ? 'Save changes' : 'Add entry'}</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <TextField label="Title" required value={d.title} error={errors.title} onChange={(e) => set('title', e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Category" required placeholder="Choose a category" options={categoryOptions} value={d.category} error={errors.category} onChange={(e) => set('category', e.target.value)} />
          <TextField label="City" required value={d.city} error={errors.city} onChange={(e) => set('city', e.target.value)} />
        </div>
        <TextArea label="What was done" required rows={4} value={d.description} error={errors.description} onChange={(e) => set('description', e.target.value)} maxChars={800} currentLength={d.description.length} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField type="date" label="Completed on" required max={today} value={d.completedOn} error={errors.completedOn} onChange={(e) => set('completedOn', e.target.value)} />
          <TextField label="Approx. value from (₹)" optional inputMode="decimal" value={d.valueMin} error={errors.approxValue} onChange={(e) => set('valueMin', e.target.value)} />
          <TextField label="Approx. value up to (₹)" optional inputMode="decimal" value={d.valueMax} onChange={(e) => set('valueMax', e.target.value)} />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Photos</p>
          <FilePicker imagesOnly max={6} current={d.images.length} onAdd={(added) => set('images', [...d.images, ...added])} />
          <AttachmentList className="mt-3" files={d.images} empty="No photos yet." onRemove={(f) => set('images', d.images.filter((x) => x.id !== f.id))} />
          {errors.images ? <p className="text-sm text-bad">{errors.images}</p> : null}
        </div>
      </div>
    </Dialog>
  );
}

export function PortfolioPage() {
  const data = useData();
  const me = useActorId();
  const command = useCommand();
  const [editing, setEditing] = useState<PortfolioItem | 'new' | null>(null);
  const [removing, setRemoving] = useState<PortfolioItem | null>(null);
  const items = useMemo(() => Object.values(data.portfolio).filter((p) => p.contractorId === me).sort((a, b) => b.completedOn.localeCompare(a.completedOn)), [data, me]);

  return (
    <>
      <PageHeader
        title="Portfolio"
        crumbs={[{ label: 'Home', to: '/contractor' }, { label: 'Portfolio' }]}
        meta={<span>Past work shown on your public profile. Three or more entries with photos makes your profile complete.</span>}
        actions={
          <Button icon={<Plus aria-hidden className="size-4" />} onClick={() => setEditing('new')}>
            Add entry
          </Button>
        }
      />
      {items.length ? (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <li key={p.id} className="flex flex-col border border-line bg-surface">
              {p.images[0] ? (
                <AttachmentThumb file={p.images[0]} className="aspect-[4/3] w-full rounded-none border-0 border-b" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center border-b border-line bg-sunken text-sm text-ink-3">No photo</div>
              )}
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <h2 className="font-semibold">{p.title}</h2>
                <p className="text-sm text-ink-3">
                  {categoryLabel(p.category)} · {p.city} · {formatMonthYear(p.completedOn)}
                  {p.approxValue ? ` · ${formatBudgetRange(p.approxValue.minPaise, p.approxValue.maxPaise)}` : ''}
                </p>
                <p className="line-clamp-3 text-sm">{p.description}</p>
                {p.isSeed ? <DemoLabel className="self-start">Sample entry</DemoLabel> : null}
                <div className="mt-auto flex gap-2 pt-3">
                  <Button size="sm" variant="secondary" icon={<Pencil aria-hidden className="size-4" />} onClick={() => setEditing(p)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" icon={<Trash2 aria-hidden className="size-4" />} onClick={() => setRemoving(p)}>
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<Images />} title="No portfolio entries yet" action={<Button onClick={() => setEditing('new')}>Add your first entry</Button>}>
          Owners compare contractors on past work. Add a few completed projects with a short description.
        </EmptyState>
      )}
      {editing ? <PortfolioDialog open onClose={() => setEditing(null)} editing={editing === 'new' ? null : editing} /> : null}
      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove this portfolio entry?"
        body={removing ? `“${removing.title}” will no longer appear on your profile. You can undo straight after.` : ''}
        confirmLabel="Remove"
        tone="danger"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          const item = removing;
          setRemoving(null);
          if (!item) return;
          command((s, c) => removePortfolioItem(s, item.id as PortfolioItemId, c), {
            success: 'Portfolio entry removed.',
            undo: { run: (removed) => command((s, c) => restorePortfolioItem(s, removed, c), { success: 'Portfolio entry restored.' }) },
          });
        }}
      />
    </>
  );
}
