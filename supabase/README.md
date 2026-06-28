# Supabase Local Contract

This folder is for local/disposable Supabase validation only.

No production project should be linked from this repository until a later work item explicitly approves remote environments, secrets handling and migration execution.

## Migrations

All migration SQL is defined in `packages/database/src/migration-artifacts.ts` and rendered via `renderMigrationArtifact(artifact)`. The `.sql` files in `supabase/migrations/` are pre-generated and committed — regenerate them after changing migration artifacts with:

```sh
npm run db:generate-migrations
```

| # | Artifact export | Description |
|---|---|---|
| 0001 | `initialDatabaseMigration` | Core schema, enums, RLS policies |
| 0002 | `notificationsMigration` | `notifications` table and `notification_type` enum |
| 0003 | `registerShelterMigration` | `register_shelter` RPC (security definer, service_role only) |
| 0004 | `processPaymentWebhookEventMigration` | `process_payment_webhook_event` RPC |
| 0005 | `registerUserMigration` | `register_user` RPC — inserts `public.users` profile after Worker creates the Supabase auth user via `auth.admin.createUser()` |

| 0006 | `pushTokensMigration` | Push notification tokens and owner RLS |
| 0007 | `manualDonationTierMigration` | Manual donation tier and shelter payment configuration |
| 0008 | `eupagoProviderMigration` | Per-shelter automated payment provider credentials |
| 0009 | `paymentConfigRlsMigration` | Server-only RLS and privileges for payment configuration |

## Database Policy Tests

Policy tests live in `supabase/tests/` and run against the local disposable database:

```sh
supabase test db
```

## Cold Start

1. Review `supabase/config.toml`.
2. Start the local Supabase stack: `supabase start`
3. Apply all migrations: `supabase db reset`
4. Verify: `supabase migration list --local`

Do not use `supabase link`, `supabase db push`, project refs or access tokens in this phase.
