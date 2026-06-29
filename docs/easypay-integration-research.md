# Easypay Integration — Research & Open Decisions

**Date:** 2026-06-29  
**Status:** Blocked — awaiting Easypay response before any code is written

---

## Context

Pic4Paws is a donation platform for animal shelters. Some shelters already use Easypay to receive donations. The goal is to allow shelters to connect their existing Easypay accounts within the Pic4Paws platform so that donors can pay via Multibanco or MB Way without the shelter needing to switch PSP.

---

## Technical Architecture (Current State)

The platform already has working payment integrations with Eupago and Ifthenpay. The relevant infrastructure:

| Component | Current State |
|---|---|
| DB schema | `shelter_payment_configs` stores per-shelter encrypted API credentials (AES-256-GCM) |
| Encryption | Credentials encrypted at rest; `ENCRYPTION_SECRET` stored separately in Cloudflare Workers secrets |
| Access control | Service-role-only table (RLS migration 0009 strips anon/authenticated access) |
| Runtime | Worker decrypts credentials in memory, makes API call, discards plaintext; never returned to clients |
| Providers live | Eupago (fully integrated), Ifthenpay (MB KEY + MBWAY KEY, fully integrated) |

**What adding Easypay as a provider would require (not to be built yet):**

- New DB column: `easypay_api_key_encrypted` on `shelter_payment_configs`
- New adapter: `createEasypayReferenceAdapter` (same pattern as existing adapters)
- Add `easypay` to the `activeProvider` enum and Drizzle schema
- Shelter settings UI: form for inputting and saving the API key
- Env config: `EASYPAY_API_KEY` for development/testing

---

## Research Finding 1 — API Key / Third-Party Use

Easypay describes Authentication Keys as controlling "who can access Easypay's APIs on your behalf" and states that merchants can create multiple keys. However:

- Documentation warns keys are the merchant's **"biggest secret"** and should be shared carefully with a company or developer building the site or app.
- General Terms reference not just the public T&Cs but also the application, technical documentation, rules of use, and special/particular conditions — the public docs do not conclusively permit a third-party platform to store and use each shelter's API key as an operating model.
- Easypay has a separate **Marketplace solution** covering split payments and PSD2 considerations, marketed as a bespoke / contact-us product. This strongly implies they expect platforms to sign a dedicated agreement rather than improvise with individual merchant keys.

> **Conclusion:** Must ask Easypay directly whether using individual shelter API keys is permitted under a normal merchant account, or whether a platform/marketplace/partner agreement is required.

---

## Research Finding 2 — Webhook Routing

Easypay payment notifications (webhooks) are configured per account in Backoffice under **Developers → Configuration API 2.0 → Notifications**. Findings:

- Three singular URL fields exist: **Generic URL**, **Authorisation URL**, and **Payment URL**.
- Easypay recommends using only the Generic notification (covers status changes, payments, authorisations, and cancellations).
- No public documentation confirms support for multiple webhook URLs per notification type.
- If a shelter already has a webhook configured (e.g. for their accounting system or CRM), pointing it at Pic4Paws would **overwrite it and break their existing integration**.

> **Conclusion:** Assume one URL per notification type unless Easypay confirms otherwise. If a shelter already uses their webhook, Pic4Paws must either build a fan-out relay (receive, process, then forward to the shelter's original URL) or the shelter must choose between Pic4Paws and their existing integration.

---

## What Easypay's Marketplace Product Would Solve

If Pic4Paws signs a platform/marketplace agreement with Easypay, both findings above are resolved:

| Problem | How Marketplace Solves It |
|---|---|
| ToS ambiguity on API key sharing | Pic4Paws holds one master key under a formal platform contract |
| Webhook conflict with shelters | One webhook endpoint at Pic4Paws; shelters are sub-merchants with no separate webhook config |
| PSD2 compliance | Easypay handles the regulatory requirements as the licensed entity |
| Split payments | Easypay can route funds directly to each shelter's IBAN |

**Trade-off:** bespoke contract (likely revenue share or monthly fee) and dependency on Easypay's sub-merchant onboarding flow for each new shelter.

---

## Security of Stored API Keys

### Risk profile of a leaked key

| Action | Possible with key alone? |
|---|---|
| Generate Multibanco references / MB Way requests | Yes |
| Query transaction history and amounts | Yes — financial data exposure |
| Refund a transaction | Possibly — depends on Easypay permission model |
| Change the IBAN where money lands | No — requires dashboard credentials |
| Steal money in transit | No — funds route to registered IBAN only |

### Existing protections in the platform

- AES-256-GCM encryption at rest — DB breach alone is insufficient without `ENCRYPTION_SECRET`.
- `ENCRYPTION_SECRET` stored separately in Cloudflare Workers secrets, not in the database.
- Service-role-only DB table — anon and authenticated Supabase roles cannot read `shelter_payment_configs`.
- Credentials never returned in API responses — decrypted in Worker memory only for the duration of the API call.

### Known gaps

- No key rotation tooling — if `ENCRYPTION_SECRET` leaks, re-encrypting all stored credentials requires manual tooling not yet built.
- No audit log of credential access — a compromise would be hard to investigate post-incident.

**Recommendation:** require shelters to create a dedicated, scoped API key for Pic4Paws rather than sharing their master Easypay key. If Easypay supports permission-scoped keys (e.g. generate references only, no transaction history), enforce that at onboarding.

---

## Questions to Ask Easypay

Contact: `comercial@easypay.pt` or the Marketplace contact form on easypay.com.

1. Is it permitted under a standard merchant account for a third-party platform to store and use a shelter's API key to generate payment references on their behalf?
2. If not, what is the correct commercial model — platform/marketplace agreement, reseller programme, or partner API?
3. Does the Marketplace product support existing Easypay merchant accounts migrating in as sub-merchants?
4. Do webhooks support multiple endpoint URLs per notification type, or is there only one URL per type?
5. If only one webhook URL is supported, is there a fan-out or relay feature, or must the shelter choose between Pic4Paws and their existing integration?
6. What are the commercial terms for a platform/marketplace agreement (fees, revenue share, minimum volumes)?

---

## Recommended Next Step

**Contact Easypay with the questions above before writing any Easypay adapter code.**

While waiting for their response, shelters have two working options today:

- **Manual IBAN tier** — already live. Shelters provide their IBAN; donors receive bank transfer instructions.
- **Eupago automated tier** — fully integrated and working. New shelters can onboard with Eupago.

No Easypay-specific code (adapter, DB column, UI) should be written until the commercial and webhook questions are resolved.
