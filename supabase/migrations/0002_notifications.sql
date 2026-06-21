-- 0002_notifications
-- Adds notification_type enum and notifications table for in-app alerts.
create type public.notification_type as enum (
  'adoption_status_changed',
  'new_adoption_application',
  'donation_paid',
  'sponsorship_status_changed'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  type public.notification_type not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "users_read_own_notifications"
  on public.notifications for select
  using (user_id = auth.uid());
