import type { CurrencyCode } from '@pic4paws/domain';

export type DatabaseCurrency = CurrencyCode;

export const databaseSchemaStatus = 'drizzle-schema-contract-defined' as const;

export * from './schema';
export * from './rls-policies';
export * from './rls-sql';
export * from './migration-artifacts';
export * from './supabase-local';
export * from './media-assets';
export * from './pet-drafts';
