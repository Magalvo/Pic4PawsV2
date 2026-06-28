import { describe, expect, it } from 'vitest';
import {
  assertNonDestructiveMigration,
  eupagoProviderMigration,
  initialDatabaseMigration,
  manualDonationTierMigration,
  migrationArtifacts,
  notificationsMigration,
  paymentConfigRlsMigration,
  processPaymentWebhookEventMigration,
  pushTokensMigration,
  registerShelterMigration,
  registerUserMigration,
  renderMigrationArtifact,
} from '../../packages/database/src/index';

describe('database migration artifacts', () => {
  it('defines an ordered initial migration artifact', () => {
    expect(initialDatabaseMigration.id).toBe('0001_initial_core_schema_and_rls');
    expect(initialDatabaseMigration.filename).toBe('0001_initial_core_schema_and_rls.sql');
    expect(initialDatabaseMigration.destructive).toBe(false);
    expect(migrationArtifacts).toEqual([
      initialDatabaseMigration,
      notificationsMigration,
      registerShelterMigration,
      processPaymentWebhookEventMigration,
      registerUserMigration,
      pushTokensMigration,
      manualDonationTierMigration,
      eupagoProviderMigration,
      paymentConfigRlsMigration,
    ]);
  });

  it('includes the register_shelter RPC as migration 0003', () => {
    expect(registerShelterMigration.id).toBe('0003_register_shelter_rpc');
    expect(registerShelterMigration.filename).toBe('0003_register_shelter_rpc.sql');
    expect(registerShelterMigration.destructive).toBe(false);
  });

  it('includes the payment webhook transition RPC as migration 0004', () => {
    expect(processPaymentWebhookEventMigration.id).toBe(
      '0004_process_payment_webhook_event_rpc',
    );
    expect(processPaymentWebhookEventMigration.filename).toBe(
      '0004_process_payment_webhook_event_rpc.sql',
    );
    expect(processPaymentWebhookEventMigration.destructive).toBe(false);
    expect(renderMigrationArtifact(processPaymentWebhookEventMigration)).toContain(
      'public.process_payment_webhook_event',
    );
  });

  it('register_shelter RPC SQL is hardened: search_path, schema-qualified tables, REVOKE/GRANT, no unsafe params', () => {
    const sql = renderMigrationArtifact(registerShelterMigration);
    expect(sql).toContain('set search_path = public');
    expect(sql).toContain('public.shelters');
    expect(sql).toContain('public.shelter_memberships');
    expect(sql).toContain('revoke execute');
    expect(sql).toContain('grant execute');
    expect(sql).toContain('to service_role');
    expect(sql).not.toContain('p_verification_status');
    expect(sql).not.toContain('p_role');
    // p_kind must use the enum type, not text, so Postgres enforces valid values at call time
    expect(sql).toMatch(/p_kind\s+public\.shelter_kind/);
    // old 14-arg unsafe overload must be dropped in case it was ever manually deployed
    expect(sql).toContain('drop function if exists');
    // function name must be schema-qualified everywhere for explicit hardening
    expect(sql).toContain('create or replace function public.register_shelter(');
    expect(sql).toContain('revoke execute on function public.register_shelter(');
    expect(sql).toContain('grant execute on function public.register_shelter(');
  });

  it('includes the register_user RPC as migration 0005', () => {
    expect(registerUserMigration.id).toBe('0005_register_user_rpc');
    expect(registerUserMigration.filename).toBe('0005_register_user_rpc.sql');
    expect(registerUserMigration.destructive).toBe(false);
    const sql = renderMigrationArtifact(registerUserMigration);
    expect(sql).toContain('create or replace function public.register_user(');
    expect(sql).toContain('set search_path = public');
    expect(sql).toContain('security definer');
    expect(sql).toContain("'adopter'");
    expect(sql).toContain("'active'");
    expect(sql).toContain('revoke execute');
    expect(sql).toContain('to service_role');
    // password must NOT appear in the profile-only RPC
    expect(sql).not.toContain('p_password');
    expect(sql).not.toContain('encrypted_password');
    expect(sql).not.toContain('auth.users');
  });

  it('renders approved enum types and core tables', () => {
    const sql = renderMigrationArtifact(initialDatabaseMigration);

    expect(sql).toContain('create extension if not exists pgcrypto;');
    expect(sql).toContain('create type public.user_role as enum');
    expect(sql).toContain('create type public.pet_status as enum');
    expect(sql).toContain('create table public.users');
    expect(sql).toContain('create table public.shelters');
    expect(sql).toContain('create table public.shelter_memberships');
    expect(sql).toContain('create table public.media_assets');
    expect(sql).toContain('create table public.pets');
    expect(sql).toContain('create table public.adoption_applications');
    expect(sql).toContain('create table public.donation_transactions');
    expect(sql).toContain('create table public.sponsorships');
    expect(sql).toContain('create table public.payment_webhook_events');
    expect(sql).toContain('create table public.audit_events');
  });

  it('includes contract constraints and generated RLS SQL', () => {
    const sql = renderMigrationArtifact(initialDatabaseMigration);

    expect(sql).toContain('constraint users_auth_user_id_unique unique (auth_user_id)');
    expect(sql).toContain('constraint shelters_slug_unique unique (slug)');
    expect(sql).toContain('latitude numeric(9, 6)');
    expect(sql).toContain('longitude numeric(9, 6)');
    expect(sql).not.toContain('latitude text');
    expect(sql).not.toContain('longitude text');
    expect(sql).toContain('references public.shelters (id)');
    expect(sql).toContain('references public.users (id)');
    expect(sql).toContain('alter table public.pets enable row level security;');
    expect(sql).toContain('create policy pets_public_can_read_published_verified_shelter_pets');
    expect(sql).toContain('admin_can_manage_all_core_tables_on_users');
  });

  it('includes the manual donation tier schema as migration 0007', () => {
    expect(manualDonationTierMigration.id).toBe('0007_manual_donation_tier');
    expect(manualDonationTierMigration.filename).toBe('0007_manual_donation_tier.sql');
    expect(manualDonationTierMigration.destructive).toBe(false);

    const sql = renderMigrationArtifact(manualDonationTierMigration);

    // New donation_status values via ALTER TYPE (no transaction)
    expect(sql).toContain("alter type public.donation_status add value 'pending_receipt'");
    expect(sql).toContain("alter type public.donation_status add value 'pending_review'");
    expect(sql).toContain("alter type public.donation_status add value 'rejected'");
    // ALTER TYPE ... ADD VALUE cannot run inside an explicit transaction
    expect(sql).not.toMatch(/\bbegin\b/i);
    expect(sql).not.toMatch(/\bcommit\b/i);

    // New shelter_payment_tier enum and config table
    expect(sql).toContain("create type public.shelter_payment_tier as enum");
    expect(sql).toContain('create table public.shelter_payment_configs');
    expect(sql).toContain('shelter_id uuid not null references public.shelters(id)');
    expect(sql).toContain("constraint shelter_payment_configs_shelter_id_unique unique (shelter_id)");

    // New nullable columns on donation_transactions
    expect(sql).toContain(
      'alter table public.donation_transactions add column receipt_media_id uuid references public.media_assets(id)',
    );
    expect(sql).toContain(
      'alter table public.donation_transactions add column reviewed_by_user_id uuid references public.users(id)',
    );
    expect(sql).toContain(
      'alter table public.donation_transactions add column reviewed_at timestamptz',
    );

    expect(() => assertNonDestructiveMigration(manualDonationTierMigration)).not.toThrow();
  });

  it('protects payment configuration as a server-only table in migration 0009', () => {
    expect(paymentConfigRlsMigration.id).toBe('0009_payment_config_rls');
    expect(paymentConfigRlsMigration.filename).toBe('0009_payment_config_rls.sql');
    expect(paymentConfigRlsMigration.destructive).toBe(false);

    const sql = renderMigrationArtifact(paymentConfigRlsMigration);

    expect(sql).toContain(
      'alter table public.shelter_payment_configs enable row level security;',
    );
    expect(sql).toContain(
      'revoke all privileges on table public.shelter_payment_configs from anon, authenticated;',
    );
    expect(sql).toContain(
      'grant select, insert, update, delete on table public.shelter_payment_configs to service_role;',
    );
    expect(sql).not.toContain('create policy');
    expect(sql).not.toMatch(/grant .* to (anon|authenticated)/);
    expect(() => assertNonDestructiveMigration(paymentConfigRlsMigration)).not.toThrow();
  });

  it('guards migration artifacts against destructive SQL', () => {
    expect(() => assertNonDestructiveMigration(initialDatabaseMigration)).not.toThrow();
    expect(renderMigrationArtifact(initialDatabaseMigration)).not.toMatch(
      /\b(drop\s+table|drop\s+schema|truncate|delete\s+from|alter\s+table\s+\S+\s+drop\s+column)\b/i,
    );

    expect(() =>
      assertNonDestructiveMigration({
        ...initialDatabaseMigration,
        sql: 'drop table public.users;',
      }),
    ).toThrow('Destructive SQL is not allowed in migration artifacts');
  });
});
