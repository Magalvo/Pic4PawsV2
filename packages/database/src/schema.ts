import { getTableColumns, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'shelter_owner',
  'shelter_member',
  'adopter',
]);

export const userStatusEnum = pgEnum('user_status', [
  'active',
  'pending_verification',
  'suspended',
  'deleted',
]);

export const shelterKindEnum = pgEnum('shelter_kind', [
  'shelter',
  'sanctuary',
  'association',
  'foster_network',
]);

export const shelterVerificationStatusEnum = pgEnum('shelter_verification_status', [
  'draft',
  'pending_review',
  'verified',
  'rejected',
  'suspended',
]);

export const paymentAccountStatusEnum = pgEnum('payment_account_status', [
  'not_configured',
  'pending',
  'active',
  'disabled',
]);

export const petSpeciesEnum = pgEnum('pet_species', [
  'dog',
  'cat',
  'horse',
  'donkey',
  'guinea_pig',
  'rabbit',
  'bird',
  'other',
]);

export const petSexEnum = pgEnum('pet_sex', ['female', 'male', 'unknown']);
export const petSizeEnum = pgEnum('pet_size', ['small', 'medium', 'large', 'giant', 'unknown']);

export const petStatusEnum = pgEnum('pet_status', [
  'draft',
  'published',
  'adoption_pending',
  'adopted',
  'not_available',
  'archived',
]);

export const adoptionApplicationStatusEnum = pgEnum('adoption_application_status', [
  'draft',
  'submitted',
  'under_review',
  'more_info_requested',
  'approved',
  'rejected',
  'withdrawn',
  'expired',
]);

export const housingTypeEnum = pgEnum('housing_type', ['apartment', 'house', 'farm', 'other']);

export const donationKindEnum = pgEnum('donation_kind', [
  'one_time_donation',
  'monthly_sponsorship',
]);

export const paymentProviderEnum = pgEnum('payment_provider', ['eupago', 'ifthenpay', 'stripe']);

export const paymentMethodEnum = pgEnum('payment_method', [
  'mb_way',
  'multibanco',
  'card',
  'bank_transfer',
  'unknown',
]);

export const donationStatusEnum = pgEnum('donation_status', [
  'created',
  'pending_payment',
  'paid',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded',
]);

export const sponsorshipStatusEnum = pgEnum('sponsorship_status', [
  'active',
  'paused',
  'cancelled',
  'failed',
]);

export const mediaVisibilityEnum = pgEnum('media_visibility', ['public', 'private']);

const auditColumns = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authUserId: uuid('auth_user_id').notNull(),
    role: userRoleEnum('role').notNull(),
    status: userStatusEnum('status').notNull().default('pending_verification'),
    email: varchar('email', { length: 320 }).notNull(),
    displayName: text('display_name').notNull(),
    phoneNumber: text('phone_number'),
    locale: varchar('locale', { length: 8 }).notNull().default('pt-PT'),
    avatarMediaId: uuid('avatar_media_id'),
    gdprConsentVersion: text('gdpr_consent_version').notNull(),
    gdprConsentAcceptedAt: timestamp('gdpr_consent_accepted_at', { withTimezone: true }).notNull(),
    ...auditColumns,
  },
  (table) => [
    uniqueIndex('users_auth_user_id_unique').on(table.authUserId),
    uniqueIndex('users_email_unique').on(table.email),
  ],
);

export const shelters = pgTable(
  'shelters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    kind: shelterKindEnum('kind').notNull(),
    verificationStatus: shelterVerificationStatusEnum('verification_status')
      .notNull()
      .default('draft'),
    taxId: text('tax_id'),
    registrationNumber: text('registration_number'),
    publicEmail: varchar('public_email', { length: 320 }),
    publicPhone: text('public_phone'),
    addressLine1: text('address_line_1'),
    addressLine2: text('address_line_2'),
    city: text('city').notNull(),
    district: text('district'),
    postalCode: text('postal_code'),
    countryCode: varchar('country_code', { length: 2 }).notNull().default('PT'),
    latitude: text('latitude'),
    longitude: text('longitude'),
    description: text('description'),
    logoMediaId: uuid('logo_media_id'),
    coverMediaId: uuid('cover_media_id'),
    paymentAccountStatus: paymentAccountStatusEnum('payment_account_status')
      .notNull()
      .default('not_configured'),
    ...auditColumns,
  },
  (table) => [uniqueIndex('shelters_slug_unique').on(table.slug)],
);

export const shelterMemberships = pgTable(
  'shelter_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shelterId: uuid('shelter_id')
      .notNull()
      .references(() => shelters.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: userRoleEnum('role').notNull(),
    ...auditColumns,
  },
  (table) => [uniqueIndex('shelter_memberships_user_shelter_unique').on(table.userId, table.shelterId)],
);

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: uuid('owner_user_id').references(() => users.id),
  shelterId: uuid('shelter_id').references(() => shelters.id),
  r2ObjectKey: text('r2_object_key').notNull(),
  mimeType: text('mime_type').notNull(),
  visibility: mediaVisibilityEnum('visibility').notNull().default('private'),
  width: integer('width'),
  height: integer('height'),
  derivativeMetadata: jsonb('derivative_metadata').$type<Record<string, unknown>>(),
  ...auditColumns,
});

export const pets = pgTable('pets', {
  id: uuid('id').primaryKey().defaultRandom(),
  shelterId: uuid('shelter_id')
    .notNull()
    .references(() => shelters.id),
  status: petStatusEnum('status').notNull().default('draft'),
  name: text('name'),
  species: petSpeciesEnum('species'),
  customSpeciesLabel: text('custom_species_label'),
  breedPrimary: text('breed_primary'),
  breedSecondary: text('breed_secondary'),
  sex: petSexEnum('sex').notNull().default('unknown'),
  size: petSizeEnum('size').notNull().default('unknown'),
  birthDate: text('birth_date'),
  estimatedAgeLabel: text('estimated_age_label'),
  locationLabel: text('location_label'),
  shortDescription: text('short_description'),
  story: text('story'),
  traits: jsonb('traits').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  adoptionFeeCents: integer('adoption_fee_cents'),
  mediaIds: jsonb('media_ids').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  heroMediaId: uuid('hero_media_id').references(() => mediaAssets.id),
  medical: jsonb('medical').$type<Record<string, boolean | string | null>>().notNull(),
  sponsorship: jsonb('sponsorship').$type<Record<string, boolean | number | string | null>>().notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  ...auditColumns,
});

export const adoptionApplications = pgTable('adoption_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id')
    .notNull()
    .references(() => pets.id),
  shelterId: uuid('shelter_id')
    .notNull()
    .references(() => shelters.id),
  applicantUserId: uuid('applicant_user_id')
    .notNull()
    .references(() => users.id),
  status: adoptionApplicationStatusEnum('status').notNull().default('draft'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id),
  applicantFullName: text('applicant_full_name').notNull(),
  applicantEmail: varchar('applicant_email', { length: 320 }).notNull(),
  applicantPhoneNumber: text('applicant_phone_number').notNull(),
  applicantCity: text('applicant_city').notNull(),
  applicantDistrict: text('applicant_district'),
  applicantPostalCode: text('applicant_postal_code'),
  housingType: housingTypeEnum('housing_type').notNull(),
  hasOutdoorSpace: boolean('has_outdoor_space').notNull(),
  hasChildren: boolean('has_children').notNull(),
  hasOtherAnimals: boolean('has_other_animals').notNull(),
  otherAnimalsDescription: text('other_animals_description'),
  previousPetExperience: text('previous_pet_experience').notNull(),
  dailyRoutine: text('daily_routine').notNull(),
  adoptionMotivation: text('adoption_motivation').notNull(),
  veterinarianContact: text('veterinarian_contact'),
  dataProcessingAccepted: boolean('data_processing_accepted').notNull(),
  shelterContactAccepted: boolean('shelter_contact_accepted').notNull(),
  consentVersion: text('consent_version').notNull(),
  consentAcceptedAt: timestamp('consent_accepted_at', { withTimezone: true }).notNull(),
  internalNotes: text('internal_notes'),
  rejectionReason: text('rejection_reason'),
  ...auditColumns,
});

export const donationTransactions = pgTable(
  'donation_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: donationKindEnum('kind').notNull(),
    status: donationStatusEnum('status').notNull().default('created'),
    provider: paymentProviderEnum('provider').notNull(),
    providerPaymentId: text('provider_payment_id').notNull(),
    providerCustomerId: text('provider_customer_id'),
    providerSubscriptionId: text('provider_subscription_id'),
    idempotencyKey: text('idempotency_key').notNull(),
    shelterId: uuid('shelter_id')
      .notNull()
      .references(() => shelters.id),
    petId: uuid('pet_id').references(() => pets.id),
    donorUserId: uuid('donor_user_id').references(() => users.id),
    donorDisplayName: text('donor_display_name'),
    donorEmail: varchar('donor_email', { length: 320 }),
    amountCents: integer('amount_cents').notNull(),
    feeCents: integer('fee_cents'),
    netAmountCents: integer('net_amount_cents'),
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
    paymentMethod: paymentMethodEnum('payment_method').notNull().default('unknown'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
    rawProviderEventIds: jsonb('raw_provider_event_ids')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    publicMessage: text('public_message'),
    anonymous: boolean('anonymous').notNull().default(false),
    ...auditColumns,
  },
  (table) => [
    uniqueIndex('donation_transactions_provider_payment_unique').on(table.provider, table.providerPaymentId),
    uniqueIndex('donation_transactions_idempotency_key_unique').on(table.idempotencyKey),
  ],
);

export const sponsorships = pgTable('sponsorships', {
  id: uuid('id').primaryKey().defaultRandom(),
  shelterId: uuid('shelter_id')
    .notNull()
    .references(() => shelters.id),
  petId: uuid('pet_id')
    .notNull()
    .references(() => pets.id),
  donorUserId: uuid('donor_user_id').references(() => users.id),
  provider: paymentProviderEnum('provider').notNull(),
  providerSubscriptionId: text('provider_subscription_id').notNull(),
  status: sponsorshipStatusEnum('status').notNull().default('active'),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  ...auditColumns,
});

export const paymentWebhookEvents = pgTable(
  'payment_webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: paymentProviderEnum('provider').notNull(),
    providerEventId: text('provider_event_id').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    processingError: text('processing_error'),
    ...auditColumns,
  },
  (table) => [uniqueIndex('payment_webhook_events_provider_event_unique').on(table.provider, table.providerEventId)],
);

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorUserId: uuid('actor_user_id').references(() => users.id),
  shelterId: uuid('shelter_id').references(() => shelters.id),
  subjectType: text('subject_type').notNull(),
  subjectId: uuid('subject_id'),
  action: text('action').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
});

export const getSchemaColumnNames = (table: Parameters<typeof getTableColumns>[0]): string[] =>
  Object.keys(getTableColumns(table));
