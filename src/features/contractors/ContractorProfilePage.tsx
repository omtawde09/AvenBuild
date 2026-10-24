import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { MessageSquare, Send } from 'lucide-react';
import { useData } from '@/app/store/demoStore';
import type { UserId } from '@/domain/ids';
import { aggregateReviews } from '@/domain/reviews/aggregate';
import { portfolioCompleteness } from '@/domain/profile/commands';
import { categoryLabel } from '@/data/categories';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { DemoLabel } from '@/components/ui/Badge';
import { Facts, Notice, SectionHeading } from '@/components/ui/Feedback';
import { RatingBreakdown, RatingInline, VerificationTag } from '@/components/domain/Reputation';
import { AttachmentThumb } from '@/components/domain/Attachments';
import { RecordNotFound } from '@/features/public/NotFoundPage';
import { availabilityLabel } from '@/lib/labels';
import { formatBudgetRange, formatDate, formatMonthYear } from '@/lib/format';
import { ProjectPickerDialog, ShortlistButton } from './ContractorActions';

/** Owner-facing contractor profile. Every trust signal is labelled with what it is (and isn't). */
export function ContractorProfilePage() {
  const { contractorId = '' } = useParams();
  const data = useData();
  const [dialog, setDialog] = useState<'invite' | 'message' | null>(null);
  const profile = data.contractorProfiles[contractorId];
  const reviews = useMemo(() => Object.values(data.reviews).filter((r) => r.contractorId === contractorId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data, contractorId]);
  const portfolio = useMemo(() => Object.values(data.portfolio).filter((p) => p.contractorId === contractorId).sort((a, b) => b.completedOn.localeCompare(a.completedOn)), [data, contractorId]);

  if (!profile || profile.visibility === 'hidden') return <RecordNotFound what="contractor" backTo="/owner/contractors" backLabel="Back to search" />;
  const id = profile.userId as UserId;
  const rating = aggregateReviews(reviews);
  const completeness = portfolioCompleteness(data, profile);

  return (
    <>
      <PageHeader
        title={profile.businessName}
        crumbs={[{ label: 'Find contractors', to: '/owner/contractors' }, { label: profile.businessName }]}
        meta={
          <>
            {profile.isSeed ? <DemoLabel>Demo profile · fictional business</DemoLabel> : null}
            <RatingInline rating={rating} />
            <span>{profile.serviceAreas.map((a) => a.city).join(', ')}</span>
          </>
        }
        actions={
          <>
            <ShortlistButton contractorId={id} />
            <Button variant="secondary" icon={<MessageSquare aria-hidden className="size-4" />} onClick={() => setDialog('message')}>
              Message
            </Button>
            <Button icon={<Send aria-hidden className="size-4" />} onClick={() => setDialog('invite')}>
              Invite to quote
            </Button>
          </>
        }
      />

      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-10">
          <section aria-labelledby="about">
            <SectionHeading id="about" title="About" />
            <p className="mt-3 whitespace-pre-line">{profile.bio}</p>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Services">
              {profile.services.map((s) => (
                <li key={s} className="rounded-xs border border-line-strong bg-surface px-2 py-1 text-sm">
                  {categoryLabel(s)}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="portfolio">
            <SectionHeading id="portfolio" title={`Portfolio (${portfolio.length})`} description="Past work described by the contractor. Images in this demo are illustrations." />
            {portfolio.length ? (
              <ul className="mt-4 grid gap-6 sm:grid-cols-2">
                {portfolio.map((p) => (
                  <li key={p.id} className="space-y-2">
                    {p.images[0] ? <AttachmentThumb file={p.images[0]} className="aspect-[4/3] w-full" /> : null}
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-sm text-ink-3">
                      {categoryLabel(p.category)} · {p.city} · completed {formatMonthYear(p.completedOn)}
                      {p.approxValue ? ` · ${formatBudgetRange(p.approxValue.minPaise, p.approxValue.maxPaise)}` : ''}
                    </p>
                    <p className="text-sm">{p.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-3">No portfolio entries yet.</p>
            )}
          </section>

          <section aria-labelledby="reviews">
            <SectionHeading id="reviews" title="Reviews" description="Only owners of completed projects can leave a review — one per project." />
            <div className="mt-4">
              <RatingBreakdown rating={rating} />
            </div>
            {reviews.length ? (
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {reviews.map((r) => (
                  <li key={r.id} className="py-4">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <strong className="font-semibold">{r.rating}/5</strong>
                      <span className="text-ink-2">{r.projectTitle}</span>
                      <span className="text-ink-3">
                        · {r.reviewerLabel} · {formatDate(r.createdAt)}
                      </span>
                      {r.isSeed ? <DemoLabel>Sample review</DemoLabel> : null}
                    </p>
                    <p className="mt-1">{r.text}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>

        <aside className="space-y-8" aria-label="Business facts">
          <section aria-labelledby="facts" className="border border-line bg-surface p-4">
            <h2 id="facts" className="font-semibold">
              Business facts
            </h2>
            <Facts
              columns={1}
              className="mt-3"
              items={[
                { label: 'Experience', value: `${profile.yearsExperience} years` },
                { label: 'Team size', value: `${profile.teamSize} people` },
                { label: 'Availability', value: `${availabilityLabel[profile.availability.status]}${profile.availability.status !== 'unavailable' ? ` from ${formatDate(profile.availability.availableFrom)}` : ''}` },
                { label: 'Typical project size', value: formatBudgetRange(profile.typicalProjectRange.minPaise, profile.typicalProjectRange.maxPaise) },
                {
                  label: 'Areas served',
                  value: (
                    <ul className="space-y-1">
                      {profile.serviceAreas.map((a) => (
                        <li key={a.city}>
                          <strong className="font-semibold">{a.city}</strong>
                          {a.localities.length ? <span className="text-ink-2"> — {a.localities.join(', ')}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ),
                },
                { label: 'Response time', value: profile.responseTimeSampleHours !== null ? `Usually within ${profile.responseTimeSampleHours} hours (sample figure for this demo profile)` : 'Not enough activity yet' },
                { label: 'Site visits', value: profile.contactPreferences.siteVisits ? `Yes · ${profile.contactPreferences.preferredHours}` : 'On request' },
              ]}
            />
          </section>
          <section aria-labelledby="checks">
            <h2 id="checks" className="font-semibold">
              Credentials
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <VerificationTag what="Licence" status={profile.qualifications.licenceStatus} />
              <VerificationTag what="GST" status={profile.qualifications.gstStatus} />
            </div>
            <Notice tone="info" className="mt-3">
              This demo doesn’t check licences, GST numbers or identities. “Sample verification” only illustrates where a real check would appear.
            </Notice>
          </section>
          <section aria-labelledby="completeness">
            <h2 id="completeness" className="font-semibold">
              Profile completeness: {completeness.percent}%
            </h2>
            <p className="mt-1 text-sm text-ink-3">Counts a description, services, service areas, at least three portfolio entries and at least one entry with photos.</p>
          </section>
        </aside>
      </div>

      <ProjectPickerDialog contractorId={id} mode="invite" open={dialog === 'invite'} onClose={() => setDialog(null)} />
      <ProjectPickerDialog contractorId={id} mode="message" open={dialog === 'message'} onClose={() => setDialog(null)} />
    </>
  );
}
