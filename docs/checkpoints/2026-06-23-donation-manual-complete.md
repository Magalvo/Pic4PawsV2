# Checkpoint — 2026-06-23: Manual Donation Slice Complete

## Status

**HEAD**: `af65636` (PR #266 merged)
**Tests**: 2437 passing (274 test files)
**Gates**: typecheck ✅ lint ✅ test ✅ build ✅

## What Was Completed Since Last Checkpoint

### Push Notifications (PRs #240–#244)
- `PUSH-TOKEN-WORKER-001` (PR #240) — `POST/DELETE /notifications/push-token` Worker route
- `PUSH-TOKEN-CLIENT-001` (PR #242) — `createPushTokenClient` in `@pic4paws/client`
- `PUSH-DISPATCH-001` (PR #243) — `PushNotificationProvider` interface wired into notification repositories (fire-and-forget)
- `MOBILE-PUSH-001` (PR #244) — `expo-notifications` permission + token registration on app start, unregister on sign-out

### Manual Donation Tier (PRs #245–#256)
- `DONATE-TIER-DB-001` (PR #245) — DB migration for manual donation tier (`payment_config` table, `tier` column)
- `DONATE-CONFIG-WORKER-001` (PR #246) — `GET/PATCH /shelters/:shelterId/payment-config` Worker route
- `DONATE-CONFIG-CLIENT-001` (PR #247) — `createSavePaymentConfigClient` + `createLoadPaymentConfigClient` in `@pic4paws/client`
- `DONATE-TIER-WORKER-001` (PR #248) — donation tier routing (manual vs automated), `initialStatus: pending_receipt` for manual tier
- `DONATE-MANUAL-WORKER-001` (PR #249) — `PATCH /donations/:id/receipt` + `PATCH /donations/:id/review` Worker routes; `DonationManualRepository`; media ownership verification
- `DONATE-MANUAL-CLIENT-001` (PR #250) — `createSubmitReceiptClient` + `createReviewDonationClient` + `createMediaUploadFlowClient` in `@pic4paws/client`
- `WEB-DONATE-CONFIG-001` (PR #251) — Web payment config boundary (`createWebShelterPaymentConfigUi`)
- `MOBILE-DONATE-CONFIG-001` (PR #252) — Mobile payment config screen (`pagamento.tsx`)
- `WEB-DONATE-RECEIPT-001` (PR #253) — Web receipt submission boundary (`createWebDonationReceiptUi`)
- `MOBILE-DONATE-RECEIPT-001` (PR #254) — Mobile receipt submission screen (`comprovativo.tsx`)
- `WEB-DONATE-REVIEW-001` (PR #255) — Web donation review boundary (`createWebDonationReviewUi`)
- `MOBILE-DONATE-REVIEW-001` (PR #256) — Mobile donation review screen (`doacoes/[donationId].tsx`)

### Audit + Remediation (PRs #259–#267)
- PR #259 — SDD audit of PRs #249–#256 (score 7/10)
- PR #260 — SDD audit of PRs #235–#258 (score 7/10); 14 findings + 2 notes raised
- PR #261 — F-01: 0-row `.update()` → 409 `donation_wrong_state`; `submitReceipt`/`approveDonation`/`rejectDonation` return `boolean`, `.select('id')` chained
- PR #262 — F-03 + F-08: `'donation_receipt'` added to `MediaUploadPurpose`; `purpose` filter in `verifyMediaOwnership`; receipt boundaries corrected
- PR #263 — F-09: `now: () => string` factory pattern; timestamp captured after auth, not at dispatch
- PR #264 — F-06 + F-07: `mobileSupabaseClient` singleton in `doacoes/[donationId].tsx`; `uiRef.current` null-guard in async Alert callbacks
- PR #265 — F-04/F-05/F-11/F-12/F-13/F-14: `pagamento.tsx` useRef + idle-only guard; `comprovativo.tsx` try/catch + disabled button; `.is('deleted_at', null)` on update chains; `http.ts` shared helpers
- PR #266 — F-02 + N-02: `expo-image-picker` + `expo-notifications` installed; real `launchImageLibraryAsync` replaces hardcoded mock
- PR #267 — F-10: empty-string guard in `verifyMediaOwnership`

## Architecture Decisions Made
- `MediaUploadPurpose` now includes `'donation_receipt'` — domain type in `packages/domain/src/media-policy.ts`
- `DonationManualRepository` mutation methods return `boolean` (not `void`) to detect 0-row concurrent-state updates
- `now: () => string` factory injected at route level so timestamp is captured post-auth
- `apps/workers/src/http.ts` is the canonical home for `jsonResponse` + `extractBearerToken` in the workers package
- `expo-image-picker` is the file picker for mobile receipt upload

## What Is Next

Check `docs/work-tracks/remake-foundation.md` for the next planned track. Current production gaps:
1. Payment provider env wiring (`paymentWebhookVerifier` — deployment config, not code)
2. Mobile app store artifacts (EAS build, icons, bundle IDs)
3. Run a fresh SDD audit to establish the new baseline before starting the next track
