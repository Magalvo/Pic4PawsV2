# Pic4Paws V2 Architecture Proposal

Status: Pending human approval
Date: 2026-06-03

## 1. Executive Recommendation

Build Pic4Paws V2 as a Portugal-first, GDPR-conscious, low-cost cross-platform product with:

- Mobile-first client experience for adopters and sponsors.
- Web dashboard experience for shelters/sanctuaries and admins.
- Shared TypeScript domain contracts.
- PostgreSQL as the system of record.
- Local Portuguese payment gateway support for MB WAY and Multibanco.
- Object storage optimized for high-volume pet media.

The legacy app in `reference/` is strictly functional reference. Its architecture, mixed UI stack and JavaScript patterns should not be copied.

## 2. Recommended Stack

### Frontend

Recommended:

- `Expo React Native` with `Expo Router` for the adopter/sponsor mobile app.
- `Next.js` for public web, shelter dashboard and admin dashboard.
- Shared design tokens, domain types and validation schemas in `packages/*`.
- TypeScript strict mode everywhere.

Why:

- The product is naturally mobile-heavy because the paw-feed, adoption discovery, sponsorship and photo workflows should feel app-native.
- Shelter/admin workflows are better on web where tables, forms and operational dashboards are easier to use.
- Expo avoids native iOS/Android maintenance overhead during MVP.
- Next.js gives strong routing, server-side rendering where useful, and a mature deployment story.

Current boilerplate note:

- The current `apps/web` React/Vite slice is useful as a visual prototype, but should not be treated as the final approved architecture until this proposal is accepted.

### Backend

Recommended:

- `Supabase` for hosted PostgreSQL, Auth, Row Level Security, Realtime and database migrations.
- `Cloudflare Workers` for payment webhooks, lightweight API adapters and edge-safe public endpoints.
- `Drizzle ORM` or direct typed SQL migrations for application-owned schema.
- `Zod` for runtime validation at every external boundary.

Why:

- Supabase keeps cost and operational burden low while providing Postgres, Auth and RLS in one platform.
- Postgres is a better fit than document-first storage for GDPR reporting, donation accounting, adoption forms, audit logs and multi-tenant permissions.
- Cloudflare Workers scale to zero and are a strong fit for webhooks, cacheable public reads and low-cost edge execution.
- RLS gives us a hard database-level authorization layer, not only route-level checks.

### Database

Recommended:

- Supabase Postgres in an EU region, preferably `eu-west-1` Ireland, `eu-west-3` Paris or `eu-central-1` Frankfurt.
- One shared database with strict tenant boundaries:
  - `users`
  - `roles`
  - `shelters`
  - `shelter_memberships`
  - `pets`
  - `pet_media`
  - `adoption_applications`
  - `donation_transactions`
  - `sponsorships`
  - `audit_events`

GDPR posture:

- Store only data needed for adoption, donation and account operations.
- Keep sensitive adoption-form fields separate from public pet/feed data.
- Use explicit retention policies for failed applications, inactive users and transaction metadata.
- Implement export/delete workflows from the beginning.

### Media Storage

Recommended:

- `Cloudflare R2` for original pet images and documents.
- Signed upload URLs generated server-side.
- Public CDN-cached derivatives only for non-sensitive pet images.
- Private buckets for adoption documents, IDs, medical records or anything involving personal/sensitive data.

Why:

- The paw-feed is image-heavy, so egress costs matter.
- R2 has no egress bandwidth charge, while still charging storage and operations.
- Keeping media storage outside the database avoids database bloat and keeps feed delivery cheaper.

### Hosting

Recommended MVP hosting:

- Web/dashboard: Cloudflare Pages or Vercel.
- Edge/API/webhooks: Cloudflare Workers.
- Database/Auth: Supabase EU region.
- Media: Cloudflare R2.

Cost principle:

- Start on free or low-cost tiers.
- Upgrade only for production requirements: backups, higher database limits, custom domains, observability, support, or compliance documentation.

## 3. Payment Gateway Strategy

### Requirements

Pic4Paws must support:

- One-time donations.
- Monthly recurring sponsorships.
- Portuguese-native methods: MB WAY and Multibanco.
- Cards for international donors.
- Clear reconciliation per shelter/pet/campaign.

### Recommended Primary Gateway: Eupago

Use Eupago as the first candidate for Portugal-native payments.

Why:

- Supports Multibanco, MB WAY and card payments.
- Publishes transparent pricing for Portuguese methods.
- Supports recurring payments, including workflows relevant to subscriptions.
- Is local-market aligned, which should improve conversion for Portuguese donors.

Indicative public pricing observed on 2026-06-03:

- MB WAY: `0.07 EUR + 0.7%`
- Multibanco: `0.20 EUR + 1.5%`

These fees must be confirmed directly with Eupago before production, especially for charity/association pricing, refunds, recurring payments and settlement rules.

### Secondary Candidate: Ifthenpay

Evaluate Ifthenpay alongside Eupago.

Why:

- Also supports Multibanco, MB WAY, Payshop, cards and other local methods.
- Public contract/pricing references show similar fee levels for MB WAY and Multibanco.
- Strong Portuguese ecosystem presence.

Use as:

- Backup PSP candidate.
- Negotiation benchmark.
- Potential fallback if Eupago does not support a required sponsorship or settlement flow.

### Stripe Role

Use Stripe selectively, not as the first Portuguese-payment default.

Best uses:

- International card payments.
- Stripe Billing for card-based recurring donations if local recurring flows are insufficient.
- Future marketplace/split-payment investigation through Stripe Connect.

Caution:

- Stripe supports MB WAY and Multibanco, but local PSPs may be cheaper and more familiar for Portuguese donors.
- If donations are routed to multiple shelters, marketplace payout and charity compliance must be reviewed before implementation.

### Payment Architecture

Initial payment flow:

1. User creates donation/sponsorship intent in Pic4Paws.
2. Server creates a PSP payment request.
3. PSP handles payment confirmation.
4. PSP webhook is received by Cloudflare Worker.
5. Worker verifies signature/secret and writes immutable transaction event.
6. Supabase function updates donation/sponsorship state.
7. Shelter dashboard reads reconciled donation data from Postgres.

Hard rules:

- Never trust client-side payment status.
- Every payment state change must originate from a verified webhook or explicitly verified PSP API call.
- Store PSP raw event IDs for idempotency.
- Keep immutable audit events for financial state transitions.

## 4. Security Architecture

### Identity & Roles

Initial roles:

- `admin`
- `shelter_owner`
- `shelter_member`
- `adopter`

Controls:

- Supabase Auth with MFA support for admin/shelter roles.
- Database RLS policies for every tenant-owned table.
- Server-only service-role key access in Workers/functions.
- Public profile/feed data separated from private adoption/payment records.

### Validation & API Safety

Required patterns:

- Zod schemas for request payloads, environment variables and webhook payloads.
- Centralized error handling.
- Rate limiting for auth, uploads, application submissions and payment intents.
- CSRF-safe patterns for dashboard actions.
- Strict CORS by environment.
- No secrets in client bundles.

### GDPR

Required from first production milestone:

- Privacy policy in Portuguese.
- Data Processing Agreements with Supabase, Cloudflare and PSP.
- EU data region for database.
- Consent tracking where required.
- Right to access/export/delete data.
- Data retention policy.
- Breach-response process and audit log.
- Minimized public exposure of shelter/adopter personal data.

## 5. Testing & Quality Strategy

Required test layers:

- Domain unit tests for pet, shelter, adoption, sponsorship and payment rules.
- API/worker tests for authz, validation, idempotency and webhook handling.
- Database policy tests for RLS.
- Component tests for key forms and dashboards.
- E2E tests for adoption application, donation and sponsorship flows.

Required commands:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Every feature should follow:

1. Architecture alignment.
2. SDD/work item.
3. Failing test.
4. Minimal implementation.
5. Self-healing validation loop.
6. Refactor after green tests.

## 6. Proposed Folder Structure

Final target structure after approval:

```text
apps/
  mobile/              # Expo React Native app
  web/                 # Next.js public site + shelter/admin dashboards
  workers/             # Cloudflare Workers for webhooks and edge APIs
packages/
  domain/              # Shared entities, business rules and fixtures
  config/              # Typed env/config schemas
  database/            # Drizzle schema, migrations, RLS tests
  payments/            # PSP adapters and payment contracts
  ui/                  # Shared tokens/components where practical
docs/
  canonical/           # Long-term decisions and approved architecture
  work-tracks/         # Epics
  work-items/          # Atomic tasks
  work-specs/          # Implementation plans
tests/
  e2e/
  integration/
  policies/
```

## 7. Open Decisions For Approval

Please approve or adjust:

- Frontend split: Expo mobile app plus Next.js web/dashboard.
- Supabase as primary Postgres/Auth/RLS platform in an EU region.
- Cloudflare R2 as media storage for pet feed images.
- Cloudflare Workers for payment webhooks and low-cost edge APIs.
- Eupago as first PSP candidate, with Ifthenpay and Stripe evaluated as fallbacks/complements.

Once approved, the next document should be `docs/canonical/sdd.md` with strict interfaces for `User`, `Shelter`, `Pet`, `AdoptionForm` and `DonationTransaction`.

## 8. Sources Checked

- Supabase pricing: https://supabase.com/docs/pricing
- Supabase regions: https://supabase.com/docs/guides/platform/regions
- Supabase security: https://supabase.com/docs/guides/security
- Supabase DPA: https://supabase.com/downloads/docs/Supabase%2BDPA%2B250805.pdf
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Stripe MB WAY docs: https://docs.stripe.com/payments/mb-way/accept-a-payment
- Stripe Multibanco docs: https://docs.stripe.com/payments/multibanco
- Stripe local payment pricing Portugal: https://stripe.com/en-pt/pricing/local-payment-methods
- Eupago payments: https://www.eupago.pt/opcoes-de-pagamento/pagamentos-pontuais
- Eupago recurring payments: https://www.eupago.pt/opcoes-de-pagamento/pagamentos-recorrentes
- Eupago pricing: https://www.eupago.pt/tarifario
- Ifthenpay payment methods: https://helpdesk.ifthenpay.com/pt-PT/support/solutions/articles/79000080673-formas-de-pagamento-e-canais-de-pagamento
- Ifthenpay pricing/contract reference: https://ifthenpay.com/assets/files/CONTRATO-IFTHENPAY-PT.pdf
- MB WAY recurring/authorized payments: https://www.mbway.pt/funcionalidades/
