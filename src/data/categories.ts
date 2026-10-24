/** Service categories (generic construction trades common in the Indian market). */
export const SERVICE_CATEGORY_IDS = [
  'rcc',
  'brickwork',
  'waterproofing',
  'plumbing',
  'electrical',
  'excavation',
  'tiling',
  'fabrication',
  'peb',
  'paver',
  'rcc_well',
  'trimix',
] as const;
export type ServiceCategoryId = (typeof SERVICE_CATEGORY_IDS)[number];

export interface ServiceCategory {
  id: ServiceCategoryId;
  label: string;
  description: string;
  defaultUnit: 'sq_ft' | 'sq_m' | 'cu_m' | 'rft' | 'nos' | 'kg' | 'lump_sum' | 'day';
}

export const serviceCategories: Record<ServiceCategoryId, ServiceCategory> = {
  rcc: { id: 'rcc', label: 'RCC work', description: 'Footings, columns, beams and slabs in reinforced concrete.', defaultUnit: 'cu_m' },
  brickwork: { id: 'brickwork', label: 'Brickwork', description: 'Load-bearing and infill walls, compound walls, plastering.', defaultUnit: 'sq_ft' },
  waterproofing: { id: 'waterproofing', label: 'Waterproofing', description: 'Terraces, bathrooms, basements, tanks and wall seepage.', defaultUnit: 'sq_ft' },
  plumbing: { id: 'plumbing', label: 'Plumbing', description: 'Supply and drainage lines, fixtures, tanks and pumps.', defaultUnit: 'rft' },
  electrical: { id: 'electrical', label: 'Electrical work', description: 'Wiring, distribution boards, earthing and fixtures.', defaultUnit: 'nos' },
  excavation: { id: 'excavation', label: 'Excavation', description: 'Earthwork for foundations, trenches and site levelling.', defaultUnit: 'cu_m' },
  tiling: { id: 'tiling', label: 'Tile work', description: 'Floor, wall and bathroom tiling with surface preparation.', defaultUnit: 'sq_ft' },
  fabrication: { id: 'fabrication', label: 'Fabrication sheds', description: 'Steel sheds, canopies, grills and structural fabrication.', defaultUnit: 'sq_ft' },
  peb: { id: 'peb', label: 'PEB structures', description: 'Pre-engineered buildings for warehouses and workshops.', defaultUnit: 'sq_ft' },
  paver: { id: 'paver', label: 'Paver blocks', description: 'Driveways, parking and compound paving on prepared base.', defaultUnit: 'sq_ft' },
  rcc_well: { id: 'rcc_well', label: 'RCC wells', description: 'Ring wells and RCC lining for open wells.', defaultUnit: 'rft' },
  trimix: { id: 'trimix', label: 'Trimix flooring', description: 'Vacuum-dewatered concrete floors for industrial use.', defaultUnit: 'sq_ft' },
};

export const categoryOptions = SERVICE_CATEGORY_IDS.map((id) => ({ value: id, label: serviceCategories[id].label }));

export function categoryLabel(id: ServiceCategoryId): string {
  return serviceCategories[id].label;
}
