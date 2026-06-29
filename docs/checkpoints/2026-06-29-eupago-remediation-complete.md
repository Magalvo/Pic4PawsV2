# Checkpoint — 2026-06-29: Eupago Audit Remediation Complete

## Status

**HEAD (main)**: `9928413` (PR #294 merged — docs: close 3 Eupago work items)
**Tests**: 2546 passing (280 test files)
**Gates**: typecheck ✅ lint ✅ test ✅ build ✅

## What Was Completed Since Last Checkpoint

Previous checkpoint: `2026-06-28-eupago-provider-support.md` (PR #281, 2515 tests)

### Eupago Audit Remediation Cycle (PRs #282–#295)

- Audit `2026-06-28-sdd-audit-prs-270-282.md` (PR #283, score 3/10) — 8 P1 findings raised covering RLS, webhook contract, column alignment, verifier composition, payment method propagation, provider ID persistence, provider switch guard, and mobile auth
- `PAYMENT-CONFIG-RLS-001` (PR #284) — RLS on `shelter_payment_configs`: anon/authenticated revoked, service_role CRUD retained, no client policies; migration `0009_payment_config_rls`; pgTAP coverage
- `PAYMENT-CONFIG-SCHEMA-001` (PR #285) — phantom `ifthenpay_api_key_encrypted` column replaced with committed `api_key_encrypted` legacy placeholder; schema contract test added
- `PAYMENT-WEBHOOK-COMPOSITION-001` (PR #286) — shared `paymentWebhookVerifier` dependency removed from `WorkerRequestDependencies`; each provider route now instantiates its own verifier factory directly
- `MOBILE-DONATION-AUTH-001` (PR #287) — `mobileSupabaseClient` singleton wired into mobile donation page; authenticated session forwarded correctly
- `PAYMENT-ENCRYPTION-KEY-001` (PR #288) — `ENCRYPTION_SECRET` validated at startup as 64-char hex; `fromHex` produces deterministic 32-byte key; environment-contract tests added
- `PAYMENT-METHOD-PROPAGATION-001` (PR #289) — `paymentMethod` and `mbWayPhone` added to `PaymentReferenceInput`; both adapters branch on `input.paymentMethod`; shelter-column phone path removed
- `PAYMENT-PROVIDER-SWITCH-GUARD-001` (PR #290) — provider-switch guard correctly handles automated→automated and automated→manual transitions
- `EUPAGO-WEBHOOK-CONTRACT-001` (PR #292) — Eupago Webhooks 2.0: nested `transactions` schema, base64 HMAC-SHA256, `X-Signature` header; status map covers Paid/Refund/Cancel/Error/Expired
- Audit `2026-06-28-sdd-audit-prs-283-292.md` (PR #293, score 7/10) — remediation check; P1-6 (provider ID persistence) and P3-1 (dead column) carried forward open
- `PAYMENT-PROVIDER-ID-PERSISTENCE-001` (PR #291) — 201 blocked until `setProviderPaymentId` write succeeds; runtime guard + try/catch + `failDonation` on all failure exits; dead `mb_way_phone` column removed from factory select
- Docs: PAYMENT-CONFIG-RLS-001, PAYMENT-CONFIG-SCHEMA-001, PAYMENT-WEBHOOK-COMPOSITION-001 marked done (PR #294)
- Audit `2026-06-29-sdd-audit-prs-291-294.md` (PR #295, score 9/10) — P1-6 and P3-1 closed; one P3 advisory open (DonationRepository interface hardening)

### F-01 / F-09 / F-10 Fixes (earlier in session, PRs #268–#274)

- F-01: `submitReceipt`, `approveDonation`, `rejectDonation` now chain `.select('id')` and return `'ok' | 'wrong_state'`; 409 returned on wrong-state
- F-09: `now` changed from `string` to `() => string` factory; timestamp captured immediately before DB write
- F-10: Client-side guard added before `submitReceipt` call validates non-empty `mediaId`

## Architecture Decisions Made (Eupago Remediation)

- **Per-provider verifier isolation**: each webhook route (`/eupago`, `/ifthenpay`) instantiates its own verifier factory directly; no shared global verifier via `WorkerRequestDependencies`.
- **Mandatory `setProviderPaymentId` at runtime**: guard checks presence before attempting the write; `failDonation` called on both absence and throw; 201 only returned after successful persistence. Type optionality not yet removed from interface (P3 advisory).
- **`now` as factory**: `() => string` instead of `string` ensures timestamps reflect actual DB-write time, not dispatch time.

## What Is Next

- **P3 interface hardening**: Remove `?:` from `setProviderPaymentId` and `failDonation` in `DonationRepository` (`apps/workers/src/donation.ts:75-76`). Low-risk — Supabase impl provides both already.
- **Production deployment**: `PAYMENT_ENCRYPTION_SECRET` must be provisioned in Cloudflare Workers env.
- **Ifthenpay production readiness**: Legacy path uses single `api_key_encrypted` placeholder; official API requires distinct `MB KEY` and `MBWAY KEY` per method. New work item needed.
- **Mobile app store artifacts**: EAS build config, icons, splash screens, bundle identifiers.
