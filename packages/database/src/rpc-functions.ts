export const registerShelterRpcSql = `
create or replace function register_shelter(
  p_shelter_id          uuid,
  p_name                text,
  p_slug                text,
  p_kind                text,
  p_verification_status text,
  p_city                text,
  p_district            text,
  p_country_code        text,
  p_public_email        text,
  p_public_phone        text,
  p_description         text,
  p_membership_id       uuid,
  p_user_id             uuid,
  p_role                text
) returns uuid
language plpgsql
security definer
as $$
begin
  insert into shelters (
    id, name, slug, kind, verification_status,
    city, district, country_code,
    public_email, public_phone, description
  ) values (
    p_shelter_id, p_name, p_slug, p_kind, p_verification_status,
    p_city, p_district, p_country_code,
    p_public_email, p_public_phone, p_description
  );

  insert into shelter_memberships (id, shelter_id, user_id, role)
  values (p_membership_id, p_shelter_id, p_user_id, p_role);

  return p_shelter_id;
end;
$$;
`;
