# Checkpoint — 2026-06-28: Eupago Multi-Provider Payment Support

## Status

**HEAD (main)**: `16602c4` (PR #280 merged — `EUPAGO-REFERENCE-FACTORY-001`)
**Tests**: 2515 passing (includes PR #281 in review; ~2490 on main after PR #280)
**Gates**: typecheck ✅ lint ✅ test ✅ build ✅

**In review**: PR #281 — `EUPAGO-DONATION-CLIENT-001` (automated donation client + Web + Mobile boundaries)

## What Was Completed Since Last Checkpoint

Previous checkpoint: `2026-06-23-donation-manual-complete.md` (PR #266, 2437 tests)

### Eupago Provider Support (PRs #276–#281)

- PR #276 — spec: Eupago provider support — SDD update + 4 new work items defined
- `EUPAGO-DB-001` (PR #277) — DB migration: `shelter_active_provider` enum (`eupago | ifthenpay`), `eupago_api_key_encrypted` + `ifthenpay_api_key_encrypted` columns on `shelter_payment_configs`
- `EUPAGO-CONFIG-WORKER-001` (PR #278) — provider selection in payment config Worker: `activeProvider` field in `GET/PATCH /shelters/:shelterId/payment-config`; AES-256-GCM credential encryption (`encryptCredential`/`decryptCredential` in `apps/workers/src/crypto.ts`); provider-switch guard blocks re-encrypt on mixed update; `ShelterPaymentConfigClient` extended with `activeProvider`
- `EUPAGO-WEBHOOK-001` (PR #279) — isolated per-provider webhook endpoints: `GET /webhooks/payments/eupago` + `GET /webhooks/payments/ifthenpay`; `EupagoWebhookVerifier` (query-param `chave` HMAC); `IfthenpayWebhookVerifier` (existing logic migrated); per-shelter credential lookup so each shelter's webhook is verified with its own key; old `GET /webhooks/payments` retired
- `EUPAGO-REFERENCE-FACTORY-001` (PR #280) — payment reference factory: `PaymentReferenceFactory` interface + `PaymentReferenceInput` + `PaymentReferenceResult` + `PaymentReference` discriminated union (`multibanco | mb_way | bank_transfer`); `createEupagoReferenceAdapter` (Eupago API v1.02); `createIfthenpayReferenceAdapter` (Ifthenpay SPG API); `createSupabasePaymentReferenceFactory` (per-shelter lookup + AES-256-GCM decryption + adapter dispatch); automated-tier 501 stub in `POST /donations` replaced with full flow (create DB row → call PSP → set `providerPaymentId` or fail)
- `EUPAGO-DONATION-CLIENT-001` (PR #281, in review) — `DonationClientSuccess` discriminated union on `tier` (`manual|automated`); `DonationClientPaymentReference` type; `payment_reference_failed` + `provider_credentials_unavailable` added to `DonationClientFailureStatus`; `parseDonationSuccess` validates both union branches; Web + Mobile `submitted_automated` state; pages render Multibanco entity/reference or MB WAY phone instructions

## Architecture Decisions Made

- **Per-shelter credential encryption**: provider API keys stored as AES-256-GCM ciphertext in `shelter_payment_configs`; decrypted at request time using a Worker-side `PAYMENT_ENCRYPTION_SECRET`. Never stored or logged in plaintext.
- **Per-shelter webhook verification**: each shelter has its own HMAC key; the webhook path encodes the provider (`/webhooks/payments/eupago`, `/webhooks/payments/ifthenpay`); multi-provider coexistence enabled without a global provider flag.
- **Factory pattern for PSP adapters**: `PaymentReferenceFactory` interface allows Eupago and Ifthenpay adapters to be swapped without changing the donation handler. `createSupabasePaymentReferenceFactory` acts as the selector.
- **Create-then-call ordering**: donation DB row is created first to obtain a `donationId`, which is passed to `paymentReferenceFactory.createReference`. PSP failures trigger optional `failDonation` rollback on the row.
- **`submitted_automated` as a distinct ViewModel state**: keeps manual-tier `submitted` state unchanged (backward compat with pages); automated tier gets its own `submitted_automated` state with `provider` + `reference` fields.

## What Is Next

- Merge PR #281 (`EUPAGO-DONATION-CLIENT-001`) — automated donation client + Web + Mobile boundaries
- Run a fresh SDD audit to establish the Eupago baseline before the next track begins
- Production deployment gap: `PAYMENT_ENCRYPTION_SECRET` must be set in Workers env before any shelter can save provider credentials
- Consider: end-to-end Eupago smoke test (real API key, staging environment)
