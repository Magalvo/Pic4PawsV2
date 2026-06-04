# Work-Spec: Implementation Plan for AUTH-001

## 1. Target Files

- `docs/work-items/AUTH-001-role-aware-auth-contracts.md`
- `docs/work-specs/AUTH-001-role-aware-auth-contracts.md`
- `packages/domain/src/auth.ts`
- `packages/domain/src/index.ts`
- `tests/domain/auth-contracts.test.ts`

## 2. Proposed Technical Approach

Add a small domain authorization module that represents the minimum data needed from Supabase Auth and Postgres:

- Supabase identity: `authUserId`
- application user record: id, role and status
- shelter memberships: user id, shelter id, role and deleted state

Expose pure functions for authorization decisions:

- `resolveAuthenticatedActor`
- `canManageShelter`
- `canReadAdoptionApplication`
- `canReadDonationTransaction`
- `canPublishPet`

The module stays persistence-free and framework-free. Later work can map database rows into these contracts in `apps/web`, `apps/workers` or Supabase migration helpers.

## 3. Testing Strategy

- Initial failing test: import the authorization functions and assert role boundaries for admin, shelter member, adopter and suspended users.
- Expected input data: in-memory user and membership records.
- Expected output/behavior: authorization decisions match the SDD boundaries without relying on UI, route handlers or external services.

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 5. Risk Controls

- Deny by default when user identity, status or membership is missing.
- Do not trust client-supplied role claims.
- Keep internal shelter notes and financial data gated by shelter membership or admin status.

