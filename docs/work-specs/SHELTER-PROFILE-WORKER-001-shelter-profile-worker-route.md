# Work-Spec: Implementation Plan for SHELTER-PROFILE-WORKER-001

## 1. Target Files

### New
- `docs/work-items/SHELTER-PROFILE-WORKER-001-shelter-profile-worker-route.md`
- `docs/work-specs/SHELTER-PROFILE-WORKER-001-shelter-profile-worker-route.md`
- `apps/workers/src/shelter-profile.ts`
- `apps/workers/src/shelter-supabase.ts`
- `tests/workers/shelter-profile.test.ts`
- `tests/workers/shelter-supabase-repository.test.ts`

### Modified
- `packages/config/src/env.ts` — add `WORKER_SHELTER_PATH` env var + `shelterPath` to config type
- `apps/workers/src/dependencies.ts` — add `shelterProfileRepository` to dependencies + wiring
- `apps/workers/src/index.ts` — add shelter route + exports

## 2. Design

### Config

Add to `environmentSchema`:
```ts
WORKER_SHELTER_PATH: z.string().startsWith('/').default('/shelters'),
```

Add to `EnvironmentConfig.workers`:
```ts
shelterPath: string;
```

Map `env.WORKER_SHELTER_PATH` → `config.workers.shelterPath` in `parseEnvironmentConfig`.

### `shelter-profile.ts`

Mirrors the `pet-profile.ts` pattern exactly.

```ts
export type ShelterKind = 'shelter' | 'sanctuary' | 'association' | 'foster_network';
export type ShelterVerificationStatus =
  'draft' | 'pending_review' | 'verified' | 'rejected' | 'suspended';

export type PublicShelterProfile = {
  id: string;
  name: string;
  slug: string;
  kind: ShelterKind;
  verificationStatus: ShelterVerificationStatus;
  publicEmail: string | null;
  publicPhone: string | null;
  city: string;
  district: string | null;
  countryCode: string;
  description: string | null;
  logoMediaId: string | null;
  coverMediaId: string | null;
};

export type ShelterProfileQuery = { shelterId: string };

export type ShelterProfileRepository = {
  loadShelterProfile: (query: ShelterProfileQuery) => Promise<PublicShelterProfile | null>;
};

export const matchWorkerShelterProfileId = (pathname: string, shelterPath: string): string | null
// → returns the single path segment after shelterPath, or null
// Same logic as matchWorkerPetProfileId

export const handleWorkerShelterProfileRequest = async ({
  request, shelterId, shelterProfileRepository,
}): Promise<Response>
// → 405 non-GET | 501 no repo | 404 not found | 200 { status: 'ok', shelter }
```

### `shelter-supabase.ts`

Public shelter columns (private fields deliberately excluded):
```ts
const shelterProfileColumns =
  'id,name,slug,kind,verification_status,public_email,public_phone,' +
  'city,district,country_code,description,logo_media_id,cover_media_id';
```

Query:
```ts
client.from('shelters')
  .select(shelterProfileColumns)
  .eq('id', shelterId)
  .is('deleted_at', null)
  .maybeSingle()
```

Row → domain mapping (snake_case → camelCase).

### Route placement in `index.ts`

After the pet profile check (`profilePetId !== null`), before the 404 fallback:

```ts
const shelterProfileId = matchWorkerShelterProfileId(
  url.pathname,
  config.workers.shelterPath,
);
if (shelterProfileId !== null) {
  return handleWorkerShelterProfileRequest({
    request,
    shelterId: shelterProfileId,
    shelterProfileRepository: dependencies.shelterProfileRepository,
  });
}
```

No route conflict: `/shelters` never collides with `/pets/*`, `/uploads/*`, `/webhooks/*`.

## 3. Testing Strategy

### `tests/workers/shelter-profile.test.ts` (8 tests)

| # | Scenario | Expected |
|---|---|---|
| 1 | GET `/shelters/:shelterId` — repo returns shelter | 200 `{ status: 'ok', shelter }` |
| 2 | Repo returns null | 404 `{ status: 'shelter_not_found' }` |
| 3 | shelterId extracted from URL path | `loadShelterProfile` called with `{ shelterId }` |
| 4 | POST `/shelters/:shelterId` | 405, `allowedMethods: ['GET']` |
| 5 | No repo injected | 501 `{ status: 'shelter_profile_repository_not_configured' }` |
| 6 | `verificationStatus` present in response | `body.shelter.verificationStatus === 'verified'` |
| 7 | No credential markers in body | serialized body excludes `service-role-secret` and `r2-access-key` |
| 8 | Exact `/shelters` path falls through | 404 (no shelter feed handler yet) |

### `tests/workers/shelter-supabase-repository.test.ts` (3 tests)

| # | Scenario | Expected |
|---|---|---|
| 1 | Load shelter by ID — shelter present | mapped `PublicShelterProfile`, correct columns + filters |
| 2 | Load shelter by ID — shelter absent | `null` |
| 3 | Supabase error → sanitized `SupabaseShelterRepositoryError` | no secret leakage |

## 4. Validation Commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
