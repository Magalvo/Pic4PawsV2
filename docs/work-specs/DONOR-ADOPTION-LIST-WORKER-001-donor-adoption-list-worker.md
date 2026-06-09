# Work-Spec: DONOR-ADOPTION-LIST-WORKER-001 — Donor Adoption List Worker Route

## Files to create

### `apps/workers/src/adoption-donor-list.ts`

Types and handler for the donor-facing adoption list.

```typescript
import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { AdoptionApplicationStatus } from './adoption-list';

export type AdoptionDonorListSummary = {
  applicationId: string;
  petId: string;
  shelterId: string;
  status: AdoptionApplicationStatus;
  submittedAt: string | null;
};

export type ListDonorAdoptionsQuery = {
  donorUserId: string;
  limit?: number;
  offset?: number;
};

export type ListDonorAdoptionsResult = {
  applications: AdoptionDonorListSummary[];
  total: number;
};

export type AdoptionDonorListRepository = {
  listDonorAdoptions: (query: ListDonorAdoptionsQuery) => Promise<ListDonorAdoptionsResult>;
};

export type HandleWorkerAdoptionDonorListRequestInput = {
  request: Request;
  adoptionDonorListRepository?: AdoptionDonorListRepository;
  authenticator?: WorkerPetDraftAuthenticator;
};

export const handleWorkerAdoptionDonorListRequest = async ({...}): Promise<Response>;
```

### `apps/workers/src/adoption-donor-list-supabase.ts`

```typescript
export const createSupabaseAdoptionDonorListRepositories = ({ client }) => ({
  adoptionDonorListRepository: {
    listDonorAdoptions: async ({ donorUserId, limit = 20, offset = 0 }) => {
      // SELECT id, pet_id, shelter_id, status, submitted_at
      // FROM adoption_applications
      // WHERE applicant_user_id = donorUserId
      // ORDER BY submitted_at DESC
      // LIMIT limit OFFSET offset
      // + count: 'exact'
    },
  },
});
```

## Files to modify

### `apps/workers/src/dependencies.ts`

- Import `AdoptionDonorListRepository`, `createSupabaseAdoptionDonorListRepositories`
- Add `adoptionDonorListRepository?: AdoptionDonorListRepository` to `WorkerRequestDependencies`
- Wire in factory and resolver

### `apps/workers/src/index.ts`

- Import handler and repository type
- Add GET method-switch before the existing adoption POST block:

```typescript
if (url.pathname === config.workers.adoptionsPath && request.method === 'GET') {
  return handleWorkerAdoptionDonorListRequest({
    request,
    adoptionDonorListRepository: dependencies.adoptionDonorListRepository,
    authenticator: dependencies.petDraftAuthenticator,
  });
}
```

## Test file

### `tests/workers/adoption-donor-list.test.ts`

Cases: success (with applications), success (empty list), unauthenticated (no bearer),
unauthenticated (invalid token), 501 (no auth adapter), 501 (no repository).
