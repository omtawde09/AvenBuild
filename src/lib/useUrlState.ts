import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

type Primitive = string | number | boolean;

/**
 * Keep simple filter state in the URL so it survives refresh and back/forward.
 * Unknown or invalid values fall back to defaults via `sanitize`.
 */
export function useUrlState<T extends Record<string, Primitive>>(defaults: T, sanitize: (raw: Partial<Record<keyof T, string>>) => Partial<T>) {
  const [params, setParams] = useSearchParams();

  const state = useMemo(() => {
    const raw: Partial<Record<keyof T, string>> = {};
    for (const key of Object.keys(defaults) as Array<keyof T>) {
      const v = params.get(String(key));
      if (v !== null) raw[key] = v;
    }
    return { ...defaults, ...sanitize(raw) } as T;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaults/sanitize are static per call site
  }, [params]);

  const update = useCallback(
    (patch: Partial<T>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === defaults[k] || v === '' || v === false) next.delete(k);
            else next.set(k, String(v));
          }
          return next;
        },
        { replace: true },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaults are static per call site
    [setParams],
  );

  const reset = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const k of Object.keys(defaults)) next.delete(k);
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaults are static per call site
  }, [setParams]);

  return [state, update, reset] as const;
}

export function pickEnum<T extends string>(value: string | undefined, allowed: ReadonlyArray<T>): T | undefined {
  return value !== undefined && (allowed as ReadonlyArray<string>).includes(value) ? (value as T) : undefined;
}
