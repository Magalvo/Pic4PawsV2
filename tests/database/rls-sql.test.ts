import { describe, expect, it } from 'vitest';
import {
  coreRlsTableNames,
  renderCreatePolicySql,
  renderEnableRowLevelSecuritySql,
  renderRlsMigrationSql,
  rlsPolicyMatrix,
  rlsPolicies,
} from '../../packages/database/src/index';

describe('RLS SQL rendering', () => {
  it('emits enable row level security statements for core protected tables', () => {
    expect(coreRlsTableNames).toEqual([
      'pets',
      'adoption_applications',
      'donation_transactions',
      'shelters',
      'shelter_memberships',
      'media_assets',
      'users',
    ]);

    expect(renderEnableRowLevelSecuritySql('pets')).toBe(
      'alter table public.pets enable row level security;',
    );
  });

  it('renders deterministic drop and create policy SQL', () => {
    const publicPetsPolicy = rlsPolicies.find(
      (policy) => policy.name === 'pets_public_can_read_published_verified_shelter_pets',
    );

    expect(publicPetsPolicy).toBeDefined();
    expect(renderCreatePolicySql(publicPetsPolicy!)).toContain(
      'drop policy if exists pets_public_can_read_published_verified_shelter_pets on public.pets;',
    );
    expect(renderCreatePolicySql(publicPetsPolicy!)).toContain(
      'create policy pets_public_can_read_published_verified_shelter_pets',
    );
    expect(renderCreatePolicySql(publicPetsPolicy!)).toContain('for select');
    expect(renderCreatePolicySql(publicPetsPolicy!)).toContain('to anon, authenticated');
    expect(renderCreatePolicySql(publicPetsPolicy!)).toContain("pets.status = 'published'");
    expect(renderCreatePolicySql(publicPetsPolicy!)).toContain(
      "shelters.verification_status = 'verified'",
    );
  });

  it('renders with check clauses when policy metadata provides them', () => {
    const migrationSql = renderRlsMigrationSql(rlsPolicies);

    expect(migrationSql).toContain('with check (exists (');
    expect(migrationSql).toContain("users.role = 'admin'");
  });

  it('expands wildcard admin policy across protected tables', () => {
    const migrationSql = renderRlsMigrationSql(rlsPolicies);

    expect(migrationSql).not.toContain('on public.*');
    expect(migrationSql).toContain('admin_can_manage_all_core_tables_on_pets');
    expect(migrationSql).toContain('admin_can_manage_all_core_tables_on_adoption_applications');
    expect(migrationSql).toContain('admin_can_manage_all_core_tables_on_donation_transactions');
  });

  it('includes the current access-boundary policies in one migration script', () => {
    const migrationSql = renderRlsMigrationSql(rlsPolicies);

    expect(migrationSql).toContain('alter table public.pets enable row level security;');
    expect(migrationSql).toContain(
      'adoption_applications_applicant_can_read_own',
    );
    expect(migrationSql).toContain(
      'adoption_applications_shelter_members_can_read_for_shelter',
    );
    expect(migrationSql).toContain(
      'donation_transactions_shelter_members_can_read_for_shelter',
    );
  });

  it('declares the complete core RLS policy matrix by table and operation', () => {
    expect(rlsPolicyMatrix).toEqual({
      users: ['select', 'update', 'all'],
      shelters: ['select', 'update', 'all'],
      shelter_memberships: ['select', 'insert', 'update', 'delete', 'all'],
      pets: ['select', 'insert', 'update', 'delete', 'all'],
      media_assets: ['select', 'insert', 'update', 'delete', 'all'],
      adoption_applications: ['select', 'insert', 'update', 'all'],
      donation_transactions: ['select', 'all'],
    });
  });

  it('renders insert policies with with-check clauses and without invalid using clauses', () => {
    const petInsertPolicy = rlsPolicies.find(
      (policy) => policy.name === 'pets_shelter_members_can_insert_for_shelter',
    );

    expect(petInsertPolicy).toBeDefined();
    const sql = renderCreatePolicySql(petInsertPolicy!);

    expect(sql).toContain('for insert');
    expect(sql).toContain('with check (exists (');
    expect(sql).not.toContain('using (');
  });

  it('keeps private records behind actor-owned or shelter-member RLS policies', () => {
    const migrationSql = renderRlsMigrationSql(rlsPolicies);

    expect(migrationSql).toContain('users_can_read_own_profile');
    expect(migrationSql).toContain('media_assets_owner_can_read_own');
    expect(migrationSql).toContain('media_assets_shelter_members_can_read_for_shelter');
    expect(migrationSql).toContain('donation_transactions_donor_can_read_own');
    expect(migrationSql).toContain('adoption_applications_applicant_can_insert_own');
    expect(migrationSql).not.toContain('donation_transactions_authenticated_can_insert');
  });
});
