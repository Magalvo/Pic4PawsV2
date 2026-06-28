-- 0007_manual_donation_tier
-- Adds shelter_payment_tier enum, shelter_payment_configs table, and pending_receipt/pending_review/rejected donation statuses for the Phase 1 manual donation tier.
-- ALTER TYPE ... ADD VALUE cannot run inside an explicit transaction in PostgreSQL.
-- These three statements must remain unwrapped.
alter type public.donation_status add value 'pending_receipt' before 'pending_payment';
alter type public.donation_status add value 'pending_review' after 'pending_receipt';
alter type public.donation_status add value 'rejected' after 'pending_review';

create type public.shelter_payment_tier as enum ('manual', 'automated');

create table public.shelter_payment_configs (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters(id),
  tier public.shelter_payment_tier not null default 'manual',
  iban text,
  mb_way_phone text,
  provider public.payment_provider,
  api_key_encrypted text,
  webhook_secret_encrypted text,
  webhook_url_path text,
  status public.payment_account_status not null default 'not_configured',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint shelter_payment_configs_shelter_id_unique unique (shelter_id)
);

alter table public.donation_transactions add column receipt_media_id uuid references public.media_assets(id);
alter table public.donation_transactions add column reviewed_by_user_id uuid references public.users(id);
alter table public.donation_transactions add column reviewed_at timestamptz;
