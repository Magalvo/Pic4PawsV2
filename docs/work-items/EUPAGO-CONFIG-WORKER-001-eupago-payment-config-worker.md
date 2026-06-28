---
id: EUPAGO-CONFIG-WORKER-001
title: Eupago provider — payment config worker extension
status: done
depends-on: EUPAGO-DB-001
pr: 278
merged: 2026-06-28
---

# Work-Item: EUPAGO-CONFIG-WORKER-001 — Extend Payment Config for Provider Selection

## 1. Context & Problem

`DONATE-CONFIG-WORKER-001` (merged) exposes `GET/POST /shelters/:id/payment-config` but
only saves manual-tier fields (IBAN, MB WAY phone). The payload and response do not
include an `activeProvider` or provider-specific credentials. Shelters cannot yet configure
their automated payment provider.

This item extends the config endpoints to:
- Accept `activeProvider: 'ifthenpay' | 'eupago'` and the corresponding credentials.
- Validate and store credentials encrypted (`EUPAGO-DB-001` columns).
- Return `activeProvider` in the GET response (never returning credential values).
- Guard against switching provider while donations are in `pending_payment` state.

## Goal

Extend `GET/POST /shelters/:id/payment-config` to support provider selection and
credential storage for both Ifthenpay and Eupago automated tiers.

## States

All existing states from `DONATE-CONFIG-WORKER-001` are preserved. New states:

- `invalid_provider_config`: payload specifies `tier: 'automated'` but `activeProvider`
  is missing or unrecognised, or the required credentials for the chosen provider are absent.
- `provider_switch_blocked`: shelter has active `pending_payment` donations — changing
  `activeProvider` is rejected until they settle.
- `payment_config_saved`: unchanged — now also covers automated-tier saves.

## Contract

### POST payload (extended)

```ts
type SavePaymentConfigPayload = {
  tier: 'manual' | 'automated';
  // Manual tier
  iban?: string | null;
  mbWayPhone?: string | null;
  // Automated tier
  activeProvider?: 'ifthenpay' | 'eupago';
  // Eupago credentials (required when activeProvider = 'eupago')
  eupagoApiKey?: string;
  eupagoWebhookSecret?: string;
  // Ifthenpay credentials (required when activeProvider = 'ifthenpay')
  ifthenpayAntiPhishingKey?: string;
};
```

Validation rules:
- `tier = 'manual'`: `iban` required; `activeProvider` and all provider keys must be absent.
- `tier = 'automated'` + `activeProvider = 'eupago'`: `eupagoApiKey` required;
  `eupagoWebhookSecret` required; IBAN fields ignored.
- `tier = 'automated'` + `activeProvider = 'ifthenpay'`: `ifthenpayAntiPhishingKey`
  required; IBAN fields ignored.
- `eupagoApiKey` and `eupagoWebhookSecret` are encrypted with AES-256-GCM before
  being written to `eupago_api_key_encrypted` / `eupago_webhook_secret_encrypted`.
- `ifthenpayAntiPhishingKey` is written as-is to `ifthenpay_anti_phishing_key`.

### GET response (extended)

```ts
type GetPaymentConfigResponse =
  | { status: 'ok'; configured: false }
  | {
      status: 'ok';
      configured: true;
      tier: 'manual' | 'automated';
      iban: string | null;
      mbWayPhone: string | null;
      activeProvider: 'ifthenpay' | 'eupago' | null;
      // Credentials are NEVER returned — presence flags only:
      eupagoApiKeyConfigured: boolean;
      ifthenpayAntiPhishingKeyConfigured: boolean;
    };
```

## Acceptance Criteria

- [ ] Extend `validatePaymentConfigPayload` in `apps/workers/src/shelter-payment-config.ts`
  with the rules above; return `reasons` including:
  - `'active_provider_required'`: `tier = 'automated'` but no `activeProvider`
  - `'eupago_api_key_required'`: `activeProvider = 'eupago'` but `eupagoApiKey` absent
  - `'eupago_webhook_secret_required'`: `activeProvider = 'eupago'` but `eupagoWebhookSecret` absent
  - `'ifthenpay_anti_phishing_key_required'`: `activeProvider = 'ifthenpay'` but key absent

- [ ] Add `checkPendingPaymentDonations(shelterId)` to `PaymentConfigRepository`:
  returns `Promise<boolean>` — true if any `pending_payment` donations exist for the
  shelter.

- [ ] Add provider-switch guard in `handleSavePaymentConfigRequest`:
  if `activeProvider` differs from the current stored value AND pending payments exist,
  return 409 `provider_switch_blocked`.

- [ ] Add `encryptCredential(plain: string, secret: string): string` and
  `decryptCredential(encrypted: string, secret: string): string` utility functions
  (AES-256-GCM) in `apps/workers/src/crypto.ts` (new file). The `ENCRYPTION_SECRET`
  env var is the key; add it to `packages/config/src/env.ts`.

- [ ] Update `handleSavePaymentConfigRequest` to encrypt `eupagoApiKey` and
  `eupagoWebhookSecret` before passing them to the repository.

- [ ] Update `ShelterPaymentConfigRepository.savePaymentConfig` signature to accept:
  ```ts
  {
    tier: 'manual' | 'automated';
    iban: string | null;
    mbWayPhone: string | null;
    activeProvider: 'ifthenpay' | 'eupago' | null;
    eupagoApiKeyEncrypted: string | null;
    eupagoWebhookSecretEncrypted: string | null;
    ifthenpayAntiPhishingKey: string | null;
  }
  ```

- [ ] Update `handleGetPaymentConfigRequest` to return `activeProvider`,
  `eupagoApiKeyConfigured`, and `ifthenpayAntiPhishingKeyConfigured` from the
  stored row (presence flags, never raw values).

- [ ] Update `createSupabaseShelterPaymentConfigRepositories` to read/write new columns
  and implement `checkPendingPaymentDonations`.

- [ ] Tests in `tests/workers/shelter-payment-config.test.ts` (extend existing):
  - `tier = 'automated'` without `activeProvider` → 400 `invalid_provider_config`
  - `activeProvider = 'eupago'` without `eupagoApiKey` → 400
  - `activeProvider = 'eupago'` with all credentials → 200 `payment_config_saved`
  - `activeProvider = 'ifthenpay'` with `ifthenpayAntiPhishingKey` → 200
  - Provider switch with pending payments → 409 `provider_switch_blocked`
  - GET returns `activeProvider` and presence flags, no raw credential values

- [ ] Tests in `tests/workers/crypto.test.ts` (new):
  - Encrypt/decrypt round-trip matches original.
  - Different secrets produce different ciphertext.
  - Tampered ciphertext fails decryption.

- [ ] Final validation: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## 3. Security Notes

- Raw `eupagoApiKey` and `eupagoWebhookSecret` must never appear in logs, error
  messages, or API responses.
- The `ENCRYPTION_SECRET` must be ≥ 32 bytes. Validate length at startup in
  `parseEnvironmentConfig`.
- `encryptCredential` must use a random IV per encryption; store `iv:ciphertext` as
  a single colon-delimited string.

## 4. Non-Goals

- Do not implement reference generation (EUPAGO-REFERENCE-FACTORY-001).
- Do not implement webhook routing (EUPAGO-WEBHOOK-001).
- Do not expose a UI for provider selection (follow-on web/mobile work items).

## Affected Files

- `apps/workers/src/shelter-payment-config.ts`
- `apps/workers/src/shelter-payment-config-supabase.ts`
- `apps/workers/src/crypto.ts` (new)
- `packages/config/src/env.ts`
- `tests/workers/shelter-payment-config.test.ts`
- `tests/workers/crypto.test.ts` (new)
