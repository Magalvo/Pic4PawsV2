# Work-Spec: Implementation Plan for DONATE-TIER-WORKER-001

## 1. Target Files

- `docs/work-items/DONATE-TIER-WORKER-001-tier-aware-donation-creation.md`
- `docs/work-specs/DONATE-TIER-WORKER-001-tier-aware-donation-creation.md`
- `apps/workers/src/donation.ts`
- `apps/workers/src/donation-supabase.ts`
- `packages/client/src/donations.ts`
- `tests/workers/donation.test.ts`
- `tests/workers/donation-supabase-repository.test.ts`

## 2. Proposed Technical Approach

### Eligibility context enrichment (`donation.ts`)

`DonationEligibilityContext` currently has `shelter` and `pet`. Add a third field:

```ts
paymentConfig: {
  tier: 'manual' | 'automated';
  iban: string | null;
  mbWayPhone: string | null;
} | null;
```

`validateDonationEligibility` already checks `payment_account_status`. Add one more check:
if `paymentConfig` is null, push `'payment_config_not_found'` to reasons. This is a guard
against the data inconsistency where `payment_account_status = 'active'` but no config row
exists (can only happen via direct DB manipulation, but the guard is cheap and important).

### Initial status derivation (`donation.ts`)

After eligibility passes, derive `initialStatus` before calling `createDonation`:

```ts
const initialStatus =
  eligibilityContext.paymentConfig?.tier === 'manual'
    ? 'pending_receipt'
    : 'pending_payment';  // Phase 2 stub
```

If `tier === 'automated'`, return `{ status: 'not_implemented', reason: 'automated_tier_requires_phase2' }`
with HTTP 501. This makes the automated branch explicit and safe.

### Supabase adapter (`donation-supabase.ts`)

`getDonationEligibilityContext` performs a secondary SELECT on `shelter_payment_configs`
after the shelter row is loaded (sequential, not JOIN, to keep the existing query shape
intact and avoid schema coupling in raw Supabase selects):

```ts
const configResult = await client
  .from('shelter_payment_configs')
  .select('tier,iban,mb_way_phone')
  .eq('shelter_id', shelterId)
  .maybeSingle();
```

`createDonation` accepts a new `initialStatus: DonationStatus` parameter and passes it
as the `status` column value (replacing the hardcoded `'created'` from DONATION-WORKER-001).

### Response shape change

The 201 response body gains three new fields:

```json
{
  "status": "donation_created",
  "donationId": "...",
  "amountCents": 1000,
  "currency": "EUR",
  "kind": "one_time_donation",
  "shelterId": "...",
  "createdAt": "...",
  "tier": "manual",
  "iban": "PT50000201231234567890154",
  "mbWayPhone": "+351912345678"
}
```

For future automated-tier (returns 501), these fields are absent.

### Client update (`packages/client/src/donations.ts`)

`DonationClientSuccess` gains:
```ts
tier: 'manual' | 'automated';
iban: string | null;
mbWayPhone: string | null;
```

`parseDonationSuccess` must validate `tier` is a string and accept `null` for `iban`/
`mbWayPhone` (they are nullable for the automated tier path in the future).

## 3. Testing Strategy

Extend `tests/workers/donation.test.ts` (existing file):

New failing-first tests:
- Eligibility context with manual-tier config → `pending_receipt` initial status in created donation.
- Eligibility context with `paymentConfig: null` → 409 `payment_config_not_found`.
- 201 response for manual tier contains `tier: 'manual'`, `iban`, `mbWayPhone`.
- 201 response `iban` is null when config has no IBAN (edge case guard).
- Automated-tier stub → 501 `not_implemented`.

Extend `tests/workers/donation-supabase-repository.test.ts`:
- `getDonationEligibilityContext` returns `paymentConfig` when config row exists.
- `getDonationEligibilityContext` returns `paymentConfig: null` when config row absent.
- `createDonation` inserts row with `status = 'pending_receipt'` when `initialStatus` is
  `'pending_receipt'`.

## 4. Validation Commands

```
npx tsc --noEmit -p tests/tsconfig.json
npm run typecheck
npm run lint
npm run test
npm run build
```

## 5. Risk Controls

- Automated-tier path must explicitly return 501, not silently fall through to success.
- The IBAN in the response is the shelter's public banking detail — treat it like a public
  field, not a secret. Do not redact it.
- Never allow the client payload to override `initialStatus` — it is always server-derived
  from the payment config tier.
