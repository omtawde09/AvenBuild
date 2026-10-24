export type DomainErrorCode = 'INVALID_TRANSITION' | 'NOT_FOUND' | 'FORBIDDEN' | 'VALIDATION' | 'CONFLICT';

export interface DomainError {
  code: DomainErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: DomainError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const fail = (code: DomainErrorCode, message: string, fieldErrors?: Record<string, string>): { ok: false; error: DomainError } =>
  fieldErrors ? { ok: false, error: { code, message, fieldErrors } } : { ok: false, error: { code, message } };
