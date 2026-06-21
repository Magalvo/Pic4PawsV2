-- 0005_register_user_rpc
-- Adds service-role-only register_user RPC: inserts public.users profile row after the Supabase auth user is created by the Worker via auth.admin.createUser(). Security definer, hardcoded role=adopter and status=active, REVOKE/GRANT execute.
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
