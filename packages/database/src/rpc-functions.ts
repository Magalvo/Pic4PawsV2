// Drop the old 14-arg unsafe overload in case it was manually deployed before the hardened version.
// The old signature accepted p_verification_status and p_role from callers, which could be exploited
// via direct PostgREST access to bypass the Worker contract.
export const registerShelterRpcSql = `
drop function if exists public.register_shelter(uuid, text, text, text, text, text, text, text, text, text, text, uuid, uuid, text);

create or replace function public.register_shelter(
  p_shelter_id          uuid,
  p_name                text,
  p_slug                text,
  p_kind                public.shelter_kind,
  p_city                text,
  p_district            text,
  p_country_code        text,
  p_public_email        text,
  p_public_phone        text,
  p_description         text,
  p_membership_id       uuid,
  p_user_id             uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.shelters (
    id, name, slug, kind, verification_status,
    city, district, country_code,
    public_email, public_phone, description
  ) values (
    p_shelter_id, p_name, p_slug, p_kind, 'draft',
    p_city, p_district, p_country_code,
    p_public_email, p_public_phone, p_description
  );

  insert into public.shelter_memberships (id, shelter_id, user_id, role)
  values (p_membership_id, p_shelter_id, p_user_id, 'shelter_owner');

  return p_shelter_id;
end;
$$;

revoke execute on function public.register_shelter(uuid, text, text, public.shelter_kind, text, text, text, text, text, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.register_shelter(uuid, text, text, public.shelter_kind, text, text, text, text, text, text, uuid, uuid) to service_role;
`;

export const processPaymentWebhookEventRpcSql = `
create or replace function public.process_payment_webhook_event(
  p_provider_event_id   text,
  p_provider            public.payment_provider,
  p_provider_payment_id text,
  p_new_status          public.donation_status,
  p_payload             jsonb,
  p_received_at         timestamptz
) returns table (
  already_processed      boolean,
  donation_found         boolean,
  previous_status        public.donation_status,
  new_status             public.donation_status,
  processed_at           timestamptz,
  financial_timestamp    timestamptz,
  raw_provider_event_ids text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_existing_processed_at timestamptz;
  v_donation_id uuid;
  v_previous_status public.donation_status;
  v_raw_event_ids jsonb;
  v_updated_event_ids jsonb;
  v_financial_timestamp timestamptz;
begin
  select id, payment_webhook_events.processed_at
    into v_event_id, v_existing_processed_at
  from public.payment_webhook_events
  where provider = p_provider
    and provider_event_id = p_provider_event_id
  for update;

  if v_event_id is not null and v_existing_processed_at is not null then
    return query select
      true,
      false,
      null::public.donation_status,
      p_new_status,
      v_existing_processed_at,
      null::timestamptz,
      array[]::text[];
    return;
  end if;

  if v_event_id is null then
    insert into public.payment_webhook_events (
      provider,
      provider_event_id,
      payload,
      received_at
    ) values (
      p_provider,
      p_provider_event_id,
      p_payload,
      p_received_at
    )
    returning id into v_event_id;
  end if;

  select id, status, raw_provider_event_ids
    into v_donation_id, v_previous_status, v_raw_event_ids
  from public.donation_transactions
  where provider = p_provider
    and provider_payment_id = p_provider_payment_id
  for update;

  if v_donation_id is null then
    update public.payment_webhook_events
      set processed_at = p_received_at,
          updated_at = p_received_at
      where id = v_event_id;

    return query select
      false,
      false,
      null::public.donation_status,
      p_new_status,
      p_received_at,
      null::timestamptz,
      array[]::text[];
    return;
  end if;

  v_updated_event_ids := coalesce(v_raw_event_ids, '[]'::jsonb);
  if not v_updated_event_ids ? p_provider_event_id then
    v_updated_event_ids := v_updated_event_ids || to_jsonb(p_provider_event_id);
  end if;

  v_financial_timestamp := case
    when p_new_status in ('paid', 'refunded') then p_received_at
    else null
  end;

  update public.donation_transactions
    set status = p_new_status,
        raw_provider_event_ids = v_updated_event_ids,
        paid_at = case when p_new_status = 'paid' then p_received_at else paid_at end,
        refunded_at = case when p_new_status = 'refunded' then p_received_at else refunded_at end,
        updated_at = p_received_at
    where id = v_donation_id;

  update public.payment_webhook_events
    set processed_at = p_received_at,
        updated_at = p_received_at
    where id = v_event_id;

  return query select
    false,
    true,
    v_previous_status,
    p_new_status,
    p_received_at,
    v_financial_timestamp,
    array(select jsonb_array_elements_text(v_updated_event_ids));
end;
$$;

revoke execute on function public.process_payment_webhook_event(text, public.payment_provider, text, public.donation_status, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.process_payment_webhook_event(text, public.payment_provider, text, public.donation_status, jsonb, timestamptz) to service_role;
`;

export const registerUserRpcSql = `
create or replace function public.register_user(
  p_auth_user_id             uuid,
  p_email                    text,
  p_display_name             text,
  p_gdpr_consent_version     text,
  p_gdpr_consent_accepted_at timestamptz
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    auth_user_id,
    role,
    status,
    email,
    display_name,
    gdpr_consent_version,
    gdpr_consent_accepted_at
  ) values (
    p_auth_user_id,
    'adopter',
    'active',
    p_email,
    p_display_name,
    p_gdpr_consent_version,
    p_gdpr_consent_accepted_at
  );
end;
$$;

revoke execute on function public.register_user(uuid, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.register_user(uuid, text, text, text, timestamptz) to service_role;
`;
