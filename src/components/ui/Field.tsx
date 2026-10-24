import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

export const controlClasses =
  'block w-full min-w-0 min-h-11 rounded-sm border border-line-strong bg-surface px-3 py-2 text-[0.9375rem] text-ink ' +
  'placeholder:text-ink-3 focus-visible:border-ink aria-invalid:border-bad disabled:bg-sunken disabled:text-ink-3';

interface FieldShellProps {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  error?: string | undefined;
  required?: boolean | undefined;
  optional?: boolean | undefined;
  children: ReactNode;
  className?: string | undefined;
  hideLabel?: boolean | undefined;
}

/** Label + description + error wrapper shared by all form controls. */
export function FieldShell({ id, label, description, error, required, optional, children, className, hideLabel }: FieldShellProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('text-sm font-semibold text-ink', hideLabel && 'sr-only')}>
        {label}
        {required ? <span className="text-bad"> *</span> : null}
        {optional ? <span className="font-normal text-ink-3"> (optional)</span> : null}
      </label>
      {description ? (
        <p id={`${id}-desc`} className="text-sm text-ink-3">
          {description}
        </p>
      ) : null}
      {children}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm text-bad">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function describedBy(id: string, description?: ReactNode, error?: string): string | undefined {
  const ids = [description ? `${id}-desc` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

interface Common {
  label: ReactNode;
  description?: ReactNode;
  error?: string | undefined;
  optional?: boolean;
  shellClassName?: string;
  hideLabel?: boolean;
}

type TextFieldProps = Common &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
    suffix?: ReactNode;
    prefix?: ReactNode;
  };

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, description, error, optional, shellClassName, hideLabel, id, className, suffix, prefix, required, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const input = (
    <input
      ref={ref}
      id={fieldId}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(fieldId, description, error)}
      aria-required={required || undefined}
      className={cn(controlClasses, prefix ? 'pl-8' : null, suffix ? 'pr-16' : null, className)}
      {...rest}
    />
  );
  return (
    <FieldShell
      id={fieldId}
      label={label}
      description={description}
      error={error}
      required={required}
      optional={optional}
      className={shellClassName}
      hideLabel={hideLabel}
    >
      {prefix || suffix ? (
        <div className="relative">
          {prefix ? (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-3">{prefix}</span>
          ) : null}
          {input}
          {suffix ? (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-3">
              {suffix}
            </span>
          ) : null}
        </div>
      ) : (
        input
      )}
    </FieldShell>
  );
});

type TextAreaProps = Common & TextareaHTMLAttributes<HTMLTextAreaElement> & { maxChars?: number; currentLength?: number };

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, description, error, optional, shellClassName, hideLabel, id, className, required, maxChars, currentLength, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      description={description}
      error={error}
      required={required}
      optional={optional}
      className={shellClassName}
      hideLabel={hideLabel}
    >
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, description, error)}
        aria-required={required || undefined}
        className={cn(controlClasses, 'min-h-28 leading-relaxed', className)}
        {...rest}
      />
      {maxChars !== undefined && currentLength !== undefined ? (
        <p className={cn('text-right font-mono text-xs', currentLength > maxChars ? 'text-bad' : 'text-ink-3')}>
          {currentLength}/{maxChars}
        </p>
      ) : null}
    </FieldShell>
  );
});

export interface Option {
  value: string;
  label: string;
}

type SelectFieldProps = Common &
  SelectHTMLAttributes<HTMLSelectElement> & { options: ReadonlyArray<Option>; placeholder?: string };

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, description, error, optional, shellClassName, hideLabel, id, className, required, options, placeholder, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      description={description}
      error={error}
      required={required}
      optional={optional}
      className={shellClassName}
      hideLabel={hideLabel}
    >
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, description, error)}
        aria-required={required || undefined}
        className={cn(controlClasses, 'pr-8', className)}
        {...rest}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});

/** Compact select for toolbars. Callers must pass aria-label. */
export const InlineSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { options: ReadonlyArray<Option>; 'aria-label': string }
>(function InlineSelect({ options, className, ...rest }, ref) {
  return (
    <select ref={ref} className={cn(controlClasses.replace('w-full ', ''), 'w-auto pr-8', className)} {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        ref={ref}
        id={fieldId}
        type="checkbox"
        aria-describedby={description ? `${fieldId}-desc` : undefined}
        className="mt-0.5 size-5 shrink-0 accent-brick"
        {...rest}
      />
      <div className="min-w-0">
        <label htmlFor={fieldId} className="text-[0.9375rem] text-ink">
          {label}
        </label>
        {description ? (
          <p id={`${fieldId}-desc`} className="text-sm text-ink-3">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
});
