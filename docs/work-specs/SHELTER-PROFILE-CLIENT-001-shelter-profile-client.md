# Work-Spec: Implementation Plan for SHELTER-PROFILE-CLIENT-001

## 1. Target Files

### New
- `docs/work-items/SHELTER-PROFILE-CLIENT-001-shelter-profile-client.md`
- `docs/work-specs/SHELTER-PROFILE-CLIENT-001-shelter-profile-client.md`
- `tests/client/shelter-profile-client.test.ts`

### Modified
- `packages/client/src/index.ts` — append before `createMediaUploadFlowClient`

## 2. Design

Mirrors `createPetProfileClient` exactly, with `Shelter` prefix and shelter-specific field names.

### New types (appended to `packages/client/src/index.ts`)

```ts
export type ShelterProfileClientShelter = {
  id: string;
  name: string;
  slug: string;
  kind: 'shelter' | 'sanctuary' | 'association' | 'foster_network';
  verificationStatus: 'draft' | 'pending_review' | 'verified' | 'rejected' | 'suspended';
  publicEmail: string | null;
  publicPhone: string | null;
  city: string;
  district: string | null;
  countryCode: string;
  description: string | null;
  logoMediaId: string | null;
  coverMediaId: string | null;
};

export type ShelterProfileClientSuccess = { ok: true; status: 'ok'; shelter: ShelterProfileClientShelter };
export type ShelterProfileClientFailureStatus = 'shelter_not_found' | 'worker_request_failed' | 'worker_response_invalid';
export type ShelterProfileClientFailure = { ok: false; status: ShelterProfileClientFailureStatus; reasons: string[] };
export type ShelterProfileClientResult = ShelterProfileClientSuccess | ShelterProfileClientFailure;

export type CreateShelterProfileClientInput = {
  workerBaseUrl: string;
  shelterPath: `/${string}`;
  fetch: MediaUploadClientFetch;
};

export type ShelterProfileClient = {
  loadProfile: (shelterId: string) => Promise<ShelterProfileClientResult>;
};
```

### `parseShelterProfileSuccess`

Validates `body.status === 'ok'`, `body.shelter` is a non-null object,
`body.shelter.id` / `body.shelter.name` / `body.shelter.slug` are strings.

### `createShelterProfileClient`

```ts
export const createShelterProfileClient = ({ workerBaseUrl, shelterPath, fetch }) => ({
  loadProfile: async (shelterId) => {
    // try/catch fetch → network_error
    // 404 → shelter_not_found
    // !response.ok → worker_request_failed + sanitizeReasons
    // parseShelterProfileSuccess → null → worker_response_invalid
    // else → success
  },
});
```

URL is `createWorkerSubUrl(workerBaseUrl, shelterPath, shelterId)`.

## 3. Testing Strategy

### `tests/client/shelter-profile-client.test.ts` (8 tests)

| # | Scenario | Expected |
|---|---|---|
| 1 | 200 with full shelter | `{ ok: true, status: 'ok', shelter }` |
| 2 | `verificationStatus` present in returned shelter | `result.shelter.verificationStatus === 'verified'` |
| 3 | URL construction | `https://workers.pic4paws.pt/shelters/shelter-a` |
| 4 | 404 response | `{ ok: false, status: 'shelter_not_found' }` |
| 5 | 503 response | `{ ok: false, status: 'worker_request_failed' }` |
| 6 | fetch throws | `{ ok: false, status: 'worker_request_failed', reasons: ['network_error'] }` |
| 7 | 200 with malformed body | `{ ok: false, status: 'worker_response_invalid' }` |
| 8 | Credential markers stripped from failure reasons | serialized result excludes markers |

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
