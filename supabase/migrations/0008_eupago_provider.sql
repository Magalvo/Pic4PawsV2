-- 0008_eupago_provider
-- Adds shelter_active_provider enum and eupago/ifthenpay credential columns to shelter_payment_configs for multi-provider support.
-- New enum for per-shelter provider selection (subset of payment_provider).
-- ALTER TYPE ... ADD VALUE cannot run inside an explicit transaction in PostgreSQL.
create type public.shelter_active_provider as enum ('ifthenpay', 'eupago');

-- active_provider: which PSP the shelter has activated for automated payments.
-- NULL = no automated provider configured (manual tier only).
alter table public.shelter_payment_configs
  add column active_provider public.shelter_active_provider;

-- Eupago credentials (encrypted at rest via application-layer AES-256-GCM).
alter table public.shelter_payment_configs
  add column eupago_api_key_encrypted text;

alter table public.shelter_payment_configs
  add column eupago_webhook_secret_encrypted text;

-- Ifthenpay per-shelter anti-phishing key (replaces global IFTHENPAY_WEBHOOK_SECRET
-- once all shelters are migrated; nullable for backwards compatibility).
alter table public.shelter_payment_configs
  add column ifthenpay_anti_phishing_key text;
