# Work-Spec: Implementation Plan for ADOPTION-WORKER-001

## 1. Target Files

### New
- `docs/work-items/ADOPTION-WORKER-001-adoption-application-worker-route.md`
- `docs/work-specs/ADOPTION-WORKER-001-adoption-application-worker-route.md`
- `apps/workers/src/adoption.ts`
- `apps/workers/src/adoption-supabase.ts`
- `tests/workers/adoption.test.ts`
- `tests/workers/adoption-supabase-repository.test.ts`

### Modified
- `packages/config/src/env.ts` — add `WORKER_ADOPTIONS_PATH` to schema, type, and mapping
- `apps/workers/src/dependencies.ts` — add `adoptionRepository` + wiring
- `apps/workers/src/index.ts` — add adoption route + export types
- `tests/config/environment-contracts.test.ts` — add `adoptionsPath` to expected workers object

## 2. Design

### Route

Exact path match: `url.pathname === config.workers.adoptionsPath`.
Method: POST only (405 for anything else).
Auth: Bearer token required — uses the existing `WorkerPetDraftAuthenticator` (same Supabase
auth adapter).

### Handler flow (`handleWorkerAdoptionRequest`)

```
1. method !== 'POST'                  → 405
2. no bearer token                    → 401 unauthenticated
3. no authenticator                   → 501 auth_adapter_not_configured
4. authenticator returns null         → 401 unauthenticated
5. validateAdoptionPayload fails      → 400 invalid_adoption_application + reasons
6. no adoptionRepository              → 501 adoption_repository_not_configured
7. loadPetForApplication returns null → 404 pet_not_found
8. createApplication succeeds         → 201 adoption_application_submitted
```

### Payload validation (`validateAdoptionPayload`)

Required strings: `petId`, `applicantFullName`, `applicantEmail`, `applicantPhoneNumber`,
`applicantCity`, `previousPetExperience`, `dailyRoutine`, `adoptionMotivation`,
`consentVersion`, `consentAcceptedAt`.

Required enum: `housingType` ∈ `'apartment' | 'house' | 'farm' | 'other'`.

Required booleans: `hasOutdoorSpace`, `hasChildren`, `hasOtherAnimals`, `shelterContactAccepted`.

Consent gate: `dataProcessingAccepted` must be exactly `true` (boolean strict check) — any
other value yields `'data_processing_consent_required'` reason.

Optional nullable strings: `applicantDistrict`, `applicantPostalCode`,
`otherAnimalsDescription`, `veterinarianContact`.

### Server-derived fields (never from client)

- `shelterId` — looked up from `pets` via `loadPetForApplication`.
- `applicantUserId` — from authenticated actor.
- `status` — always `'submitted'`.
- `submittedAt` — injected `now` parameter (ISO string).

### 201 response shape

```json
{
  "status": "adoption_application_submitted",
  "applicationId": "...",
  "petId": "...",
  "shelterId": "...",
  "submittedAt": "..."
}
```

## 3. Config Changes (`packages/config/src/env.ts`)

```ts
// schema
WORKER_ADOPTIONS_PATH: z.string().startsWith('/').default('/adoptions'),

// EnvironmentConfig.workers
adoptionsPath: string;

// parseEnvironmentConfig mapping
adoptionsPath: env.WORKER_ADOPTIONS_PATH,
```

## 4. adoption.ts

```ts
export type HousingType = 'apartment' | 'house' | 'farm' | 'other';

export type AdoptionApplicationPetContext = { petId: string; shelterId: string };

export type CreateAdoptionApplicationInput = {
  petId: string; shelterId: string; applicantUserId: string;
  status: 'submitted'; submittedAt: string;
  applicantFullName: string; applicantEmail: string; applicantPhoneNumber: string;
  applicantCity: string; applicantDistrict: string | null; applicantPostalCode: string | null;
  housingType: HousingType;
  hasOutdoorSpace: boolean; hasChildren: boolean; hasOtherAnimals: boolean;
  otherAnimalsDescription: string | null;
  previousPetExperience: string; dailyRoutine: string; adoptionMotivation: string;
  veterinarianContact: string | null;
  dataProcessingAccepted: true; shelterContactAccepted: boolean;
  consentVersion: string; consentAcceptedAt: string;
};

export type CreateAdoptionApplicationResult = { applicationId: string; submittedAt: string };

export type AdoptionApplicationRepository = {
  loadPetForApplication: (petId: string) => Promise<AdoptionApplicationPetContext | null>;
  createApplication: (input: CreateAdoptionApplicationInput) => Promise<CreateAdoptionApplicationResult>;
};

// validates payload, returns { valid: true, data: ValidatedAdoptionPayload }
// or { valid: false, reasons: string[] }
export const validateAdoptionPayload: (payload: unknown) => ValidateAdoptionPayloadResult;

// handleWorkerAdoptionRequest: the main export, full handler
export const handleWorkerAdoptionRequest: (input: {...}) => Promise<Response>;
```

## 5. adoption-supabase.ts

```ts
export class SupabaseAdoptionRepositoryError extends Error { ... }

export type CreateSupabaseAdoptionRepositoriesInput = { client: SupabaseClientLike };
export type CreateSupabaseAdoptionRepositoriesResult = {
  adoptionRepository: AdoptionApplicationRepository;
};

// loadPetForApplication:
//   client.from('pets').select('id,shelter_id')
//         .eq('id', petId).eq('status', 'published').is('deleted_at', null).maybeSingle()
//   maps { id, shelter_id } → { petId, shelterId }

// createApplication:
//   client.from('adoption_applications').insert(camelToSnakeRow).select('id,submitted_at').single()
//   maps { id, submitted_at } → { applicationId, submittedAt }

export const createSupabaseAdoptionRepositories: (
  input: CreateSupabaseAdoptionRepositoriesInput
) => CreateSupabaseAdoptionRepositoriesResult;
```

## 6. Testing Strategy

### `tests/workers/adoption.test.ts` — 10 tests

| # | Scenario | Expected |
|---|---|---|
| 1 | Valid POST with full payload | 201 `{ status: 'adoption_application_submitted', applicationId, petId, shelterId, submittedAt }` |
| 2 | All four fields present in response | applicationId/petId/shelterId/submittedAt all truthy |
| 3 | No Authorization header | 401 `{ status: 'unauthenticated' }` |
| 4 | Authenticator returns null | 401 `{ status: 'unauthenticated' }` |
| 5 | Payload missing petId | 400 `{ status: 'invalid_adoption_application' }` |
| 6 | dataProcessingAccepted is false | 400 with `data_processing_consent_required` in reasons |
| 7 | loadPetForApplication returns null | 404 `{ status: 'pet_not_found' }` |
| 8 | No adoptionRepository injected (auth present) | 501 `{ status: 'adoption_repository_not_configured' }` |
| 9 | GET /adoptions | 405 `{ status: 'method_not_allowed' }` |
| 10 | Response body never contains credential markers | serialized body has no service-role-secret / r2-access-key |

### `tests/workers/adoption-supabase-repository.test.ts` — 3 tests

| # | Scenario | Expected |
|---|---|---|
| 1 | loadPetForApplication with published pet | returns `{ petId, shelterId }` using correct filters |
| 2 | loadPetForApplication when pet absent | returns null |
| 3 | createApplication with valid input | inserts correct row, returns `{ applicationId, submittedAt }` |

## 7. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
