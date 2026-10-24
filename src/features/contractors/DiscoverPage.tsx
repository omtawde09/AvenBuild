import { useMemo } from 'react';
import { Link } from 'react-router';
import { MapPin, SearchX } from 'lucide-react';
import { useData, todayISO } from '@/app/store/demoStore';
import { buildContractorRows, defaultDiscoveryFilters, filterContractors, knownCities, type DiscoverySort } from '@/domain/matching/filters';
import { SERVICE_CATEGORY_IDS, categoryLabel, categoryOptions } from '@/data/categories';
import type { UserId } from '@/domain/ids';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { Checkbox, InlineSelect } from '@/components/ui/Field';
import { ListToolbar, type ActiveFilter } from '@/components/ui/ListToolbar';
import { RatingInline } from '@/components/domain/Reputation';
import { availabilityLabel } from '@/lib/labels';
import { pickEnum, useUrlState } from '@/lib/useUrlState';
import { cn } from '@/lib/cn';
import { ShortlistButton } from './ContractorActions';

const SORTS = ['rating', 'reviews', 'experience', 'name'] as const;
const defaults = { q: '', category: '', city: '', minRating: '0', minYears: '0', available: false, portfolio: false, sort: 'rating' as DiscoverySort };

export function DiscoverPage() {
  const data = useData();
  const today = todayISO();
  const [f, update, reset] = useUrlState(defaults, (raw) => ({
    ...(raw.q !== undefined ? { q: raw.q } : {}),
    ...(pickEnum(raw.category, SERVICE_CATEGORY_IDS) ? { category: raw.category } : {}),
    ...(raw.city ? { city: raw.city } : {}),
    ...(pickEnum(raw.minRating, ['3', '4', '4.5'] as const) ? { minRating: raw.minRating } : {}),
    ...(pickEnum(raw.minYears, ['5', '10'] as const) ? { minYears: raw.minYears } : {}),
    ...(raw.available === 'true' ? { available: true } : {}),
    ...(raw.portfolio === 'true' ? { portfolio: true } : {}),
    ...(pickEnum(raw.sort, SORTS) ? { sort: pickEnum(raw.sort, SORTS) } : {}),
  }));

  const rows = useMemo(() => buildContractorRows(data), [data]);
  const cities = useMemo(() => knownCities(data), [data]);
  const visible = useMemo(
    () =>
      filterContractors(
        rows,
        {
          ...defaultDiscoveryFilters,
          query: f.q,
          category: (pickEnum(f.category, SERVICE_CATEGORY_IDS) ?? '') as typeof defaultDiscoveryFilters.category,
          city: f.city,
          minRating: Number(f.minRating) as 0 | 3 | 4 | 4.5,
          minYears: Number(f.minYears) as 0 | 5 | 10,
          availableOnly: f.available,
          withPortfolio: f.portfolio,
          sort: f.sort,
        },
        today,
      ),
    [rows, f, today],
  );

  const active: ActiveFilter[] = [
    ...(f.q ? [{ key: 'q', label: `“${f.q}”`, clear: () => update({ q: '' }) }] : []),
    ...(f.category ? [{ key: 'category', label: categoryLabel(f.category as (typeof SERVICE_CATEGORY_IDS)[number]), clear: () => update({ category: '' }) }] : []),
    ...(f.city ? [{ key: 'city', label: f.city, clear: () => update({ city: '' }) }] : []),
    ...(f.minRating !== '0' ? [{ key: 'rating', label: `${f.minRating}+ rating`, clear: () => update({ minRating: '0' }) }] : []),
    ...(f.minYears !== '0' ? [{ key: 'years', label: `${f.minYears}+ years`, clear: () => update({ minYears: '0' }) }] : []),
    ...(f.available ? [{ key: 'available', label: 'Available soon', clear: () => update({ available: false }) }] : []),
    ...(f.portfolio ? [{ key: 'portfolio', label: 'Has portfolio', clear: () => update({ portfolio: false }) }] : []),
  ];

  const filters = (
    <>
      <InlineSelect aria-label="Service" value={f.category} onChange={(e) => update({ category: e.target.value })} options={[{ value: '', label: 'Any service' }, ...categoryOptions]} className="w-full lg:w-auto" />
      <InlineSelect aria-label="City" value={f.city} onChange={(e) => update({ city: e.target.value })} options={[{ value: '', label: 'Any city' }, ...cities.map((c) => ({ value: c, label: c }))]} className="w-full lg:w-auto" />
      <InlineSelect
        aria-label="Minimum rating"
        value={f.minRating}
        onChange={(e) => update({ minRating: e.target.value })}
        options={[
          { value: '0', label: 'Any rating' },
          { value: '3', label: '3+ rating' },
          { value: '4', label: '4+ rating' },
          { value: '4.5', label: '4.5+ rating' },
        ]}
        className="w-full lg:w-auto"
      />
      <InlineSelect
        aria-label="Minimum experience"
        value={f.minYears}
        onChange={(e) => update({ minYears: e.target.value })}
        options={[
          { value: '0', label: 'Any experience' },
          { value: '5', label: '5+ years' },
          { value: '10', label: '10+ years' },
        ]}
        className="w-full lg:w-auto"
      />
      <Checkbox label="Available within 2 weeks" checked={f.available} onChange={(e) => update({ available: e.target.checked })} className="min-h-11 items-center" />
      <Checkbox label="Has portfolio" checked={f.portfolio} onChange={(e) => update({ portfolio: e.target.checked })} className="min-h-11 items-center" />
    </>
  );

  return (
    <>
      <PageHeader title="Find contractors" crumbs={[{ label: 'Home', to: '/owner' }, { label: 'Find contractors' }]} />
      <ListToolbar
        query={f.q}
        onQuery={(q) => update({ q })}
        searchLabel="Search contractors"
        placeholder="Search by name, service or locality"
        filters={filters}
        sort={
          <InlineSelect
            aria-label="Sort contractors"
            value={f.sort}
            onChange={(e) => update({ sort: pickEnum(e.target.value, SORTS) ?? 'rating' })}
            options={[
              { value: 'rating', label: 'Highest rated' },
              { value: 'reviews', label: 'Most reviews' },
              { value: 'experience', label: 'Most experience' },
              { value: 'name', label: 'Name A–Z' },
            ]}
          />
        }
        active={active}
        onClearAll={reset}
        resultLabel={`${visible.length} ${visible.length === 1 ? 'contractor' : 'contractors'}`}
      />
      {visible.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {visible.map(({ profile, rating, portfolioCount }) => (
            <li key={profile.userId} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-start sm:px-2">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/owner/contractors/${profile.userId}`} className="text-lg font-semibold underline-offset-2 hover:underline">
                    {profile.businessName}
                  </Link>
                </div>
                <RatingInline rating={rating} />
                <p className="text-sm text-ink-2">{profile.services.map(categoryLabel).join(' · ')}</p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-3">
                  <span className="inline-flex items-center gap-1">
                    <MapPin aria-hidden className="size-3.5" />
                    {profile.serviceAreas.map((a) => a.city).join(', ')}
                  </span>
                  <span>{profile.yearsExperience} yrs experience</span>
                  <span>{portfolioCount} portfolio</span>
                  <span className={cn(profile.availability.status === 'unavailable' && 'text-bad')}>{availabilityLabel[profile.availability.status]}</span>
                </p>
              </div>
              <div className="flex gap-2 sm:flex-col sm:items-end">
                <ShortlistButton contractorId={profile.userId as UserId} compact />
                <Link to={`/owner/contractors/${profile.userId}`} className="inline-flex min-h-9 items-center px-1 text-sm font-semibold underline underline-offset-2">
                  View profile
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<SearchX />} title="No contractors match these filters" action={<Button variant="secondary" onClick={reset}>Clear filters</Button>}>
          {active.length ? `Active filters: ${active.map((a) => a.label).join(', ')}.` : 'Try a different search.'}
        </EmptyState>
      )}
    </>
  );
}
