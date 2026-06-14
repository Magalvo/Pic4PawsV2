import { describe, expect, it } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import {
  adoptionApplications,
  auditEvents,
  donationTransactions,
  getSchemaColumnNames,
  mediaAssets,
  paymentWebhookEvents,
  pets,
  rlsPolicies,
  shelterMemberships,
  shelters,
  sponsorships,
  users,
} from '../../packages/database/src/index';

describe('core database schema', () => {
  it('defines the approved core tables', () => {
    expect(users).toBeDefined();
    expect(shelters).toBeDefined();
    expect(shelterMemberships).toBeDefined();
    expect(mediaAssets).toBeDefined();
    expect(pets).toBeDefined();
    expect(adoptionApplications).toBeDefined();
    expect(donationTransactions).toBeDefined();
    expect(sponsorships).toBeDefined();
    expect(paymentWebhookEvents).toBeDefined();
    expect(auditEvents).toBeDefined();
  });

  it('keeps adoption personal data off public pet records', () => {
    expect(getSchemaColumnNames(pets)).toEqual(
      expect.arrayContaining(['id', 'shelterId', 'status', 'name', 'species', 'mediaIds']),
    );
    expect(getSchemaColumnNames(pets)).not.toEqual(
      expect.arrayContaining(['applicantFullName', 'applicantEmail', 'applicantPhoneNumber']),
    );

    expect(getSchemaColumnNames(adoptionApplications)).toEqual(
      expect.arrayContaining([
        'applicantFullName',
        'applicantEmail',
        'applicantPhoneNumber',
        'dataProcessingAccepted',
        'shelterContactAccepted',
      ]),
    );
  });

  it('models financial and webhook idempotency fields', () => {
    expect(getSchemaColumnNames(donationTransactions)).toEqual(
      expect.arrayContaining([
        'amountCents',
        'feeCents',
        'netAmountCents',
        'providerPaymentId',
        'idempotencyKey',
        'rawProviderEventIds',
      ]),
    );
    expect(getSchemaColumnNames(paymentWebhookEvents)).toEqual(
      expect.arrayContaining(['provider', 'providerEventId', 'processedAt', 'payload']),
    );
  });

  it('uses numeric number-mode coordinates for shelter latitude and longitude', () => {
    const columns = getTableColumns(shelters);

    expect(columns.latitude.getSQLType()).toBe('numeric(9, 6)');
    expect(columns.longitude.getSQLType()).toBe('numeric(9, 6)');
    expect(columns.latitude.mapFromDriverValue('38.722300')).toBe(38.7223);
    expect(columns.longitude.mapFromDriverValue('-9.139300')).toBe(-9.1393);
  });
});

describe('supabase rls policy contract', () => {
  it('covers public, adopter, shelter and admin access boundaries', () => {
    expect(rlsPolicies.map((policy) => policy.name)).toEqual(
      expect.arrayContaining([
        'pets_public_can_read_published_verified_shelter_pets',
        'adoption_applications_applicant_can_read_own',
        'adoption_applications_shelter_members_can_read_for_shelter',
        'donation_transactions_shelter_members_can_read_for_shelter',
        'admin_can_manage_all_core_tables',
      ]),
    );
  });

  it('keeps public policies limited to publishable records', () => {
    const publicPetsPolicy = rlsPolicies.find(
      (policy) => policy.name === 'pets_public_can_read_published_verified_shelter_pets',
    );

    expect(publicPetsPolicy?.command).toBe('select');
    expect(publicPetsPolicy?.usingSql).toContain("pets.status = 'published'");
    expect(publicPetsPolicy?.usingSql).toContain("shelters.verification_status = 'verified'");
  });
});
