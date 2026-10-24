import { BrickWall, Building2, CircleDashed, Droplets, Grid3x3, Hammer, Layers, LayoutGrid, Shovel, Warehouse, Wrench, Zap, type LucideIcon } from 'lucide-react';
import type { ServiceCategoryId } from '@/data/categories';
import { cn } from '@/lib/cn';

const icons: Record<ServiceCategoryId, LucideIcon> = {
  rcc: Building2,
  brickwork: BrickWall,
  waterproofing: Droplets,
  plumbing: Wrench,
  electrical: Zap,
  excavation: Shovel,
  tiling: Grid3x3,
  fabrication: Hammer,
  peb: Warehouse,
  paver: LayoutGrid,
  rcc_well: CircleDashed,
  trimix: Layers,
};

/** Consistent icon per service category. Decorative: always pair with the category label. */
export function CategoryIcon({ category, className }: { category: ServiceCategoryId | null | undefined; className?: string }) {
  const Icon = (category && icons[category]) || Building2;
  return <Icon aria-hidden className={cn('size-5', className)} />;
}
