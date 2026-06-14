# Work-Item: DONATION-ELIGIBILITY-001-Server-Side Donation Eligibility

## Goal

Donation intents must be created only after the server verifies shelter, pet, payment account and provider/method eligibility. Client claims must not decide payment state or donor identity.

## States

- `unauthenticated`: no actor is available and no donation intent can be created.
- `payload_invalid`: request shape, consent or amount fails validation.
- `eligibility_rejected`: shelter/pet/payment context exists but is not eligible.
- `intent_created`: repository inserts a server-derived pending donation intent.
- `repository_failed`: eligibility or insert persistence fails without leaking secrets.

## Contract

- Before insert, load server-side eligibility context for the requested `shelterId` and optional `petId`.
- Reject when shelter is missing, not `verified`, or its payment account is not `active`.
- Reject when `petId` is provided and the pet is missing or belongs to a different shelter.
- Reject when the requested payment method is unsupported by the configured provider.
- Always derive `donorUserId` from the authenticated actor, never from payload.
- Payment state remains `created`/server-side pending until verified webhook/API transitions it.

## Affected files

- `apps/workers/src/donation.ts`
- `apps/workers/src/donation-supabase.ts`
- `tests/workers/donation.test.ts`
- `tests/workers/donation-supabase-repository.test.ts`
