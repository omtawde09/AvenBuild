/**
 * Ordered schema migrations: `migrations[n]` upgrades stored data from version n to n + 1.
 * Version 1 is the first schema, so there are no migrations yet. When the schema changes:
 * bump SCHEMA_VERSION in src/domain/types.ts and add `migrations[1] = (data) => upgradedData`.
 */
export const migrations: Record<number, (data: unknown) => unknown> = {};
