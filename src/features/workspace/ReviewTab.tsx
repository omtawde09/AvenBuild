import { useId, useState } from 'react';
import { Link } from 'react-router';
import { Star } from 'lucide-react';
import { useCommand } from '@/app/store/useCommand';
import type { WorkspaceId } from '@/domain/ids';
import { reviewEligibility, submitReview, type ReviewInput } from '@/domain/reviews/commands';
import { partyName } from '@/domain/messages/selectors';
import { Button } from '@/components/ui/Button';
import { FieldError, TextArea } from '@/components/ui/Field';
import { Notice, SectionHeading } from '@/components/ui/Feedback';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useWorkspace } from './context';

function ScoreInput({ legend, value, onChange, optional, error }: { legend: string; value: number | null; onChange: (v: number | null) => void; optional?: boolean; error?: string | undefined }) {
  const name = useId();
  return (
    <fieldset aria-invalid={error ? true : undefined}>
      <legend className="text-sm font-semibold">
        {legend} {optional ? <span className="font-normal text-ink-3">(optional)</span> : <span className="text-bad">*</span>}
      </legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className={cn(
              'flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1 rounded-sm border px-2 text-sm font-medium has-focus-visible:outline-2 has-focus-visible:outline-brick',
              value !== null && n <= value ? 'border-brick bg-brick-tint text-brick-strong' : 'border-line-strong bg-surface',
            )}
          >
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" />
            <Star aria-hidden className={cn('size-4', value !== null && n <= value ? 'fill-brick text-brick' : 'text-ink-3')} />
            <span>{n}</span>
          </label>
        ))}
        {optional && value !== null ? (
          <button type="button" onClick={() => onChange(null)} className="min-h-11 px-2 text-sm underline underline-offset-2">
            Clear
          </button>
        ) : null}
      </div>
      {error ? <div className="mt-1.5"><FieldError>{error}</FieldError></div> : null}
    </fieldset>
  );
}

/** One review per completed project, by its owner. Aggregates on the profile are recomputed from records. */
export function ReviewTab() {
  const { ws, data, me, role, project } = useWorkspace();
  const command = useCommand();
  const existing = Object.values(data.reviews).find((r) => r.projectId === project.id);
  const eligibility = reviewEligibility(data, ws.id, me);
  const [form, setForm] = useState<ReviewInput>({ rating: 0, communication: null, quality: null, scheduleClarity: null, text: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const contractor = partyName(data, ws.contractorId);

  if (existing) {
    return (
      <section className="max-w-2xl" aria-labelledby="review-done">
        <SectionHeading id="review-done" title={role === 'owner' ? 'Your review' : `Review from ${partyName(data, ws.ownerId)}`} />
        <div className="mt-3 border border-line bg-surface p-4">
          <p className="text-lg font-semibold">{existing.rating}/5</p>
          <p className="text-sm text-ink-3">
            {existing.reviewerLabel} · {formatDate(existing.createdAt)}
          </p>
          <dl className="mt-2 flex flex-wrap gap-x-4 text-sm text-ink-2">
            <div>
              <dt className="inline">Communication: </dt>
              <dd className="inline">{existing.dimensions.communication ?? '—'}</dd>
            </div>
            <div>
              <dt className="inline">Quality: </dt>
              <dd className="inline">{existing.dimensions.quality ?? '—'}</dd>
            </div>
            <div>
              <dt className="inline">Schedule clarity: </dt>
              <dd className="inline">{existing.dimensions.scheduleClarity ?? '—'}</dd>
            </div>
          </dl>
          <p className="mt-3">{existing.text}</p>
        </div>
        <p className="mt-3 text-sm text-ink-3">Reviews can’t be edited or duplicated in this demo. {role === 'owner' ? <Link to={`/owner/contractors/${ws.contractorId}`} className="font-semibold underline underline-offset-2">See it on {contractor}’s profile</Link> : null}</p>
      </section>
    );
  }

  if (!eligibility.ok) {
    return (
      <Notice tone="info" title="No review yet" className="max-w-2xl">
        {role === 'owner' ? eligibility.reason : 'The owner can leave a review once the project is complete. It will appear here and on your profile.'}
      </Notice>
    );
  }

  return (
    <form
      noValidate
      className="grid max-w-2xl gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        const r = command((s, c) => submitReview(s, ws.id as WorkspaceId, form, c), { success: `Thanks — your review of ${contractor} is published on their profile.`, quietValidation: true });
        if (!r.ok && r.error.fieldErrors) setErrors(r.error.fieldErrors);
      }}
    >
      <div>
        <h2 className="text-xl font-semibold">Review {contractor}</h2>
        <p className="mt-1 text-sm text-ink-2">Be specific about what went well and what didn’t. Reviews are attributed to your first name and locality.</p>
      </div>
      <ScoreInput legend="Overall rating" value={form.rating || null} onChange={(v) => setForm({ ...form, rating: v ?? 0 })} error={errors.rating} />
      <div className="grid gap-5 sm:grid-cols-3">
        <ScoreInput legend="Communication" optional value={form.communication} onChange={(v) => setForm({ ...form, communication: v })} error={errors.communication} />
        <ScoreInput legend="Quality of work" optional value={form.quality} onChange={(v) => setForm({ ...form, quality: v })} error={errors.quality} />
        <ScoreInput legend="Schedule clarity" optional value={form.scheduleClarity} onChange={(v) => setForm({ ...form, scheduleClarity: v })} error={errors.scheduleClarity} />
      </div>
      <TextArea label="Your experience" required rows={5} value={form.text} error={errors.text} onChange={(e) => setForm({ ...form, text: e.target.value })} maxChars={1500} currentLength={form.text.length} />
      <Button type="submit" variant="accent" className="justify-self-start">
        Publish review
      </Button>
    </form>
  );
}
