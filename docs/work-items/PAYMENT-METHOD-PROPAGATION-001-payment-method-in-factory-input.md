---
id: PAYMENT-METHOD-PROPAGATION-001
title: Carry payment method and donor MB WAY phone into PaymentReferenceFactory
status: done
depends-on: EUPAGO-REFERENCE-FACTORY-001
pr: 289
merged: 2026-06-28
---

# Work-Item: PAYMENT-METHOD-PROPAGATION-001 — Payment Method Propagation

## 1. Context & Problem

`PaymentReferenceInput` has no `paymentMethod` field. Both adapters (Eupago,
Ifthenpay) infer the PSP endpoint from `mbWayPhone` in their constructor config, which
is sourced from `shelter_payment_configs.mb_way_phone`. Automated-tier shelters always
have `mb_way_phone = null`, so every automated reference call falls through to Multibanco
regardless of the donor's selected method.

Additionally, MB WAY PSP calls require the donor's phone number. No phone field exists in
`DonationClientInput`, the Worker payload validation, or the donation forms.

## Goal

Add `paymentMethod` and `mbWayPhone` to `PaymentReferenceInput`. Remove
`mbWayPhone` from adapter constructors — adapters route on `input.paymentMethod` and
read `input.mbWayPhone` directly. Propagate both fields from the donation request through
the Worker handler. Add `mbWayPhone` to `DonationClientInput`, forms and payload builder.

## States

No new ViewModel states. The fix is in the Worker handler and factory layer;
`submitted_automated` already renders `mb_way` and `multibanco` references correctly.

## Acceptance Criteria

- [x] `apps/workers/src/payment-reference-factory.ts`:
  - `PaymentReferenceInput` adds `paymentMethod: 'mb_way' | 'multibanco'`
  - `PaymentReferenceInput` adds `mbWayPhone?: string | null`
- [x] `apps/workers/src/eupago-reference-adapter.ts`:
  - Remove `mbWayPhone` from `CreateEupagoReferenceAdapterInput`
  - Route on `input.paymentMethod`; use `input.mbWayPhone` for MB WAY calls
- [x] `apps/workers/src/ifthenpay-reference-adapter.ts`: same pattern
- [x] `apps/workers/src/payment-reference-factory-supabase.ts`: remove `mbWayPhone` from adapter creation
- [x] `apps/workers/src/donation.ts`:
  - `ValidatedDonationPayload` adds `mbWayPhone: string | null`
  - `validateDonationPayload` extracts `mbWayPhone`
  - Before `createReference`: guard `paymentMethod` to `mb_way|multibanco`; require `mbWayPhone` for `mb_way`
  - Pass `paymentMethod` and `mbWayPhone` to `createReference`
- [x] `packages/client/src/donations.ts`:
  - `DonationClientInput` adds `mbWayPhone?: string | null`
  - `buildDonationPayload` includes `mbWayPhone`
- [x] Web and Mobile donation forms: conditional MB WAY phone input; pass `mbWayPhone`
- [x] Tests updated across adapter, factory, donation, and client suites
- [x] All four gates pass: typecheck, lint, test, build

## Affected Files

- `apps/workers/src/payment-reference-factory.ts`
- `apps/workers/src/eupago-reference-adapter.ts`
- `apps/workers/src/ifthenpay-reference-adapter.ts`
- `apps/workers/src/payment-reference-factory-supabase.ts`
- `apps/workers/src/donation.ts`
- `packages/client/src/donations.ts`
- `apps/web/app/abrigos/[shelterId]/doar/page.tsx`
- `apps/mobile/app/abrigos/[shelterId]/doar.tsx`
- `tests/workers/eupago-reference-adapter.test.ts`
- `tests/workers/payment-reference-factory-supabase.test.ts`
- `tests/workers/donation.test.ts`
- `tests/client/donation-client.test.ts`
