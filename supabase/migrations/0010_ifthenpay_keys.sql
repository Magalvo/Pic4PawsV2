-- 0010_ifthenpay_keys
-- Adds separate encrypted credential columns for Ifthenpay's two distinct API keys:
-- MB KEY (Multibanco) and MBWAY KEY (MB Way). The prior single api_key_encrypted
-- column was referenced in code but never added to the schema; these replace it.
alter table public.shelter_payment_configs
  add column ifthenpay_mb_key_encrypted text;

alter table public.shelter_payment_configs
  add column ifthenpay_mbway_key_encrypted text;
