# Work-Item: SHELTER-PROFILE-WORKER-001 — Shelter Profile Worker Route

## 1. Context & Problem

The pet profile route (`GET /pets/:petId`) is merged and working. An adopter who discovers a pet
needs to see who runs the shelter — name, kind, verification status, city, contact details, media.
Without a public shelter profile route, there is no way to surface that information.

## 2. Acceptance Criteria

- [ ] Add `WORKER_SHELTER_PATH` env var (default `/shelters`) to `@pic4paws/config`.
- [ ] Add `shelterPath` to `workers` block of `EnvironmentConfig`.
- [ ] Add `apps/workers/src/shelter-profile.ts` exporting:
  - `PublicShelterProfile` type
  - `ShelterProfileQuery` type
  - `ShelterProfileRepository` interface (`loadShelterProfile`)
  - `matchWorkerShelterProfileId(pathname, shelterPath)` — returns shelterId or null
  - `handleWorkerShelterProfileRequest({ request, shelterId, shelterProfileRepository })`
- [ ] Add `apps/workers/src/shelter-supabase.ts` exporting:
  - `SupabaseShelterRepositoryError`
  - `createSupabaseShelterRepositories({ client })` returning `{ shelterProfileRepository }`
- [ ] `shelterProfileRepository.loadShelterProfile` queries `shelters` table with `.eq('id', shelterId).is('deleted_at', null).maybeSingle()`.
- [ ] `PublicShelterProfile` exposes only public-safe fields:
  `id`, `name`, `slug`, `kind`, `verificationStatus`, `publicEmail`, `publicPhone`,
  `city`, `district`, `countryCode`, `description`, `logoMediaId`, `coverMediaId`.
- [ ] Private fields omitted: `taxId`, `registrationNumber`, `addressLine1/2`, `postalCode`,
  `latitude`, `longitude`, `paymentAccountStatus`, audit timestamps.
- [ ] Route `GET /shelters/:shelterId` wired in `index.ts` (after pet profile check, before 404).
- [ ] `WorkerRequestDependencies` extended with optional `shelterProfileRepository`.
- [ ] `createWorkerSupabaseDependencies` wires `shelterProfileRepository` from
  `createSupabaseShelterRepositories`.
- [ ] 405 for non-GET methods; 404 for missing shelter; 501 if repository absent.
- [ ] Tests use injected fake `ShelterProfileRepository` — no real network or DB calls.
- [ ] Tests fail before implementation and pass after.
- [ ] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Non-Goals

- Do not implement shelter feed / listing route.
- Do not implement shelter create, update or delete routes.
- Do not add shelter membership or authentication.
- Do not add shelter-owner views or dashboards.

## 4. Completion Notes

_To be filled in after implementation._
