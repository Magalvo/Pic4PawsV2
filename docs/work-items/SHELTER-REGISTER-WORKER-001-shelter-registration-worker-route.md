# Work-Item: SHELTER-REGISTER-WORKER-001 — Shelter Registration Worker Route

status: done

## 1. Context & Problem

There is no way to create a new shelter from the app. Every shelter must be seeded directly
in the database. Shelter registration is required before any other shelter-specific flow
(pet management, adoptions, donations) can be exercised.

## 2. Goal

Expose `POST /shelters` so authenticated users can register a new shelter. The route creates
a `shelters` row and a first `shelter_memberships` row giving the registrant `shelter_owner`
role, then returns the new `shelterId`.

## 3. States / Contract

**States**: 405 | 401 (no token) | 501 (auth not configured) | 401 (bad token) | 400 (invalid payload) | 501 (repo not configured) | 201 created

**Request**:
```
POST /shelters
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": string,           // required, non-empty
  "kind": ShelterKind,      // required: shelter | sanctuary | association | foster_network
  "city": string,           // required, non-empty
  "publicEmail": string | null,
  "publicPhone": string | null,
  "description": string | null,
  "district": string | null
}
```

**Response 201**:
```json
{ "status": "created", "shelterId": "string" }
```

**Error responses**:
- 405 `{ status: 'method_not_allowed', allowedMethods: ['POST'] }`
- 401 `{ status: 'unauthenticated' }`
- 501 `{ status: 'auth_adapter_not_configured' }`
- 400 `{ status: 'invalid_payload', reasons: string[] }` — missing/invalid name, kind, or city
- 501 `{ status: 'shelter_registration_repository_not_configured' }`

## 4. Acceptance Criteria

- [ ] `apps/workers/src/shelter-register.ts` (new):
  - `KNOWN_SHELTER_KINDS` constant
  - `ShelterRegistrationInput` type
  - `ShelterRegistrationRepository` interface with `registerShelter(input, actorUserId)`
  - `validateShelterRegistrationPayload(body)` — returns `{ valid: true; input }` or `{ valid: false; reasons: string[] }`
  - `HandleWorkerShelterRegistrationRequestInput` type and `handleWorkerShelterRegistrationRequest` handler
- [ ] Handler flow (in order):
  1. 405 non-POST
  2. 401 missing bearer
  3. 501 authenticator not configured
  4. 401 auth returns null
  5. Parse + validate JSON body → 400 on missing/invalid name, kind, city
  6. 501 shelterRegistrationRepository not configured
  7. 201 `{ status: 'created', shelterId }`
- [ ] `apps/workers/src/shelter-register-supabase.ts` (new):
  - Generates `id` via `crypto.randomUUID()`
  - Generates `slug` from `name` (lowercase, non-alphanumeric → `-`, deduplicate `-`, trim `-`)
  - INSERTs into `shelters` (status defaults to `draft`, country_code to `'PT'`)
  - INSERTs into `shelter_memberships` (role: `shelter_owner`)
  - Throws `SupabaseShelterRegistrationRepositoryError` on Supabase error
- [ ] Wire into `dependencies.ts` and `index.ts`
- [ ] Route registered at shelter path + POST — must not conflict with `matchWorkerShelterPetsShelterId` or `matchWorkerShelterProfileId` (those match sub-paths and single segment IDs; POST to `/shelters` has no extra segment)
- [ ] Exports added to `index.ts`
- [ ] Tests use injected fakes — no real network/DB calls

## 5. Affected Files

- `apps/workers/src/shelter-register.ts` (new)
- `apps/workers/src/shelter-register-supabase.ts` (new)
- `apps/workers/src/dependencies.ts`
- `apps/workers/src/index.ts`
- `tests/workers/shelter-register.test.ts` (new)
- `tests/workers/shelter-register-supabase.test.ts` (new)
