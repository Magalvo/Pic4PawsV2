# Work-Spec: Implementation Plan for ADOPTION-CLIENT-001

## 1. Target Files

### New
- `docs/work-items/ADOPTION-CLIENT-001-adoption-application-client.md`
- `docs/work-specs/ADOPTION-CLIENT-001-adoption-application-client.md`
- `tests/client/adoption-application-client.test.ts`

### Modified
- `packages/client/src/index.ts` — append adoption types and `createAdoptionApplicationClient`

## 2. Design

### Types

```ts
export type HousingType = 'apartment' | 'house' | 'farm' | 'other';

export type AdoptionApplicationClientInput = {
  petId: string;
  applicantFullName: string;
  applicantEmail: string;
  applicantPhoneNumber: string;
  applicantCity: string;
  applicantDistrict?: string | null;
  applicantPostalCode?: string | null;
  housingType: HousingType;
  hasOutdoorSpace: boolean;
  hasChildren: boolean;
  hasOtherAnimals: boolean;
  otherAnimalsDescription?: string | null;
  previousPetExperience: string;
  dailyRoutine: string;
  adoptionMotivation: string;
  veterinarianContact?: string | null;
  dataProcessingAccepted: true;
  shelterContactAccepted: boolean;
  consentVersion: string;
  consentAcceptedAt: string;
};

export type AdoptionApplicationClientSuccess = {
  ok: true;
  status: 'adoption_application_submitted';
  applicationId: string;
  petId: string;
  shelterId: string;
  submittedAt: string;
};

export type AdoptionApplicationClientFailureStatus =
  | 'unauthenticated'
  | 'pet_not_found'
  | 'invalid_adoption_application'
  | 'adoption_repository_not_configured'
  | 'auth_adapter_not_configured'
  | 'worker_request_failed'
  | 'worker_response_invalid';

export type AdoptionApplicationClientFailure = {
  ok: false;
  status: AdoptionApplicationClientFailureStatus;
  reasons: string[];
};

export type AdoptionApplicationClientResult =
  | AdoptionApplicationClientSuccess
  | AdoptionApplicationClientFailure;

export type CreateAdoptionApplicationClientInput = {
  workerBaseUrl: string;
  adoptionsPath: `/${string}`;
  getAccessToken: () => Promise<string | null>;
  fetch: MediaUploadClientFetch;
};

export type AdoptionApplicationClient = {
  submitApplication: (
    input: AdoptionApplicationClientInput,
  ) => Promise<AdoptionApplicationClientResult>;
};
```

### `createAdoptionApplicationClient` flow

```
1. getAccessToken() → null or empty → { ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] }
2. try fetch(adoptionsPath, { method: 'POST', Authorization: Bearer, body: sanitized payload })
   catch → { ok: false, status: 'worker_request_failed', reasons: ['network_error'] }
3. parseJsonResponse(response)
4. !response.ok → parseAdoptionFailureStatus(body) + sanitizeReasons(...)
5. parseAdoptionSuccess(body) → null → { ok: false, status: 'worker_response_invalid' }
6. else → success
```

### parseAdoptionSuccess validation

- `body.status === 'adoption_application_submitted'`
- `typeof body.applicationId === 'string'`
- `typeof body.petId === 'string'`
- `typeof body.shelterId === 'string'`
- `typeof body.submittedAt === 'string'`

### parseAdoptionFailureStatus

Maps Worker body status values to `AdoptionApplicationClientFailureStatus`:
`unauthenticated`, `pet_not_found`, `invalid_adoption_application`,
`adoption_repository_not_configured`, `auth_adapter_not_configured` → same name.
Anything else → `worker_request_failed`.

### Payload sanitization

Constructs an explicit JSON payload from input fields only — no extra properties leaked.
Optional nullable fields default to `null` if not provided.

## 3. Testing Strategy

### `tests/client/adoption-application-client.test.ts` — 9 tests

| # | Scenario | Expected |
|---|---|---|
| 1 | 201 with valid submission | `{ ok: true, status: 'adoption_application_submitted', ... }` |
| 2 | All fields present in success | applicationId / petId / shelterId / submittedAt all truthy |
| 3 | URL uses adoptionsPath exactly | called URL equals `https://workers.pic4paws.pt/adoptions` |
| 4 | Authorization header is sent with Bearer token | header starts with `Bearer ` |
| 5 | Missing access token → unauthenticated | `{ ok: false, status: 'unauthenticated' }` |
| 6 | pet_not_found on 404 response | `{ ok: false, status: 'pet_not_found' }` |
| 7 | worker_request_failed on 503 | `{ ok: false, status: 'worker_request_failed' }` |
| 8 | network_error on fetch throw | `reasons: ['network_error']` |
| 9 | worker_response_invalid on malformed 201 | `{ ok: false, status: 'worker_response_invalid' }` |
| 10 | credential markers stripped from reasons | serialized result has no service-role / r2_secret |

(10 tests total)

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
