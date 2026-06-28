# Pic4Paws V2 Software Design Document

Status: Approved
Date: 2026-06-03
Approved: 2026-06-03

## 1. Purpose

This SDD translates the approved architecture into strict product contracts and a target folder structure for implementation. It is intentionally framework-aware but domain-first: core business rules must live in shared packages before being wired into UI, API, workers or database policies.

Implementation is now allowed to proceed through strict TDD work items.

## 2. Product Scope

Pic4Paws V2 connects Portuguese shelters, sanctuaries, adopters and sponsors through:

- A mobile-first paw-feed for pet discovery.
- Adoption applications with structured review.
- One-time donations and recurring sponsorships.
- Shelter dashboards for residents, sponsors, donations and applications.
- Admin oversight for moderation, tenants, compliance and financial reconciliation.

The app must support PT-PT natively, be ready for i18n, comply with GDPR, and prioritize low-cost infrastructure.

## 3. Core Principles

- The legacy app is functional reference only.
- All externally supplied data must be validated with runtime schemas.
- Authorization must exist at application and database-policy level.
- Payment state must come from verified server-side PSP events.
- Personal and sensitive data must be minimized, encrypted where appropriate, and separated from public feed data.
- Every feature starts with an enriched work item (Goal / States / Contract / Affected files) and a failing test.

## 4. Shared Type Conventions

All IDs should be opaque UUID strings generated server-side.

```ts
export type UUID = string;
export type ISODateTime = string;
export type Locale = 'pt-PT' | 'en';
export type CurrencyCode = 'EUR';

export type AuditMetadata = {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime | null;
};
```

## 5. Core Interfaces

### User

`User` represents an authenticated person. Authentication identity is provided by Supabase Auth; application profile and role data live in Postgres.

```ts
export type UserRole = 'admin' | 'shelter_owner' | 'shelter_member' | 'adopter';

export type UserStatus = 'active' | 'pending_verification' | 'suspended' | 'deleted';

export type User = AuditMetadata & {
  id: UUID;
  authUserId: UUID;
  role: UserRole;
  status: UserStatus;
  email: string;
  displayName: string;
  phoneNumber?: string | null;
  locale: Locale;
  avatarMediaId?: UUID | null;
  gdprConsentVersion: string;
  gdprConsentAcceptedAt: ISODateTime;
};
```

Rules:

- Email must be normalized to lowercase.
- `admin`, `shelter_owner` and `shelter_member` accounts should support MFA.
- `deleted` users must be anonymized where deletion is legally allowed.
- A user can belong to multiple shelters through memberships, but only with explicit roles.

### Shelter

`Shelter` represents a legal or operational animal-care organization.

```ts
export type ShelterKind = 'shelter' | 'sanctuary' | 'association' | 'foster_network';

export type ShelterVerificationStatus =
  | 'draft'
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'suspended';

export type Shelter = AuditMetadata & {
  id: UUID;
  name: string;
  slug: string;
  kind: ShelterKind;
  verificationStatus: ShelterVerificationStatus;
  taxId?: string | null;
  registrationNumber?: string | null;
  publicEmail?: string | null;
  publicPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city: string;
  district?: string | null;
  postalCode?: string | null;
  countryCode: 'PT';
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  logoMediaId?: UUID | null;
  coverMediaId?: UUID | null;
  paymentAccountStatus: 'not_configured' | 'pending' | 'active' | 'disabled';
};
```

Rules:

- Only verified shelters can publish pets to the public feed or receive payments.
- Private legal/payment fields must not be exposed in public APIs.
- Public location may be approximate when exact location would create animal or staff safety risk.

### Pet

`Pet` represents an adoptable or sponsored animal belonging to a shelter/sanctuary.

```ts
export type PetSpecies =
  | 'dog'
  | 'cat'
  | 'horse'
  | 'donkey'
  | 'guinea_pig'
  | 'rabbit'
  | 'bird'
  | 'other';

export type PetSex = 'female' | 'male' | 'unknown';

export type PetSize = 'small' | 'medium' | 'large' | 'giant' | 'unknown';

export type PetStatus =
  | 'draft'
  | 'published'
  | 'adoption_pending'
  | 'adopted'
  | 'not_available'
  | 'archived';

export type PetMedicalStatus = {
  vaccinated?: boolean | null;
  sterilized?: boolean | null;
  microchipped?: boolean | null;
  specialNeeds?: boolean | null;
  publicNotes?: string | null;
};

export type PetSponsorshipSettings = {
  enabled: boolean;
  monthlyGoalCents?: number | null;
  currentMonthCoveredCents?: number | null;
  goalLabel?: string | null;
};

export type Pet = AuditMetadata & {
  id: UUID;
  shelterId: UUID;
  status: PetStatus;
  name: string;
  species: PetSpecies;
  customSpeciesLabel?: string | null;
  breedPrimary?: string | null;
  breedSecondary?: string | null;
  sex: PetSex;
  size: PetSize;
  birthDate?: string | null;
  estimatedAgeLabel?: string | null;
  locationLabel: string;
  shortDescription: string;
  story?: string | null;
  traits: string[];
  adoptionFeeCents?: number | null;
  mediaIds: UUID[];
  heroMediaId?: UUID | null;
  medical: PetMedicalStatus;
  sponsorship: PetSponsorshipSettings;
  publishedAt?: ISODateTime | null;
};
```

Rules:

- `draft` pets are visible only to authorized shelter members.
- `published` pets require at least name, species, location label, description and one public image.
- Medical information shown publicly must be non-sensitive and shelter-approved.
- Sponsorship values are stored in cents to avoid floating-point financial errors.

### AdoptionForm

`AdoptionForm` captures an adopter application for one pet. It contains personal data and must be protected accordingly.

```ts
export type AdoptionApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'more_info_requested'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'expired';

export type HousingType = 'apartment' | 'house' | 'farm' | 'other';

export type AdoptionForm = AuditMetadata & {
  id: UUID;
  petId: UUID;
  shelterId: UUID;
  applicantUserId: UUID;
  status: AdoptionApplicationStatus;
  submittedAt?: ISODateTime | null;
  reviewedAt?: ISODateTime | null;
  reviewedByUserId?: UUID | null;
  applicant: {
    fullName: string;
    email: string;
    phoneNumber: string;
    city: string;
    district?: string | null;
    postalCode?: string | null;
  };
  household: {
    housingType: HousingType;
    hasOutdoorSpace: boolean;
    hasChildren: boolean;
    hasOtherAnimals: boolean;
    otherAnimalsDescription?: string | null;
  };
  experience: {
    previousPetExperience: string;
    dailyRoutine: string;
    adoptionMotivation: string;
    veterinarianContact?: string | null;
  };
  consent: {
    dataProcessingAccepted: boolean;
    shelterContactAccepted: boolean;
    consentVersion: string;
    acceptedAt: ISODateTime;
  };
  internalNotes?: string | null;
  rejectionReason?: string | null;
};
```

Rules:

- Adoption forms are never public.
- Only the applicant, relevant shelter members and admins can access an application.
- Internal shelter notes are never visible to the applicant unless explicitly exposed through a separate message/action.
- Retention policy must define when rejected, withdrawn or expired applications are anonymized/deleted.

### DonationTransaction

`DonationTransaction` records one-time donations and recurring sponsorship payments.

### ShelterPaymentConfig

`ShelterPaymentConfig` records how a shelter receives money. One row per shelter. Tier
`'manual'` requires no PSP — donors transfer via IBAN or MB WAY and upload a receipt.
Tier `'automated'` requires an `activeProvider` and its credentials; the system calls
the PSP API to generate a payment reference on the donor's behalf.

```ts
export type ActivePaymentProvider = 'ifthenpay' | 'eupago';

export type ShelterPaymentTier = 'manual' | 'automated';

export type ShelterPaymentConfig = AuditMetadata & {
  id: UUID;
  shelterId: UUID;
  tier: ShelterPaymentTier;
  iban: string | null;
  mbWayPhone: string | null;
  activeProvider: ActivePaymentProvider | null;
  // Provider credentials are stored encrypted; never returned in API responses.
};
```

Rules:

- `activeProvider` must be set when `tier = 'automated'`; must be null when `tier = 'manual'`.
- API credentials (`eupagoApiKeyEncrypted`, `ifthenpayAntiPhishingKey`, etc.) are
  provider-specific columns; they are never returned in worker responses, only read
  server-side for reference generation and webhook validation.
- Changing `activeProvider` while donations are `pending_payment` is not permitted (guard
  in the config worker).
- Each PSP sends callbacks to its own dedicated webhook path so both providers can operate
  simultaneously across different shelters: `GET /webhooks/payments/ifthenpay` and
  `POST /webhooks/payments/eupago`.

### DonationTransaction

`DonationTransaction` records one-time donations and recurring sponsorship payments.

```ts
export type DonationKind = 'one_time_donation' | 'monthly_sponsorship';

export type PaymentProvider = 'eupago' | 'ifthenpay' | 'stripe';

export type PaymentMethod = 'mb_way' | 'multibanco' | 'card' | 'bank_transfer' | 'unknown';

export type DonationStatus =
  | 'created'
  | 'pending_payment'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export type DonationTransaction = AuditMetadata & {
  id: UUID;
  kind: DonationKind;
  status: DonationStatus;
  provider: PaymentProvider;
  providerPaymentId: string;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  idempotencyKey: string;
  shelterId: UUID;
  petId?: UUID | null;
  donorUserId?: UUID | null;
  donorDisplayName?: string | null;
  donorEmail?: string | null;
  amountCents: number;
  feeCents?: number | null;
  netAmountCents?: number | null;
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  paidAt?: ISODateTime | null;
  refundedAt?: ISODateTime | null;
  rawProviderEventIds: string[];
  publicMessage?: string | null;
  anonymous: boolean;
};
```

Rules:

- Amounts are always integer cents.
- `paid`, `refunded` and `partially_refunded` transitions must be driven by verified PSP webhook/API confirmation.
- `providerPaymentId` and `idempotencyKey` must be unique.
- Raw PSP event payloads should be stored in a separate audit/event table with sensitive fields minimized.
- Donation records may need legal retention even when donor profile data is deleted.
- Each PSP uses its own dedicated webhook path: `GET /webhooks/payments/ifthenpay` (anti-phishing key
  in query) and `POST /webhooks/payments/eupago` (HMAC-SHA256 via `x-eupago-signature` header).
  The legacy `POST /webhooks/payments` path is deprecated once both provider-specific endpoints are live.

## 6. Supporting Entities

The core interfaces above imply additional tables/contracts:

- `ShelterMembership`: maps users to shelters and shelter-local permissions.
- `MediaAsset`: stores R2 object keys, mime types, visibility and derivative metadata.
- `FeedPost`: publishable feed entry derived from pets and shelter content.
- `Sponsorship`: active recurring commitment for a donor, pet and shelter.
- `ShelterPaymentConfig`: per-shelter payment tier, IBAN/MB WAY details, and encrypted
  PSP credentials. One row per shelter. See §5 `ShelterPaymentConfig`.
- `PaymentWebhookEvent`: immutable provider event log for idempotency and audits.
- `AuditEvent`: security, admin and financial state-transition trail.
- `Notification`: user/shelter alerts for applications, payments and moderation.

## 7. Authorization Model

Default access:

- Anonymous users can read public published pets, verified shelter profiles and public feed posts.
- Adopters can create and manage their own adoption applications and donation preferences.
- Shelter members can manage pets and applications for shelters they belong to.
- Shelter owners can manage members, public profile, payment setup and dashboard data.
- Admins can moderate shelters, pets, users and compliance workflows.

Database RLS must enforce the same boundaries independently of application code.

## 8. Folder Structure

Approved target structure:

```text
apps/
  mobile/
    app/                  # Expo Router routes
    src/
      features/
      components/
      hooks/
      i18n/
  web/
    app/                  # Next.js routes
    src/
      features/
      components/
      server/
      i18n/
  workers/
    src/
      payment-webhooks/
      public-api/
packages/
  domain/
    src/
      entities/
      rules/
      fixtures/
      validation/
  config/
    src/
      env/
      constants/
  database/
    src/
      schema/
      migrations/
      policies/
      seeds/
  payments/
    src/
      providers/
      webhooks/
      reconciliation/
  ui/
    src/
      tokens/
      components/
      icons/
docs/
  canonical/
  work-tracks/
  work-items/
  work-specs/
tests/
  e2e/
  integration/
  policies/
```

Monorepo orchestration:

- Turborepo should coordinate build, test, lint and typecheck pipelines.
- Use package-manager workspaces for dependency linking.
- Prefer `pnpm` workspaces after approval unless there is a practical reason to stay on npm workspaces.

## 9. Initial Work Tracks After Approval

Recommended next tracks:

1. `FOUND-002`: migrate exploratory boilerplate to approved Turborepo workspace structure.
2. `DB-001`: define Drizzle schema and Supabase RLS policy tests for core entities.
3. `AUTH-001`: implement role-aware Supabase Auth contracts.
4. `PETS-001`: implement pet draft/publish lifecycle.
5. `PAY-001`: implement donation transaction contract and PSP webhook idempotency.

## 10. Acceptance Criteria For This SDD

- Core interfaces for `User`, `Shelter`, `Pet`, `AdoptionForm` and `DonationTransaction` are defined.
- Target folder structure is defined.
- GDPR, payment and authorization boundaries are explicit.
- Implementation may proceed through strict TDD work items.
