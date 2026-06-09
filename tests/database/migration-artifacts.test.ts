import { describe, expect, it } from 'vitest';
import {
  assertNonDestructiveMigration,
  initialDatabaseMigration,
  migrationArtifacts,
  notificationsMigration,
  renderMigrationArtifact,
} from '../../packages/database/src/index';

describe('database migration artifacts', () => {
  it('defines an ordered initial migration artifact', () => {
    expect(initialDatabaseMigration.id).toBe('0001_initial_core_schema_and_rls');
    expect(initialDatabaseMigration.filename).toBe('0001_initial_core_schema_and_rls.sql');
    expect(initialDatabaseMigration.destructive).toBe(false);
    expect(migrationArtifacts).toEqual([initialDatabaseMigration, notificationsMigration]);
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
    expect(sql).toContain('references public.shelters (id)');
    expect(sql).toContain('references public.users (id)');
    expect(sql).toContain('alter table public.pets enable row level security;');
    expect(sql).toContain('create policy pets_public_can_read_published_verified_shelter_pets');
    expect(sql).toContain('admin_can_manage_all_core_tables_on_users');
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
