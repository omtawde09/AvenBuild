import { Link } from 'react-router';
import { Clock, Images, MapPin, Users } from 'lucide-react';
import type { DemoState } from '@/domain/types';
import { aggregateReviews } from '@/domain/reviews/aggregate';
import { availabilityLabel } from '@/lib/labels';
import { RatingInline } from '@/components/domain/Reputation';

/** Trust evidence shown next to a quote: reviews, experience, portfolio and typical response time. */
export function ContractorEvidence({ state, contractorId, compact = false }: { state: DemoState; contractorId: string; compact?: boolean }) {
  const profile = state.contractorProfiles[contractorId];
  if (!profile) return null;
  const rating = aggregateReviews(Object.values(state.reviews).filter((r) => r.contractorId === contractorId));
  const portfolio = Object.values(state.portfolio).filter((p) => p.contractorId === contractorId).length;
  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Link to={`/owner/contractors/${contractorId}`} className="font-semibold underline-offset-2 hover:underline">
          {profile.businessName}
        </Link>
      </div>
      <RatingInline rating={rating} />
      <ul className="space-y-1 text-ink-2">
        <li className="flex items-center gap-1.5">
          <Users aria-hidden className="size-3.5 shrink-0" />
          {profile.yearsExperience} years · team of {profile.teamSize}
        </li>
        <li className="flex items-center gap-1.5">
          <MapPin aria-hidden className="size-3.5 shrink-0" />
          {profile.serviceAreas.map((a) => a.city).join(', ')}
        </li>
        <li className="flex items-center gap-1.5">
          <Images aria-hidden className="size-3.5 shrink-0" />
          {portfolio} portfolio {portfolio === 1 ? 'entry' : 'entries'}
        </li>
        {profile.responseTimeSampleHours !== null ? (
          <li className="flex items-center gap-1.5">
            <Clock aria-hidden className="size-3.5 shrink-0" />
            Usually replies within {profile.responseTimeSampleHours} h
          </li>
        ) : null}
        {!compact ? <li>{availabilityLabel[profile.availability.status]}</li> : null}
      </ul>
    </div>
  );
}
