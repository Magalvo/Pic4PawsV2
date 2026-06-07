# Work-Spec: Implementation Plan for PET-PROFILE-CLIENT-001

## 1. Target Files

- `docs/work-items/PET-PROFILE-CLIENT-001-public-pet-profile-client.md`
- `docs/work-specs/PET-PROFILE-CLIENT-001-public-pet-profile-client.md`
- `packages/client/src/index.ts` (append PetProfileClient types and factory)
- `tests/client/pet-profile-client.test.ts` (new)

## 2. New Types

```ts
export type PetProfilePet = {
  id: string;
  shelterId: string;
  name: string | null;
  species: PetLifecycleSpecies | null;
  locationLabel: string | null;
  shortDescription: string | null;
  heroMediaId: string | null;
  mediaIds: string[];
  publishedAt: string;
  medical: PublicPetMedicalStatus;
};

export type PetProfileClientSuccess = {
  ok: true;
  status: 'ok';
  pet: PetProfilePet;
};

export type PetProfileClientFailureStatus =
  | 'pet_not_found'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type PetProfileClientFailure = {
  ok: false;
  status: PetProfileClientFailureStatus;
  reasons: string[];
};

export type PetProfileClientResult = PetProfileClientSuccess | PetProfileClientFailure;

export type CreatePetProfileClientInput = {
  workerBaseUrl: string;
  petFeedPath: `/${string}`;
  fetch: MediaUploadClientFetch;
};

export type PetProfileClient = {
  loadProfile: (petId: string) => Promise<PetProfileClientResult>;
};
```

## 3. URL Construction

Uses the existing `createWorkerSubUrl` helper:

```ts
createWorkerSubUrl(workerBaseUrl, petFeedPath, petId)
// e.g. workerBaseUrl='https://workers.pic4paws.pt', petFeedPath='/pets', petId='abc'
// → 'https://workers.pic4paws.pt/pets/abc'
```

The petId is `encodeURIComponent`-encoded by `createWorkerSubUrl`.

## 4. Response Handling

| HTTP status | Body `status` | Client result |
|---|---|---|
| 200 | `'ok'` + valid `pet` object | `{ ok: true, status: 'ok', pet }` |
| 200 | anything else | `{ ok: false, status: 'worker_response_invalid', reasons: ['invalid_worker_response'] }` |
| 404 | `'pet_not_found'` | `{ ok: false, status: 'pet_not_found', reasons: ['pet_not_found'] }` |
| other non-ok | any | `{ ok: false, status: 'worker_request_failed', reasons: sanitized }` |
| fetch throws | — | `{ ok: false, status: 'worker_request_failed', reasons: ['network_error'] }` |

### Success validation (`parsePetProfileSuccess`)

Checks: `body.status === 'ok'` AND `body.pet` is a non-null object AND `pet.id` and
`pet.shelterId` and `pet.publishedAt` are strings. Trusts the rest of the shape without
field-by-field validation (same approach as `parsePetFeedSuccess`).

### Credential sanitization

`sanitizeReasons` (shared within the module) strips any reason string containing credential
markers before returning to callers. `pet_not_found` is returned directly with a fixed reason
array and does not go through `sanitizeReasons`.

## 5. Testing Strategy

All tests inject a mock `fetch`. No real network calls.

| # | Scenario | Expected |
|---|---|---|
| 1 | 200 with valid pet body | `{ ok: true, status: 'ok', pet }` |
| 2 | 200 with valid pet including medical field | `body.pet.medical` equals expected |
| 3 | Constructs URL as `petFeedPath/petId` | `fetch` called with `.../pets/pet-pub-1` |
| 4 | 404 with `pet_not_found` body | `{ ok: false, status: 'pet_not_found' }` |
| 5 | 503 non-ok response | `{ ok: false, status: 'worker_request_failed' }` |
| 6 | fetch throws | `{ ok: false, status: 'worker_request_failed', reasons: ['network_error'] }` |
| 7 | 200 with malformed body (missing `pet`) | `{ ok: false, status: 'worker_response_invalid' }` |
| 8 | Credential markers stripped from failure reasons | serialized result has no credential strings |

## 6. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 7. Risk Controls

- `PetProfilePet` is a strict type allowlist — the client does not pass through arbitrary
  unknown fields from the Worker response.
- `sanitizeReasons` removes any credential-adjacent strings before they reach the caller.
- No auth token is sent or stored — this is a public GET.
