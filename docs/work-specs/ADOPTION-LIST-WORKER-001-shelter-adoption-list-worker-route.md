# Work-Spec: ADOPTION-LIST-WORKER-001 — Shelter Adoption List Worker Route

## Route

`GET /shelters/:shelterId/adoptions`

Path matched by `matchWorkerAdoptionListShelterId(pathname, config.workers.shelterPath)`.

## Authentication & Authorization

- Bearer token required → `WorkerPetDraftAuthenticator` (same adapter as `POST /adoptions`).
- Actor must satisfy `canManageShelter(actor, shelterId)` from `@pic4paws/domain`:
  - `shelter_owner` or `shelter_member` with active membership for the shelterId, OR
  - `admin`.
- Violation → 403 `{ status: 'forbidden' }`.

## Path Matching

`matchWorkerAdoptionListShelterId(pathname, shelterPath)`:

| Input                              | Output       | Reason                        |
|------------------------------------|--------------|-------------------------------|
| `/shelters/abc123/adoptions`       | `'abc123'`   | valid                         |
| `/shelters/abc123`                 | `null`       | no /adoptions suffix          |
| `/shelters/abc123/adoptions/extra` | `null`       | extra segment after /adoptions|
| `/shelters/abc/def/adoptions`      | `null`       | shelterId contains /          |
| `/shelters`                        | `null`       | no segment                    |
| `/other/abc123/adoptions`          | `null`       | wrong prefix                  |

This is safe to run after `matchWorkerShelterProfileId` because that matcher already
returns `null` for paths with `/` in the rest segment.

## Query Parameters

| Param  | Default | Min | Max | Notes                          |
|--------|---------|-----|-----|--------------------------------|
| limit  | 20      | 1   | 100 | NaN / below min → default      |
| offset | 0       | 0   | —   | NaN / negative → 0             |

## Response 200

```json
{
  "status": "ok",
  "applications": [
    {
      "applicationId": "app-001",
      "petId": "pet-1",
      "applicantUserId": "user-1",
      "applicantFullName": "Maria Silva",
      "applicantEmail": "maria@example.pt",
      "applicantCity": "Lisboa",
      "status": "submitted",
      "submittedAt": "2026-06-07T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

## Error Responses

| HTTP | Body `status`                            | Condition                          |
|------|------------------------------------------|------------------------------------|
| 405  | `method_not_allowed`                     | Non-GET method                     |
| 401  | `unauthenticated`                        | No/invalid Bearer token            |
| 501  | `auth_adapter_not_configured`            | No authenticator injected          |
| 401  | `unauthenticated`                        | Token valid but auth returns null  |
| 403  | `forbidden`                              | Actor not shelter member/admin     |
| 501  | `adoption_list_repository_not_configured`| No repo injected                   |

## Supabase Query (single call)

```ts
client
  .from('adoption_applications')
  .select(
    'id,pet_id,applicant_user_id,applicant_full_name,applicant_email,applicant_city,status,submitted_at',
    { count: 'exact' }
  )
  .eq('shelter_id', shelterId)
  .is('deleted_at', null)
  .order('submitted_at', { ascending: false })
  .range(offset, offset + limit - 1)
// result.data  → AdoptionApplicationRow[]
// result.count → total
```

## Files Affected

- `apps/workers/src/adoption-list.ts` — new
- `apps/workers/src/adoption-list-supabase.ts` — new
- `apps/workers/src/dependencies.ts` — add `AdoptionListRepository` + factory wiring
- `apps/workers/src/index.ts` — route matcher + exports
- `tests/workers/adoption-list.test.ts` — new (10 tests)
- `tests/workers/adoption-list-supabase-repository.test.ts` — new (3 tests)
