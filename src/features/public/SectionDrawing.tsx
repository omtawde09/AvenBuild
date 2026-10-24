/**
 * Original construction section drawing (two-storey frame under construction) used as
 * landing-page art. Pure SVG line work — no external imagery or network requests.
 */
export function SectionDrawing({ className }: { className?: string }) {
  const hatch = Array.from({ length: 22 }, (_, i) => i);
  return (
    <svg
      viewBox="0 0 560 460"
      role="img"
      aria-labelledby="section-title section-desc"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
    >
      <title id="section-title">Section drawing of a two-storey building under construction</title>
      <desc id="section-desc">
        Line drawing showing footings, RCC columns and slabs, brick infill walls, scaffolding and a terrace waterproofing layer
        highlighted in the accent colour, with annotated dimensions.
      </desc>
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
        </pattern>
        <pattern id="earth" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0V10" stroke="currentColor" strokeOpacity={0.35} strokeWidth={1} />
        </pattern>
      </defs>
      <rect width="560" height="460" fill="url(#grid)" stroke="none" />

      {/* ground and earth */}
      <rect x="20" y="372" width="520" height="60" fill="url(#earth)" stroke="none" />
      <path d="M20 372H540" strokeWidth={2} />

      {/* footings */}
      {[110, 250, 390].map((x) => (
        <g key={x}>
          <path d={`M${x - 26} 420H${x + 26}V404H${x - 26}Z`} fill="var(--color-sunken)" />
          <path d={`M${x - 9} 404V372`} strokeWidth={2} />
        </g>
      ))}

      {/* columns */}
      {[110, 250, 390].map((x) => (
        <rect key={x} x={x - 9} y={150} width={18} height={222} fill="var(--color-surface)" strokeWidth={1.8} />
      ))}

      {/* slabs */}
      <rect x="86" y="262" width="328" height="14" fill="var(--color-surface)" strokeWidth={1.8} />
      <rect x="86" y="150" width="328" height="14" fill="var(--color-surface)" strokeWidth={1.8} />

      {/* terrace waterproofing (accent) */}
      <path d="M80 146H420" stroke="var(--color-brick)" strokeWidth={5} />
      <path d="M80 146V128M420 146V128" stroke="var(--color-brick)" strokeWidth={3} />

      {/* brick infill, ground floor bay */}
      <g strokeOpacity={0.55} strokeWidth={1}>
        {hatch.slice(0, 9).map((i) => (
          <path key={`b${i}`} d={`M119 ${284 + i * 10}H241`} />
        ))}
        {hatch.slice(0, 9).map((i) => (
          <path key={`v${i}`} d={`M${i % 2 === 0 ? 150 : 170} ${276 + i * 10}V${286 + i * 10}M${i % 2 === 0 ? 200 : 220} ${276 + i * 10}V${286 + i * 10}`} />
        ))}
      </g>
      {/* window opening, right bay */}
      <rect x="292" y="300" width="64" height="44" strokeDasharray="4 3" />

      {/* first-floor bay with door opening */}
      <rect x="150" y="196" width="40" height="66" strokeDasharray="4 3" />
      <g strokeOpacity={0.55} strokeWidth={1}>
        {hatch.slice(0, 9).map((i) => (
          <path key={`f${i}`} d={`M259 ${172 + i * 10}H381`} />
        ))}
      </g>

      {/* scaffolding */}
      <g strokeOpacity={0.7}>
        <path d="M444 372V96M484 372V96" />
        {[110, 160, 210, 260, 310, 360].map((y) => (
          <path key={y} d={`M440 ${y}H488`} />
        ))}
        {[110, 160, 210, 260, 310].map((y) => (
          <path key={`x${y}`} d={`M444 ${y}L484 ${y + 50}`} strokeOpacity={0.4} />
        ))}
      </g>

      {/* dimension lines */}
      <g strokeWidth={1}>
        <path d="M50 164V262M46 164H54M46 262H54" />
        <path d="M50 276V372M46 276H54M46 372H54" />
        <path d="M110 446H250M110 442V450M250 442V450" />
      </g>

      {/* annotations */}
      <g fontFamily="var(--font-mono)" fontSize="11" fill="currentColor" stroke="none" letterSpacing="0.03em">
        <text x="82" y="118" fill="var(--color-brick)">TERRACE WATERPROOFING · APP MEMBRANE</text>
        <text x="20" y="218" transform="rotate(-90 20 218)">3.0 M</text>
        <text x="20" y="330" transform="rotate(-90 20 330)">3.0 M</text>
        <text x="150" y="458">4.2 M C/C</text>
        <text x="262" y="160" fill="var(--color-ink-3)">RCC SLAB 125</text>
        <text x="122" y="356" fill="var(--color-ink-3)">BRICKWORK 230</text>
        <text x="292" y="294" fill="var(--color-ink-3)">W1</text>
        <text x="150" y="190" fill="var(--color-ink-3)">D1</text>
        <text x="416" y="90" fill="var(--color-ink-3)">SCAFFOLD</text>
        <text x="372" y="396" fill="var(--color-ink-3)">FOOTING F1</text>
      </g>
    </svg>
  );
}
