# Work-Item: AUTH-001-Role-Aware Auth Contracts

## 1. Context & Problem

The approved SDD requires Supabase Auth for identity and Postgres application records for roles, profile status and shelter memberships. `DB-001` defined the schema foundation, but application code still needs shared authorization contracts before product features can safely read or mutate shelter, adoption, pet or donation data.

This task creates testable domain-level authorization rules that can later be reused by Next.js routes, Cloudflare Workers and Supabase RLS migration generation.

## 2. Acceptance Criteria

- [x] Auth context is derived from a Supabase `authUserId` matched to an active application user record.
- [x] Suspended, deleted or missing users are denied by default.
- [x] Admin users can manage all core resources.
- [x] Shelter owners and shelter members can access resources only for shelters where they have an active membership.
- [x] Adopters can read only their own adoption applications.
- [x] Pet publishing is allowed only for active shelter members of a verified shelter.
- [x] Tests fail before implementation and pass after the authorization contracts are implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not connect to Supabase.
- Do not implement login, signup, session refresh or MFA.
- Do not implement API route handlers.
- Do not apply RLS migrations.

## 4. Completion Notes

- Added pure domain authorization contracts for Supabase-authenticated actors, active application users and shelter memberships.
- Added decision helpers for shelter management, adoption application reads, donation reads and pet publishing.
- No Supabase connection, auth session handling or API route implementation was added.
- Validation was run with Node `22.22.3` via explicit NVM paths because the active Codex shell did not inherit the updated `npm` PATH.
