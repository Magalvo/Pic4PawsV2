---
id: EUPAGO-DONATION-CLIENT-001
title: Eupago — automated donation client + Web + Mobile boundaries
status: todo
depends-on: EUPAGO-REFERENCE-FACTORY-001
---

# Work-Item: EUPAGO-DONATION-CLIENT-001 — Automated Donation Client + UI Boundaries

## 1. Context & Problem

`EUPAGO-REFERENCE-FACTORY-001` (merged) extended `POST /donations` so that
automated-tier shelters return a `reference` block (Multibanco entity/reference or MB WAY
phone) in the 201 response instead of IBAN + receipt instructions.

The `DonationClient` in `@pic4paws/client` was not updated — it still maps a flat
`DonationClientSuccess` that only carries manual-tier fields (`iban`, `mbWayPhone`). The
Web and Mobile donation product boundaries show only the IBAN / manual receipt flow.

This item wires the automated tier end-to-end: client type → product boundary → pages.

## Goal

Update `DonationClient` to expose the payment reference on `tier: 'automated'` success.
Update Web and Mobile donation product boundaries to show the payment reference (Multibanco
entity/reference or MB WAY phone instructions) to the donor.

## States

### DonationClientSuccess — discriminated union

```ts
type DonationClientSuccess =
  | {
      ok: true; status: 'donation_created'; donationId: string; tier: 'manual';
      amountCents: number; currency: string; kind: DonationClientKind;
      shelterId: string; createdAt: string; iban: string | null; mbWayPhone: string | null;
    }
  | {
      ok: true; status: 'donation_created'; donationId: string; tier: 'automated';
      provider: 'eupago' | 'ifthenpay';
      reference: DonationClientPaymentReference;
    };
```

### DonationClientPaymentReference

```ts
type DonationClientPaymentReference =
  | { method: 'mb_way';     phone: string;  expiresAt: string | null }
  | { method: 'multibanco'; entity: string; reference: string; expiresAt: string | null }
  | { method: 'bank_transfer'; iban: string };
```

### New failure statuses

- `payment_reference_failed` — PSP returned an error (502 from Worker)
- `provider_credentials_unavailable` — shelter has no decryptable credentials (503 from Worker)

### Web + Mobile donation boundary new states

Extend the existing `WebDonationUi` / `MobileDonationUi`:
- `submitted_manual` — existing renamed state (tier: manual, shows IBAN + receipt instructions)
- `submitted_automated` — new state (tier: automated, shows payment reference)
- `payment_reference_failed` — new state (502 from Worker)
- `provider_credentials_unavailable` — new state (503 from Worker)

All other states (`idle`, `submitting`, `failed`) are unchanged.

## Contract

### `parseDonationSuccess`

When `tier === 'automated'`:
- `reference` block must be present and have a valid `method` field
- Returns manual-union branch for `tier: 'manual'`, automated-union branch for `tier: 'automated'`

### Worker status → client status mapping

| Worker body `status` | HTTP | Client status |
|---|---|---|
| `donation_created` | 201 | `donation_created` |
| `payment_reference_failed` | 502 | `payment_reference_failed` |
| `provider_credentials_unavailable` | 503 | `provider_credentials_unavailable` |

## Acceptance Criteria

- [ ] `packages/client/src/donations.ts`:
  - Add `DonationClientPaymentReference` type
  - Make `DonationClientSuccess` a discriminated union on `tier`
  - Add `payment_reference_failed` | `provider_credentials_unavailable` to `DonationClientFailureStatus`
  - Update `parseDonationSuccess` to validate and return both union branches
  - Update `parseDonationFailureStatus` to map both new statuses

- [ ] Tests in `tests/client/donation-client.test.ts` (new or extend existing):
  - 201 manual tier → manual union branch with `iban`
  - 201 automated tier + multibanco → automated union branch with `reference.method === 'multibanco'`
  - 201 automated tier + mb_way → automated union branch with `reference.method === 'mb_way'`
  - 502 `payment_reference_failed` → client failure with that status
  - 503 `provider_credentials_unavailable` → client failure with that status
  - Missing `reference` on automated tier → `worker_response_invalid`

- [ ] `packages/domain/src/` or `packages/client/src/`: `WebDonationUi` extended to handle
  `submitted_automated` state (show payment reference block); `submitted_manual` is the
  existing submitted state renamed where needed

- [ ] Web: `createWebDonationUi` handles new states with PT-PT copy:
  - Multibanco: "Entidade: XXXXX · Referência: XXXXXXXXX · Válido até: DD/MM/YYYY"
  - MB WAY: "Aceite o pagamento no número XXXXXXXXX"

- [ ] Mobile: `createMobileDonationUi` handles new states with same PT-PT copy

- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`

## Affected Files

- `packages/client/src/donations.ts`
- `packages/client/src/index.ts`
- `packages/web/src/donation/` (web boundary)
- `apps/mobile/app/doacoes.tsx` or equivalent (mobile page)
- `tests/client/donation-client.test.ts` (new or extend)
