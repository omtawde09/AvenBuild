import { useMemo } from 'react';
import { Link } from 'react-router';
import { Bookmark } from 'lucide-react';
import { useActorId, useData } from '@/app/store/demoStore';
import { aggregateReviews } from '@/domain/reviews/aggregate';
import { categoryLabel } from '@/data/categories';
import type { UserId } from '@/domain/ids';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { RatingInline } from '@/components/domain/Reputation';
import { formatDate } from '@/lib/format';
import { ShortlistButton } from './ContractorActions';

export function ShortlistPage() {
  const data = useData();
  const me = useActorId();
  const entries = useMemo(
    () =>
      Object.values(data.shortlist)
        .filter((s) => s.ownerId === me && data.contractorProfiles[s.contractorId])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data, me],
  );
  return (
    <>
      <PageHeader title="Shortlist" crumbs={[{ label: 'Home', to: '/owner' }, { label: 'Shortlist' }]} />
      {entries.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {entries.map((e) => {
            const p = data.contractorProfiles[e.contractorId]!;
            const rating = aggregateReviews(Object.values(data.reviews).filter((r) => r.contractorId === p.userId));
            return (
              <li key={e.contractorId} className="flex flex-wrap items-start justify-between gap-3 py-4 sm:px-2">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/owner/contractors/${p.userId}`} className="font-semibold underline-offset-2 hover:underline">
                      {p.businessName}
                    </Link>
                  </div>
                  <RatingInline rating={rating} />
                  <p className="text-sm text-ink-2">{p.services.map(categoryLabel).join(' · ')}</p>
                  <p className="text-xs text-ink-3">Saved {formatDate(e.createdAt)}</p>
                </div>
                <ShortlistButton contractorId={p.userId as UserId} compact />
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={<Bookmark />} title="Your shortlist is empty" action={<ButtonLink to="/owner/contractors">Find contractors</ButtonLink>}>
          Use “Shortlist” on a contractor’s profile or in search results to keep them here.
        </EmptyState>
      )}
    </>
  );
}
