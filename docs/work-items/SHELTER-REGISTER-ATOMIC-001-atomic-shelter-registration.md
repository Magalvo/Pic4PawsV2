# Work-Item: SHELTER-REGISTER-ATOMIC-001 — Atomic Shelter Registration

status: draft

## 1. Context & Problem

`SHELTER-REGISTER-001` (PR #132) implemented `registerShelter` with two sequential Supabase REST calls — one INSERT into `shelters`, then one INSERT into `shelter_memberships`. If the membership insert fails after the shelter insert has committed, a "zombie" shelter row exists in the database with `verification_status: draft` and no owner. There is no RLS or application path that surfaces this row, so it requires manual DB cleanup.

Flagged in audit report `docs/audits/2026-06-13-sdd-audit-prs-129-133.md` as D1 (Medium severity).

## 2. Goal

Make shelter registration atomic: either both the `shelters` row and the `shelter_memberships` row are created, or neither is. Achieve this by extracting the two-insert logic into a Postgres function called via `client.rpc()`, and extending `SupabaseClientLike` to expose the `rpc` method.

## 3. States / Contract

The external contract of `registerShelter(input, actorUserId)` does not change:
- Returns `{ shelterId: string }` on success
- Throws `SupabaseShelterRegistrationRepositoryError` on any DB error

The Postgres function signature:

```sql
create or replace function register_shelter(
  p_shelter_id  uuid,
  p_name        text,
  p_slug        text,
  p_kind        text,
  p_city        text,
  p_district    text,
  p_country_code text,
  p_public_email text,
  p_public_phone text,
  p_description  text,
  p_membership_id uuid,
  p_user_id      uuid
) returns uuid
language plpgsql
security definer
as $$
begin
  insert into shelters (id, name, slug, kind, verification_status, city, district,
                        country_code, public_email, public_phone, description)
  values (p_shelter_id, p_name, p_slug, p_kind, 'draft', p_city, p_district,
          p_country_code, p_public_email, p_public_phone, p_description);

  insert into shelter_memberships (id, shelter_id, user_id, role)
  values (p_membership_id, p_shelter_id, p_user_id, 'shelter_owner');

  return p_shelter_id;
end;
$$;
```

`client.rpc()` result shape: `{ data: string | null, error: SupabaseErrorLike | null }` (data is the returned UUID).

## 4. Acceptance Criteria

### Database package
- [ ] `packages/database/src/schema.ts` (or a new `packages/database/src/rpc-functions.ts`) — add the `register_shelter` Postgres function definition as a SQL string constant (for documentation and migration use)

### Worker — `SupabaseClientLike` extension
- [ ] `apps/workers/src/pet-supabase.ts` — add `rpc` to `SupabaseClientLike`:
  ```typescript
  rpc: (fn: string, args: Record<string, unknown>) => Promise<SupabaseQueryResult<unknown>>;
  ```

### Worker — `shelter-register-supabase.ts`
- [ ] Replace the two sequential `.from().insert()` calls with a single `client.rpc('register_shelter', { ... })` call
- [ ] `toSlug` and `crypto.randomUUID()` logic remain in the TypeScript caller (pass generated IDs as RPC args)
- [ ] On `result.error`, throw `SupabaseShelterRegistrationRepositoryError`
- [ ] On success, return `{ shelterId }` from the RPC's returned UUID

### Tests
- [ ] `tests/workers/shelter-register-supabase.test.ts` — replace the two-call mock chain with a single `rpc` mock:
  ```typescript
  const makeClient = (result: unknown) => ({
    from: vi.fn(),
    rpc: vi.fn().mockResolvedValue(result),
  });
  ```
  - Success: `rpc` resolves `{ data: 'shelter-uuid', error: null }` → returns `{ shelterId: 'shelter-uuid' }`
  - Error: `rpc` resolves `{ data: null, error: { message: 'fk violation' } }` → throws `SupabaseShelterRegistrationRepositoryError`
  - Verify `rpc` was called with `'register_shelter'` and that args include `slug`, `verification_status` default, `role: 'shelter_owner'`

## 5. Affected Files

- `packages/database/src/schema.ts` (or new `rpc-functions.ts`)
- `apps/workers/src/pet-supabase.ts`
- `apps/workers/src/shelter-register-supabase.ts`
- `tests/workers/shelter-register-supabase.test.ts`

## 6. Notes

- `security definer` is used so the RPC runs with the Supabase service-role context regardless of the caller's RLS permissions. This is intentional: shelter creation is a privileged, authenticated, server-side operation — the Worker already validates the JWT before calling this RPC.
- The `SupabaseClientLike.rpc` signature uses `Record<string, unknown>` args (not a typed object) to keep the structural mock contract minimal and consistent with the existing `.from()` approach.
- All other Supabase repositories (`shelter-update-supabase.ts`, `pet-supabase.ts`, etc.) are unaffected — they do not need `rpc`.
