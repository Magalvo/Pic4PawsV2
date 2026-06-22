# Work-Spec: Implementation Plan for DONATE-CONFIG-WORKER-001

## 1. Target Files

- `docs/work-items/DONATE-CONFIG-WORKER-001-shelter-payment-config-worker.md`
- `docs/work-specs/DONATE-CONFIG-WORKER-001-shelter-payment-config-worker.md`
- `apps/workers/src/shelter-payment-config.ts`
- `apps/workers/src/shelter-payment-config-supabase.ts`
- `apps/workers/src/routes/shelters.ts`
- `apps/workers/src/dependencies.ts`
- `tests/workers/shelter-payment-config.test.ts`

## 2. Proposed Technical Approach

### Handler module (`shelter-payment-config.ts`)

Follow the same shape as `shelter-update.ts`: typed repository interface, payload validator,
handler function, path matcher. The path matcher for the config sub-route must be additive
relative to the existing `matchWorkerShelterShelterId` helper — for example:

```
matchWorkerShelterPaymentConfigPath(pathname, shelterPath)
// '/shelters/abc123/payment-config' → 'abc123'
// '/shelters/abc123' → null
```

`validatePaymentConfigPayload` must accept the raw request body and return either
`{ valid: true; data: { iban: string; mbWayPhone: string | null } }` or
`{ valid: false; reasons: string[] }`. IBAN validation is format-only: non-empty string,
at least 15 characters, starts with two uppercase letters (covers all EU countries). Full
checksum validation is explicitly out of scope for Phase 1 to keep the UX friction low.

### Repository interface

```ts
type PaymentConfigRepository = {
  getPaymentConfig: (shelterId: string) => Promise<PaymentConfigRow | null>;
  savePaymentConfig: (shelterId: string, input: SavePaymentConfigInput) => Promise<void>;
};
```

### Supabase adapter (`shelter-payment-config-supabase.ts`)

`savePaymentConfig` must perform two writes atomically:
1. Upsert into `shelter_payment_configs` (conflict target: `shelter_id`).
2. Update `shelters SET payment_account_status = 'active' WHERE id = shelterId`.

Because Cloudflare Workers cannot use Supabase's transaction API directly, wrap these in
a Supabase RPC (`save_shelter_payment_config`) that runs both statements inside a PL/pgSQL
function with `SECURITY DEFINER`. Document this in the work item's Completion Notes once
done, and reference the RPC from `packages/database/src/rpc-functions.ts`.

Alternatively, if the RPC complexity is undesirable in this slice, perform sequential writes
with a compensating update (set `payment_account_status = 'not_configured'` on upsert
failure) and add a note that the atomicity guarantee is best-effort. The safest path is the
RPC — prefer it.

### Route wiring (`routes/shelters.ts`)

The existing `routes/shelters.ts` handles shelter CRUD. Add two more branches before the
wildcard catch-all: match the `payment-config` sub-path, dispatch to the two new handlers.

### Dependencies wiring

Add `shelterPaymentConfigRepository?: ShelterPaymentConfigRepository` to
`WorkerRequestDependencies`. Wire in `createWorkerSupabaseDependencies` and
`resolveWorkerRequestDependencies`.

## 3. Testing Strategy

`tests/workers/shelter-payment-config.test.ts` — all fake repositories and authenticators.

Failing-first tests (write before implementation):
- GET returns `configured: false` when no config row exists.
- GET returns `configured: true` with iban and mbWayPhone when config exists.
- GET returns 403 when actor is not a shelter member.
- POST with missing iban → 400 `invalid_config`.
- POST with iban shorter than 15 chars → 400 `invalid_config`.
- POST with valid iban + no phone → 200 `payment_config_saved`, `mbWayPhone: null`.
- POST with valid iban + phone → 200 `payment_config_saved`, `mbWayPhone` set.
- POST with no auth → 401.
- POST to wrong shelter → 403.

## 4. Validation Commands

```
npx tsc --noEmit -p tests/tsconfig.json
npm run typecheck
npm run lint
npm run test
npm run build
```

## 5. Risk Controls

- Never expose `apiKeyEncrypted` or `webhookSecretEncrypted` in GET response — the select
  query must explicitly exclude those columns.
- The `payment_account_status` flip is the trigger that opens the donation gate: an atomic
  write is mandatory. If the RPC approach is not taken, document the risk clearly.
- Membership check (`canManageShelter`) must run before any DB write — never after.
