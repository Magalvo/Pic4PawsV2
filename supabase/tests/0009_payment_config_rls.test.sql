begin;

select plan(14);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.shelter_payment_configs'::regclass
  ),
  'shelter_payment_configs has RLS enabled'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shelter_payment_configs'
  ),
  0,
  'server-only payment configuration has no client policies'
);

select ok(
  not has_table_privilege('anon', 'public.shelter_payment_configs', 'select'),
  'anon cannot select payment configuration'
);
select ok(
  not has_table_privilege('anon', 'public.shelter_payment_configs', 'insert'),
  'anon cannot insert payment configuration'
);
select ok(
  not has_table_privilege('anon', 'public.shelter_payment_configs', 'update'),
  'anon cannot update payment configuration'
);
select ok(
  not has_table_privilege('anon', 'public.shelter_payment_configs', 'delete'),
  'anon cannot delete payment configuration'
);

select ok(
  not has_table_privilege('authenticated', 'public.shelter_payment_configs', 'select'),
  'authenticated users cannot select payment configuration'
);
select ok(
  not has_table_privilege('authenticated', 'public.shelter_payment_configs', 'insert'),
  'authenticated users cannot insert payment configuration'
);
select ok(
  not has_table_privilege('authenticated', 'public.shelter_payment_configs', 'update'),
  'authenticated users cannot update payment configuration'
);
select ok(
  not has_table_privilege('authenticated', 'public.shelter_payment_configs', 'delete'),
  'authenticated users cannot delete payment configuration'
);

select ok(
  has_table_privilege('service_role', 'public.shelter_payment_configs', 'select'),
  'service_role can select payment configuration'
);
select ok(
  has_table_privilege('service_role', 'public.shelter_payment_configs', 'insert'),
  'service_role can insert payment configuration'
);
select ok(
  has_table_privilege('service_role', 'public.shelter_payment_configs', 'update'),
  'service_role can update payment configuration'
);
select ok(
  has_table_privilege('service_role', 'public.shelter_payment_configs', 'delete'),
  'service_role can delete payment configuration'
);

select * from finish();

rollback;
