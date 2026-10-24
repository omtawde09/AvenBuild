import { useCallback } from 'react';
import { toast } from '@/components/ui/toast';
import type { DomainError } from '@/domain/result';
import type { CommandContext, CommandResult } from '@/domain/tx';
import type { DemoState } from '@/domain/types';
import { useDemoStore } from './demoStore';

export type CommandOutcome<V> = { ok: true; value: V } | { ok: false; error: DomainError };

/**
 * Runs a domain command and reports the outcome. Validation errors are returned for field display
 * (and summarised in a toast unless `quietValidation`); other failures always show an error toast.
 * Success toasts only appear when `success` is given — never before the command actually succeeded.
 */
export function useCommand() {
  const run = useDemoStore((s) => s.run);
  return useCallback(
    <V>(
      command: (state: DemoState, ctx: CommandContext) => CommandResult<V>,
      opts: { success?: string | ((value: V) => string); undo?: { label?: string; run: (value: V) => void }; quietValidation?: boolean } = {},
    ): CommandOutcome<V> => {
      const result = run(command);
      if (!result.ok) {
        if (!(result.error.code === 'VALIDATION' && opts.quietValidation)) toast.error(result.error.message);
        return result;
      }
      const value = result.value as V;
      if (opts.success) {
        const message = typeof opts.success === 'function' ? opts.success(value) : opts.success;
        const undo = opts.undo;
        if (undo) toast.success(message, { label: undo.label ?? 'Undo', run: () => undo.run(value) });
        else toast.success(message);
      }
      return { ok: true, value };
    },
    [run],
  );
}
