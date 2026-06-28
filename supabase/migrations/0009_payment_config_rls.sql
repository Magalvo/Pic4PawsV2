-- 0009_payment_config_rls
-- Protects shelter_payment_configs as a server-only table with RLS and explicit role privileges.
alter table public.shelter_payment_configs enable row level security;

revoke all privileges on table public.shelter_payment_configs from anon, authenticated;

grant select, insert, update, delete on table public.shelter_payment_configs to service_role;
