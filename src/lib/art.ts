import type { Project } from '@/domain/types';

/** Labels for the bundled seed illustrations (see components/domain/SeedArt). */
export const seedArtLabels: Record<string, string> = {
  terrace: 'Terrace with membrane layers',
  bathroom: 'Bathroom wall and floor tiling',
  tiles: 'Large-format floor tiles',
  basement: 'Basement retaining wall',
  tank: 'RCC water tank',
  frame: 'RCC frame under construction',
  brick: 'Brick wall courses',
  plumbing: 'Supply and drainage lines',
  shed: 'Steel portal frame shed',
  floor: 'Trimix floor with saw-cut joints',
  well: 'RCC ring well section',
  paver: 'Interlocking paver pattern',
};

export function seedArtLabel(key: string | undefined): string {
  return (key && seedArtLabels[key]) || 'Illustration';
}

const categoryArt: Record<string, string> = {
  waterproofing: 'terrace',
  tiling: 'tiles',
  brickwork: 'brick',
  rcc: 'frame',
  plumbing: 'plumbing',
  paver: 'paver',
  peb: 'shed',
  fabrication: 'shed',
  trimix: 'floor',
  rcc_well: 'well',
  excavation: 'basement',
  electrical: 'plumbing',
};

export function projectArtKey(p: Pick<Project, 'category' | 'attachments'>): string {
  return p.attachments.find((a) => a.previewKind === 'seed')?.seedArt ?? (p.category ? (categoryArt[p.category] ?? 'frame') : 'frame');
}
