# Work-Item: RLS-002-Complete Core RLS Policy Matrix

## Goal

Core tenant-owned and personal-data tables must have explicit Row Level Security coverage by table and operation. RLS must independently enforce the same access boundaries as Workers so private adoption, donation, media, user and shelter data is not protected only by service-role application code.

## States

- `public_read`: anonymous or authenticated users can read only public, verified, non-deleted records.
- `actor_owned_read`: authenticated users can read their own user, media, adoption or donation records.
- `shelter_member_read`: active shelter members can read records scoped to their shelters.
- `actor_owned_write`: authenticated users can insert/update records only when the row remains scoped to their own user.
- `shelter_member_write`: active shelter members can insert/update/delete records scoped to their shelters.
- `admin_all`: active admins can manage every protected core table.
- `denied_by_default`: operations without an explicit policy remain denied by RLS.

## Contract

- Define a policy matrix covering `users`, `shelters`, `shelter_memberships`, `pets`, `media_assets`, `adoption_applications`, and `donation_transactions`.
- Render valid SQL for `select`, `insert`, `update`, `delete`, and wildcard `all` policies.
- Insert policies must render `WITH CHECK` without an invalid `USING` clause.
- Public policies must expose only public/verified/non-deleted records.
- Private tables must have owner or shelter-member policies for reads and writes; payment state writes remain service-role/RPC driven by omission.

## Affected files

- `packages/database/src/rls-policies.ts`
- `packages/database/src/rls-sql.ts`
- `tests/database/rls-sql.test.ts`

