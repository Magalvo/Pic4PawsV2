# Work-Item: DB-SHELTER-GEO-001 - Canonical Shelter Coordinates

## Goal

Use a canonical geographic coordinate contract for shelters: decimal/numeric in Postgres and `number | null` at TypeScript boundaries, with validation before values reach persistence.

## States

- `absent`: no coordinate value is provided.
- `cleared`: a nullable coordinate is explicitly set to `null`.
- `valid`: latitude/longitude parsed to finite numbers inside allowed ranges.
- `invalid`: coordinate input is non-numeric or outside valid geographic ranges.

## Contract

- `shelters.latitude` and `shelters.longitude` are `numeric(9, 6)` in the database schema and initial migration SQL.
- Worker update payloads accept coordinate numbers or numeric strings and normalize them to `number`.
- Latitude must be between `-90` and `90`; longitude must be between `-180` and `180`.
- `null` or blank string clears a coordinate to `null`.
- Supabase shelter update persistence writes snake_case `latitude`/`longitude` columns from normalized numbers/nulls only.

## Affected files

- `packages/database/src/schema.ts`
- `packages/database/src/migration-artifacts.ts`
- `apps/workers/src/shelter-update.ts`
- `apps/workers/src/shelter-update-supabase.ts`
- `tests/database/core-schema.test.ts`
- `tests/database/migration-artifacts.test.ts`
- `tests/workers/shelter-update.test.ts`
- `tests/workers/shelter-update-supabase.test.ts`

## Completion Notes

- Changed Drizzle shelter coordinates from `text` to `numeric(9, 6)` with `mode: 'number'`.
- Updated initial migration SQL to use `numeric(9, 6)` for `latitude` and `longitude`.
- Added shelter update boundary parsing for numeric strings, numbers, null clearing and geographic range validation.
- Mapped normalized coordinate fields to Supabase `shelters.latitude` and `shelters.longitude`.
