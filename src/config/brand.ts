/**
 * Single editable brand configuration. "Evan Build" is a working name only —
 * no trademark clearance is implied. Colour tokens live in src/styles/index.css.
 */
export const brand = {
  name: 'Evan Build',
  shortName: 'Evan',
  tagline: 'Construction work, briefed clearly and built in the open.',
  wordmark: { primary: 'Evan', secondary: 'Build' },
  demoNotice: 'Demo mode — data is stored only in this browser and doesn’t sync to other devices or people.',
  demoNoticeShort: 'Demo · data stays in this browser',
} as const;
