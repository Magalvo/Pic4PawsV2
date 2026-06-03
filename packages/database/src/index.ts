import type { CurrencyCode } from '@pic4paws/domain';

export type DatabaseCurrency = CurrencyCode;

export const databaseSchemaStatus = 'pending-drizzle-schema' as const;
