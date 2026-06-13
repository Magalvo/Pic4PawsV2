// Drop the old 14-arg unsafe overload in case it was manually deployed before the hardened version.
// The old signature accepted p_verification_status and p_role from callers, which could be exploited
// via direct PostgREST access to bypass the Worker contract.
export const registerShelterRpcSql = `
drop function if exists public.register_shelter(uuid, text, text, text, text, text, text, text, text, text, text, uuid, uuid, text);

create or replace function register_shelter(
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

revoke execute on function register_shelter(uuid, text, text, public.shelter_kind, text, text, text, text, text, text, uuid, uuid) from public, anon, authenticated;
grant execute on function register_shelter(uuid, text, text, public.shelter_kind, text, text, text, text, text, text, uuid, uuid) to service_role;
`;
