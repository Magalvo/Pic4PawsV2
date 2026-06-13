import { rlsPolicies } from './rls-policies';
import { renderRlsMigrationSql } from './rls-sql';
import { registerShelterRpcSql } from './rpc-functions';

export type MigrationArtifact = {
  id: string;
  filename: `${string}.sql`;
  description: string;
  destructive: boolean;
  sql: string;
};

const destructiveSqlPattern =
  /\b(drop\s+table|drop\s+schema|drop\s+database|truncate|delete\s+from|alter\s+table\s+\S+\s+drop\s+column)\b/i;

const initialSchemaSql = `
create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'shelter_owner', 'shelter_member', 'adopter');
create type public.user_status as enum ('active', 'pending_verification', 'suspended', 'deleted');
create type public.shelter_kind as enum ('shelter', 'sanctuary', 'association', 'foster_network');
create type public.shelter_verification_status as enum ('draft', 'pending_review', 'verified', 'rejected', 'suspended');
create type public.payment_account_status as enum ('not_configured', 'pending', 'active', 'disabled');
create type public.pet_species as enum ('dog', 'cat', 'horse', 'donkey', 'guinea_pig', 'rabbit', 'bird', 'other');
create type public.pet_sex as enum ('female', 'male', 'unknown');
create type public.pet_size as enum ('small', 'medium', 'large', 'giant', 'unknown');
create type public.pet_status as enum ('draft', 'published', 'adoption_pending', 'adopted', 'not_available', 'archived');
create type public.adoption_application_status as enum ('draft', 'submitted', 'under_review', 'more_info_requested', 'approved', 'rejected', 'withdrawn', 'expired');
create type public.housing_type as enum ('apartment', 'house', 'farm', 'other');
create type public.donation_kind as enum ('one_time_donation', 'monthly_sponsorship');
create type public.payment_provider as enum ('eupago', 'ifthenpay', 'stripe');
create type public.payment_method as enum ('mb_way', 'multibanco', 'card', 'bank_transfer', 'unknown');
create type public.donation_status as enum ('created', 'pending_payment', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded');
create type public.sponsorship_status as enum ('active', 'paused', 'cancelled', 'failed');
create type public.media_visibility as enum ('public', 'private');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  role public.user_role not null,
  status public.user_status not null default 'pending_verification',
  email varchar(320) not null,
  display_name text not null,
  phone_number text,
  locale varchar(8) not null default 'pt-PT',
  avatar_media_id uuid,
  gdpr_consent_version text not null,
  gdpr_consent_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint users_auth_user_id_unique unique (auth_user_id),
  constraint users_email_unique unique (email)
);

create table public.shelters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  kind public.shelter_kind not null,
  verification_status public.shelter_verification_status not null default 'draft',
  tax_id text,
  registration_number text,
  public_email varchar(320),
  public_phone text,
  address_line_1 text,
  address_line_2 text,
  city text not null,
  district text,
  postal_code text,
  country_code varchar(2) not null default 'PT',
  latitude text,
  longitude text,
  description text,
  logo_media_id uuid,
  cover_media_id uuid,
  payment_account_status public.payment_account_status not null default 'not_configured',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint shelters_slug_unique unique (slug)
);

create table public.shelter_memberships (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id),
  user_id uuid not null references public.users (id),
  role public.user_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint shelter_memberships_user_shelter_unique unique (user_id, shelter_id)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users (id),
  shelter_id uuid references public.shelters (id),
  r2_object_key text not null,
  mime_type text not null,
  visibility public.media_visibility not null default 'private',
  width integer,
  height integer,
  derivative_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id),
  status public.pet_status not null default 'draft',
  name text,
  species public.pet_species,
  custom_species_label text,
  breed_primary text,
  breed_secondary text,
  sex public.pet_sex not null default 'unknown',
  size public.pet_size not null default 'unknown',
  birth_date text,
  estimated_age_label text,
  location_label text,
  short_description text,
  story text,
  traits jsonb not null default '[]'::jsonb,
  adoption_fee_cents integer,
  media_ids jsonb not null default '[]'::jsonb,
  hero_media_id uuid references public.media_assets (id),
  medical jsonb not null,
  sponsorship jsonb not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.adoption_applications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id),
  shelter_id uuid not null references public.shelters (id),
  applicant_user_id uuid not null references public.users (id),
  status public.adoption_application_status not null default 'draft',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references public.users (id),
  applicant_full_name text not null,
  applicant_email varchar(320) not null,
  applicant_phone_number text not null,
  applicant_city text not null,
  applicant_district text,
  applicant_postal_code text,
  housing_type public.housing_type not null,
  has_outdoor_space boolean not null,
  has_children boolean not null,
  has_other_animals boolean not null,
  other_animals_description text,
  previous_pet_experience text not null,
  daily_routine text not null,
  adoption_motivation text not null,
  veterinarian_contact text,
  data_processing_accepted boolean not null,
  shelter_contact_accepted boolean not null,
  consent_version text not null,
  consent_accepted_at timestamptz not null,
  internal_notes text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.donation_transactions (
  id uuid primary key default gen_random_uuid(),
  kind public.donation_kind not null,
  status public.donation_status not null default 'created',
  provider public.payment_provider not null,
  provider_payment_id text not null,
  provider_customer_id text,
  provider_subscription_id text,
  idempotency_key text not null,
  shelter_id uuid not null references public.shelters (id),
  pet_id uuid references public.pets (id),
  donor_user_id uuid references public.users (id),
  donor_display_name text,
  donor_email varchar(320),
  amount_cents integer not null,
  fee_cents integer,
  net_amount_cents integer,
  currency varchar(3) not null default 'EUR',
  payment_method public.payment_method not null default 'unknown',
  paid_at timestamptz,
  refunded_at timestamptz,
  raw_provider_event_ids jsonb not null default '[]'::jsonb,
  public_message text,
  anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint donation_transactions_provider_payment_unique unique (provider, provider_payment_id),
  constraint donation_transactions_idempotency_key_unique unique (idempotency_key)
);

create table public.sponsorships (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id),
  pet_id uuid not null references public.pets (id),
  donor_user_id uuid references public.users (id),
  provider public.payment_provider not null,
  provider_subscription_id text not null,
  status public.sponsorship_status not null default 'active',
  amount_cents integer not null,
  currency varchar(3) not null default 'EUR',
  started_at timestamptz not null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider public.payment_provider not null,
  provider_event_id text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  payload jsonb not null,
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint payment_webhook_events_provider_event_unique unique (provider, provider_event_id)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users (id),
  shelter_id uuid references public.shelters (id),
  subject_type text not null,
  subject_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
`.trim();

export const initialDatabaseMigration: MigrationArtifact = {
  id: '0001_initial_core_schema_and_rls',
  filename: '0001_initial_core_schema_and_rls.sql',
  description: 'Initial approved Pic4Paws core schema and RLS policy SQL.',
  destructive: false,
  sql: [initialSchemaSql, renderRlsMigrationSql(rlsPolicies)].join('\n\n'),
};

const notificationsSchemaSql = `
create type public.notification_type as enum (
  'adoption_status_changed',
  'new_adoption_application',
  'donation_paid',
  'sponsorship_status_changed'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  type public.notification_type not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "users_read_own_notifications"
  on public.notifications for select
  using (user_id = auth.uid());
`.trim();

export const notificationsMigration: MigrationArtifact = {
  id: '0002_notifications',
  filename: '0002_notifications.sql',
  description: 'Adds notification_type enum and notifications table for in-app alerts.',
  destructive: false,
  sql: notificationsSchemaSql,
};

export const registerShelterMigration: MigrationArtifact = {
  id: '0003_register_shelter_rpc',
  filename: '0003_register_shelter_rpc.sql',
  description:
    'Adds hardened register_shelter RPC: security definer with set search_path, schema-qualified tables, hardcoded safe defaults for verification_status and role, REVOKE/GRANT execute.',
  destructive: false,
  sql: registerShelterRpcSql.trim(),
};

export const migrationArtifacts = [
  initialDatabaseMigration,
  notificationsMigration,
  registerShelterMigration,
] as const;

export const assertNonDestructiveMigration = (artifact: MigrationArtifact): void => {
  if (artifact.destructive || destructiveSqlPattern.test(artifact.sql)) {
    throw new Error('Destructive SQL is not allowed in migration artifacts');
  }
};

export const renderMigrationArtifact = (artifact: MigrationArtifact): string => {
  assertNonDestructiveMigration(artifact);

  return [`-- ${artifact.id}`, `-- ${artifact.description}`, artifact.sql].join('\n');
};
