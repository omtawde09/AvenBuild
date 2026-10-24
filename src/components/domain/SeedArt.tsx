import { cn } from '@/lib/cn';

/**
 * Original line illustrations used in place of photographs for seeded demo media (no external images).
 * Each key draws a simple, recognisable construction subject on a blueprint grid.
 */
const subjects: Record<string, { label: string; draw: React.ReactNode }> = {
  terrace: {
    label: 'Terrace with membrane layers',
    draw: (
      <>
        <path d="M20 120H220V140H20Z" fill="var(--color-sunken)" />
        <path d="M20 112H220" stroke="var(--color-brick)" strokeWidth={5} />
        <path d="M20 104H220" strokeDasharray="6 4" />
        <path d="M40 140V200M200 140V200M120 140V200" />
        <path d="M170 104V70H200V104" />
        <path d="M60 96l20-6M100 96l20-6M140 96l20-6" strokeOpacity={0.5} />
      </>
    ),
  },
  bathroom: {
    label: 'Bathroom wall and floor tiling',
    draw: (
      <>
        <path d="M30 40H210V190H30Z" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M30 ${60 + i * 22}H210`} strokeOpacity={0.45} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={`v${i}`} d={`M${52 + i * 22} 40V170`} strokeOpacity={0.3} />
        ))}
        <path d="M30 170H210" stroke="var(--color-brick)" strokeWidth={4} />
        <circle cx="160" cy="180" r="5" />
        <path d="M70 120h30v20H70Z" fill="var(--color-surface)" />
      </>
    ),
  },
  tiles: {
    label: 'Large-format floor tiles',
    draw: (
      <>
        <path d="M20 70L120 30L220 70L120 110Z" fill="var(--color-sunken)" />
        <path d="M70 50L170 90M70 90L170 50" strokeOpacity={0.5} />
        <path d="M20 70V160L120 200V110M220 70V160L120 200" />
        <path d="M120 110L220 70" stroke="var(--color-brick)" strokeWidth={3} />
      </>
    ),
  },
  basement: {
    label: 'Basement retaining wall',
    draw: (
      <>
        <path d="M20 60H90V200H20Z" fill="url(#art-earth)" stroke="none" />
        <path d="M90 40V200H220" strokeWidth={2.2} />
        <path d="M96 40V194H220" stroke="var(--color-brick)" strokeWidth={3} />
        <path d="M120 120c10-12 20 12 30 0s20 12 30 0" strokeOpacity={0.5} />
      </>
    ),
  },
  tank: {
    label: 'RCC water tank',
    draw: (
      <>
        <path d="M50 60H190V190H50Z" />
        <path d="M58 68H182V182H58Z" stroke="var(--color-brick)" strokeWidth={3} />
        <path d="M58 120c20-8 40 8 62 0s40 8 62 0" strokeOpacity={0.6} />
        <path d="M100 60V40H140V60" />
      </>
    ),
  },
  frame: {
    label: 'RCC frame under construction',
    draw: (
      <>
        {[50, 120, 190].map((x) => (
          <path key={x} d={`M${x} 200V50`} strokeWidth={4} />
        ))}
        <path d="M40 130H200M40 60H200" strokeWidth={5} />
        <path d="M40 54H200" stroke="var(--color-brick)" strokeWidth={2} />
        <path d="M205 200V40M225 200V40M205 80H225M205 120H225M205 160H225" strokeOpacity={0.5} />
      </>
    ),
  },
  brick: {
    label: 'Brick wall courses',
    draw: (
      <>
        {Array.from({ length: 7 }, (_, r) => (
          <g key={r}>
            <path d={`M20 ${60 + r * 20}H220`} strokeOpacity={0.6} />
            {Array.from({ length: 6 }, (_, c) => (
              <path key={c} d={`M${(r % 2 ? 40 : 20) + c * 36} ${60 + r * 20}V${80 + r * 20}`} strokeOpacity={0.5} />
            ))}
          </g>
        ))}
        <path d="M20 60H220V200H20Z" />
        <path d="M20 200H220" stroke="var(--color-brick)" strokeWidth={4} />
      </>
    ),
  },
  plumbing: {
    label: 'Supply and drainage lines',
    draw: (
      <>
        <path d="M30 60H150V150H210" strokeWidth={6} strokeOpacity={0.25} />
        <path d="M30 60H150V150H210" strokeWidth={2} />
        <path d="M60 200V110H110" stroke="var(--color-brick)" strokeWidth={3} />
        <circle cx="150" cy="60" r="7" fill="var(--color-surface)" />
        <circle cx="150" cy="150" r="7" fill="var(--color-surface)" />
        <path d="M200 140v20" strokeWidth={4} />
      </>
    ),
  },
  shed: {
    label: 'Steel portal frame shed',
    draw: (
      <>
        <path d="M30 190V100L120 50L210 100V190" strokeWidth={3} />
        <path d="M30 100L120 50L210 100" stroke="var(--color-brick)" strokeWidth={3} />
        {[60, 90, 120, 150, 180].map((x) => (
          <path key={x} d={`M${x} 190V${x <= 120 ? 100 - (x - 30) * 0.55 : 50 + (x - 120) * 0.55}`} strokeOpacity={0.4} />
        ))}
        <path d="M90 190V140H150V190" />
      </>
    ),
  },
  floor: {
    label: 'Trimix floor with saw-cut joints',
    draw: (
      <>
        <path d="M20 90L120 50L220 90L120 130Z" fill="var(--color-sunken)" />
        <path d="M45 80L145 120M70 70L170 110M95 60L195 100M70 110L170 70M45 100L145 60" strokeOpacity={0.45} />
        <path d="M20 90V110L120 150L220 110V90" />
        <path d="M120 150V130" stroke="var(--color-brick)" strokeWidth={3} />
      </>
    ),
  },
  well: {
    label: 'RCC ring well section',
    draw: (
      <>
        <path d="M60 40V200M180 40V200" strokeWidth={4} />
        {[70, 100, 130, 160].map((y) => (
          <path key={y} d={`M60 ${y}H180`} strokeOpacity={0.35} strokeDasharray="4 4" />
        ))}
        <path d="M60 170c20-8 40 8 60 0s40 8 60 0" stroke="var(--color-brick)" strokeWidth={3} />
        <path d="M40 40H200" />
      </>
    ),
  },
  paver: {
    label: 'Interlocking paver pattern',
    draw: (
      <>
        {Array.from({ length: 5 }, (_, r) =>
          Array.from({ length: 6 }, (_, c) => <rect key={`${r}-${c}`} x={22 + c * 34 + (r % 2) * 17} y={50 + r * 28} width={30} height={24} rx={2} strokeOpacity={0.7} />),
        )}
        <path d="M20 196H220" stroke="var(--color-brick)" strokeWidth={4} />
      </>
    ),
  },
};

export function SeedArt({ art, className, decorative = false }: { art: string | undefined; className?: string; decorative?: boolean }) {
  const subject = (art && subjects[art]) || subjects.terrace!;
  return (
    <svg
      viewBox="0 0 240 220"
      className={cn('block h-full w-full bg-surface text-ink', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `Illustration: ${subject.label}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="art-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
        </pattern>
        <pattern id="art-earth" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0V8" stroke="currentColor" strokeOpacity={0.35} strokeWidth={1} />
        </pattern>
      </defs>
      <rect width="240" height="220" fill="url(#art-grid)" stroke="none" />
      {subject.draw}
    </svg>
  );
}
