-- 0001_initial_core_schema_and_rls
-- Initial approved Pic4Paws core schema and RLS policy SQL.
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
  latitude numeric(9, 6),
  longitude numeric(9, 6),
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

alter table public.pets enable row level security;

alter table public.adoption_applications enable row level security;

alter table public.donation_transactions enable row level security;

alter table public.shelters enable row level security;

alter table public.shelter_memberships enable row level security;

alter table public.media_assets enable row level security;

alter table public.users enable row level security;

drop policy if exists users_can_read_own_profile on public.users;
create policy users_can_read_own_profile
on public.users
for select
to authenticated
using (users.auth_user_id = auth.uid()
and users.status = 'active');

drop policy if exists users_adopters_can_update_own_profile on public.users;
create policy users_adopters_can_update_own_profile
on public.users
for update
to authenticated
using (users.auth_user_id = auth.uid()
and users.status = 'active')
with check (users.auth_user_id = auth.uid()
and users.status = 'active'
and users.role = 'adopter');

drop policy if exists shelters_public_can_read_verified on public.shelters;
create policy shelters_public_can_read_verified
on public.shelters
for select
to anon, authenticated
using (shelters.verification_status = 'verified'
and shelters.deleted_at is null);

drop policy if exists shelters_members_can_read_own on public.shelters;
create policy shelters_members_can_read_own
on public.shelters
for select
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = shelters.id
    and actor_memberships.deleted_at is null
));

drop policy if exists shelters_owners_can_update_own on public.shelters;
create policy shelters_owners_can_update_own
on public.shelters
for update
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.role = 'shelter_owner'
    and actor_memberships.shelter_id = shelters.id
    and actor_memberships.deleted_at is null
))
with check (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.role = 'shelter_owner'
    and actor_memberships.shelter_id = shelters.id
    and actor_memberships.deleted_at is null
));

drop policy if exists shelter_memberships_members_can_read_for_shelter on public.shelter_memberships;
create policy shelter_memberships_members_can_read_for_shelter
on public.shelter_memberships
for select
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = shelter_memberships.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists shelter_memberships_owners_can_insert_for_shelter on public.shelter_memberships;
create policy shelter_memberships_owners_can_insert_for_shelter
on public.shelter_memberships
for insert
to authenticated
with check (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.role = 'shelter_owner'
    and actor_memberships.shelter_id = shelter_memberships.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists shelter_memberships_owners_can_update_for_shelter on public.shelter_memberships;
create policy shelter_memberships_owners_can_update_for_shelter
on public.shelter_memberships
for update
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.role = 'shelter_owner'
    and actor_memberships.shelter_id = shelter_memberships.shelter_id
    and actor_memberships.deleted_at is null
))
with check (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.role = 'shelter_owner'
    and actor_memberships.shelter_id = shelter_memberships.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists shelter_memberships_owners_can_delete_for_shelter on public.shelter_memberships;
create policy shelter_memberships_owners_can_delete_for_shelter
on public.shelter_memberships
for delete
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.role = 'shelter_owner'
    and actor_memberships.shelter_id = shelter_memberships.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists pets_public_can_read_published_verified_shelter_pets on public.pets;
create policy pets_public_can_read_published_verified_shelter_pets
on public.pets
for select
to anon, authenticated
using (pets.status = 'published'
and exists (
  select 1 from shelters
  where shelters.id = pets.shelter_id
    and shelters.verification_status = 'verified'
    and shelters.deleted_at is null
    ));

drop policy if exists pets_shelter_members_can_read_for_shelter on public.pets;
create policy pets_shelter_members_can_read_for_shelter
on public.pets
for select
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = pets.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists pets_shelter_members_can_insert_for_shelter on public.pets;
create policy pets_shelter_members_can_insert_for_shelter
on public.pets
for insert
to authenticated
with check (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = pets.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists pets_shelter_members_can_update_for_shelter on public.pets;
create policy pets_shelter_members_can_update_for_shelter
on public.pets
for update
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = pets.shelter_id
    and actor_memberships.deleted_at is null
))
with check (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = pets.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists pets_shelter_members_can_delete_for_shelter on public.pets;
create policy pets_shelter_members_can_delete_for_shelter
on public.pets
for delete
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = pets.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists media_assets_public_can_read_public on public.media_assets;
create policy media_assets_public_can_read_public
on public.media_assets
for select
to anon, authenticated
using (media_assets.visibility = 'public'
and media_assets.deleted_at is null);

drop policy if exists media_assets_owner_can_read_own on public.media_assets;
create policy media_assets_owner_can_read_own
on public.media_assets
for select
to authenticated
using (exists (
  select 1 from users
  where users.id = media_assets.owner_user_id
    and users.auth_user_id = auth.uid()
    and users.status = 'active'
));

drop policy if exists media_assets_shelter_members_can_read_for_shelter on public.media_assets;
create policy media_assets_shelter_members_can_read_for_shelter
on public.media_assets
for select
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = media_assets.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists media_assets_owner_can_insert_own on public.media_assets;
create policy media_assets_owner_can_insert_own
on public.media_assets
for insert
to authenticated
with check (exists (
  select 1 from users
  where users.id = media_assets.owner_user_id
    and users.auth_user_id = auth.uid()
    and users.status = 'active'
));

drop policy if exists media_assets_shelter_members_can_insert_for_shelter on public.media_assets;
create policy media_assets_shelter_members_can_insert_for_shelter
on public.media_assets
for insert
to authenticated
with check (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = media_assets.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists media_assets_owner_can_update_own on public.media_assets;
create policy media_assets_owner_can_update_own
on public.media_assets
for update
to authenticated
using (exists (
  select 1 from users
  where users.id = media_assets.owner_user_id
    and users.auth_user_id = auth.uid()
    and users.status = 'active'
))
with check (exists (
  select 1 from users
  where users.id = media_assets.owner_user_id
    and users.auth_user_id = auth.uid()
    and users.status = 'active'
));

drop policy if exists media_assets_shelter_members_can_update_for_shelter on public.media_assets;
create policy media_assets_shelter_members_can_update_for_shelter
on public.media_assets
for update
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = media_assets.shelter_id
    and actor_memberships.deleted_at is null
))
with check (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = media_assets.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists media_assets_owner_can_delete_own on public.media_assets;
create policy media_assets_owner_can_delete_own
on public.media_assets
for delete
to authenticated
using (exists (
  select 1 from users
  where users.id = media_assets.owner_user_id
    and users.auth_user_id = auth.uid()
    and users.status = 'active'
));

drop policy if exists media_assets_shelter_members_can_delete_for_shelter on public.media_assets;
create policy media_assets_shelter_members_can_delete_for_shelter
on public.media_assets
for delete
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = media_assets.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists adoption_applications_applicant_can_read_own on public.adoption_applications;
create policy adoption_applications_applicant_can_read_own
on public.adoption_applications
for select
to authenticated
using (exists (
  select 1 from users
  where users.id = adoption_applications.applicant_user_id
    and users.auth_user_id = auth.uid()
    and users.status = 'active'
));

drop policy if exists adoption_applications_shelter_members_can_read_for_shelter on public.adoption_applications;
create policy adoption_applications_shelter_members_can_read_for_shelter
on public.adoption_applications
for select
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = adoption_applications.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists adoption_applications_applicant_can_insert_own on public.adoption_applications;
create policy adoption_applications_applicant_can_insert_own
on public.adoption_applications
for insert
to authenticated
with check (exists (
  select 1 from users
  where users.id = adoption_applications.applicant_user_id
    and users.auth_user_id = auth.uid()
    and users.status = 'active'
));

drop policy if exists adoption_applications_applicant_can_update_own_draft on public.adoption_applications;
create policy adoption_applications_applicant_can_update_own_draft
on public.adoption_applications
for update
to authenticated
using (exists (
  select 1 from users
  where users.id = adoption_applications.applicant_user_id
    and users.auth_user_id = auth.uid()
    and users.status = 'active'
)
and adoption_applications.status = 'draft')
with check (exists (
  select 1 from users
  where users.id = adoption_applications.applicant_user_id
    and users.auth_user_id = auth.uid()
    and users.status = 'active'
));

drop policy if exists adoption_applications_shelter_members_can_update_for_shelter on public.adoption_applications;
create policy adoption_applications_shelter_members_can_update_for_shelter
on public.adoption_applications
for update
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = adoption_applications.shelter_id
    and actor_memberships.deleted_at is null
))
with check (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = adoption_applications.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists donation_transactions_shelter_members_can_read_for_shelter on public.donation_transactions;
create policy donation_transactions_shelter_members_can_read_for_shelter
on public.donation_transactions
for select
to authenticated
using (exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = donation_transactions.shelter_id
    and actor_memberships.deleted_at is null
));

drop policy if exists donation_transactions_donor_can_read_own on public.donation_transactions;
create policy donation_transactions_donor_can_read_own
on public.donation_transactions
for select
to authenticated
using (exists (
  select 1 from users
  where users.id = donation_transactions.donor_user_id
    and users.auth_user_id = auth.uid()
    and users.status = 'active'
));

drop policy if exists admin_can_manage_all_core_tables_on_pets on public.pets;
create policy admin_can_manage_all_core_tables_on_pets
on public.pets
for all
to authenticated
using (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
))
with check (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
));

drop policy if exists admin_can_manage_all_core_tables_on_adoption_applications on public.adoption_applications;
create policy admin_can_manage_all_core_tables_on_adoption_applications
on public.adoption_applications
for all
to authenticated
using (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
))
with check (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
));

drop policy if exists admin_can_manage_all_core_tables_on_donation_transactions on public.donation_transactions;
create policy admin_can_manage_all_core_tables_on_donation_transactions
on public.donation_transactions
for all
to authenticated
using (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
))
with check (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
));

drop policy if exists admin_can_manage_all_core_tables_on_shelters on public.shelters;
create policy admin_can_manage_all_core_tables_on_shelters
on public.shelters
for all
to authenticated
using (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
))
with check (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
));

drop policy if exists admin_can_manage_all_core_tables_on_shelter_memberships on public.shelter_memberships;
create policy admin_can_manage_all_core_tables_on_shelter_memberships
on public.shelter_memberships
for all
to authenticated
using (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
))
with check (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
));

drop policy if exists admin_can_manage_all_core_tables_on_media_assets on public.media_assets;
create policy admin_can_manage_all_core_tables_on_media_assets
on public.media_assets
for all
to authenticated
using (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
))
with check (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
));

drop policy if exists admin_can_manage_all_core_tables_on_users on public.users;
create policy admin_can_manage_all_core_tables_on_users
on public.users
for all
to authenticated
using (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
))
with check (exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
));
