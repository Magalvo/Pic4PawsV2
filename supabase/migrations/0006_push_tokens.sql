-- 0006_push_tokens
-- Adds push_tokens table for device push notification token registration (ios/android/expo). Unique constraint on (user_id, token). RLS enabled.
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'expo')),
  created_at timestamptz not null default now(),
  constraint push_tokens_user_token_unique unique (user_id, token)
);

create index push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "users_manage_own_push_tokens"
  on public.push_tokens
  for all
  using (
    exists (
      select 1 from public.users
      where public.users.id = push_tokens.user_id
        and public.users.auth_user_id = auth.uid()
        and public.users.status = 'active'
    )
  );
