import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap select-none transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink-2 active:bg-black',
  accent: 'bg-brick text-white hover:bg-brick-strong',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-sunken',
  ghost: 'text-ink hover:bg-sunken',
  danger: 'border border-bad/40 bg-surface text-bad hover:bg-bad-tint',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm rounded-sm',
  md: 'min-h-11 px-4 text-[0.9375rem] rounded-sm',
  lg: 'min-h-12 px-5 text-base rounded-sm',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra?: string): string {
  return cn(base, variants[variant], sizes[size], extra);
}
