import { describe, expect, it, vi } from 'vitest';
import { createSupabaseNotificationRepositories } from '../../apps/workers/src/notification-supabase';
import type { NotificationPreferencesRepository } from '../../apps/workers/src/notification-preferences';
import type { SupabaseClientLike } from '../../apps/workers/src/index';

// ─── Minimal Supabase client mock ─────────────────────────────────────────────
// Tracks notification inserts; returns configurable data for other tables.

const makeFakeClient = (opts: {
  memberRows?: { user_id: string }[];
  donationRow?: { user_id: string } | null;
} = {}) => {
  const notificationInserts: unknown[] = [];

  const makeChain = (table: string) => {
    const chain: Record<string, unknown> = {};

    chain['select'] = () => makeChain(table);
    chain['insert'] = (payload: unknown) => {
      if (table === 'notifications') notificationInserts.push(payload);
      return makeChain(table);
    };
    chain['update'] = () => makeChain(table);
    chain['upsert'] = () => makeChain(table);
    chain['eq'] = () => makeChain(table);
    chain['neq'] = () => makeChain(table);
    chain['in'] = () => makeChain(table);
    chain['is'] = () => makeChain(table);
    chain['order'] = () => makeChain(table);
    chain['range'] = () => makeChain(table);

    chain['single'] = vi.fn().mockResolvedValue(
      table === 'donation_transactions'
        ? { data: opts.donationRow ?? null, error: null }
        : { data: null, error: null },
    );
    chain['maybeSingle'] = vi.fn().mockResolvedValue({ data: null, error: null });

    chain['then'] = (
      resolve: (v: unknown) => unknown,
      reject?: (e: unknown) => unknown,
    ) => {
      const result =
        table === 'shelter_memberships'
          ? { data: opts.memberRows ?? [], error: null, count: null }
          : { data: null, error: null, count: null };

      return Promise.resolve(result).then(resolve, reject);
    };

    return chain;
  };

  const client = { from: (table: string) => makeChain(table) } as unknown as SupabaseClientLike;

  return { client, notificationInserts };
};

// ─── Preference repository helpers ────────────────────────────────────────────

const makePrefsRepo = (
  overrides: Record<string, boolean> = {},
): NotificationPreferencesRepository => ({
  getPreferences: vi.fn().mockImplementation(async () => ({
    preferences: [
      { type: 'adoption_status_changed', enabled: overrides['adoption_status_changed'] ?? true },
      { type: 'new_adoption_application', enabled: overrides['new_adoption_application'] ?? true },
      { type: 'donation_paid', enabled: overrides['donation_paid'] ?? true },
      {
        type: 'sponsorship_status_changed',
        enabled: overrides['sponsorship_status_changed'] ?? true,
      },
    ],
  })),
  updatePreferences: vi.fn(),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('notifyAdoptionStatusChanged — dispatch gating', () => {
  it('inserts notification when adoption_status_changed is enabled', async () => {
    const { client, notificationInserts } = makeFakeClient();
    const prefsRepo = makePrefsRepo({ adoption_status_changed: true });
    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      notificationPreferencesRepository: prefsRepo,
    });

    await notificationRepository.notifyAdoptionStatusChanged({
      applicantUserId: 'user-a',
      applicationId: 'app-1',
      newStatus: 'approved',
    });

    expect(notificationInserts).toHaveLength(1);
  });

  it('skips insert when adoption_status_changed is disabled', async () => {
    const { client, notificationInserts } = makeFakeClient();
    const prefsRepo = makePrefsRepo({ adoption_status_changed: false });
    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      notificationPreferencesRepository: prefsRepo,
    });

    await notificationRepository.notifyAdoptionStatusChanged({
      applicantUserId: 'user-a',
      applicationId: 'app-1',
      newStatus: 'approved',
    });

    expect(notificationInserts).toHaveLength(0);
  });
});

describe('notifySponsorshipStatusChanged — dispatch gating', () => {
  it('skips insert when sponsorship_status_changed is disabled', async () => {
    const { client, notificationInserts } = makeFakeClient();
    const prefsRepo = makePrefsRepo({ sponsorship_status_changed: false });
    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      notificationPreferencesRepository: prefsRepo,
    });

    await notificationRepository.notifySponsorshipStatusChanged({
      donorUserId: 'user-donor',
      sponsorshipId: 'spon-1',
      newStatus: 'cancelled',
    });

    expect(notificationInserts).toHaveLength(0);
  });
});

describe('notifyDonationPaid — dispatch gating', () => {
  it('skips insert when donation_paid is disabled for the resolved donor', async () => {
    const { client, notificationInserts } = makeFakeClient({
      donationRow: { user_id: 'user-donor' },
    });
    const prefsRepo = makePrefsRepo({ donation_paid: false });
    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      notificationPreferencesRepository: prefsRepo,
    });

    await notificationRepository.notifyDonationPaid({
      providerPaymentId: 'pay-1',
      provider: 'eupago',
    });

    expect(notificationInserts).toHaveLength(0);
  });

  it('inserts when donation_paid is enabled for the resolved donor', async () => {
    const { client, notificationInserts } = makeFakeClient({
      donationRow: { user_id: 'user-donor' },
    });
    const prefsRepo = makePrefsRepo({ donation_paid: true });
    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      notificationPreferencesRepository: prefsRepo,
    });

    await notificationRepository.notifyDonationPaid({
      providerPaymentId: 'pay-1',
      provider: 'eupago',
    });

    expect(notificationInserts).toHaveLength(1);
  });
});

describe('notifyNewAdoptionApplication — dispatch gating (fan-out)', () => {
  it('sends to all members when none have opted out', async () => {
    const { client, notificationInserts } = makeFakeClient({
      memberRows: [{ user_id: 'member-1' }, { user_id: 'member-2' }],
    });
    const prefsRepo = makePrefsRepo({ new_adoption_application: true });
    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      notificationPreferencesRepository: prefsRepo,
    });

    await notificationRepository.notifyNewAdoptionApplication({
      shelterId: 'shelter-1',
      applicationId: 'app-1',
      petId: 'pet-1',
      applicantName: 'João Silva',
    });

    expect(notificationInserts).toHaveLength(1);
    const inserted = notificationInserts[0] as { user_id: string }[];
    expect(inserted).toHaveLength(2);
  });

  it('excludes members who opted out of new_adoption_application', async () => {
    const { client, notificationInserts } = makeFakeClient({
      memberRows: [{ user_id: 'member-opted-out' }, { user_id: 'member-opted-in' }],
    });

    const prefsRepo: NotificationPreferencesRepository = {
      getPreferences: vi.fn().mockImplementation(async (userId: string) => ({
        preferences: [
          {
            type: 'new_adoption_application',
            enabled: userId !== 'member-opted-out',
          },
          { type: 'adoption_status_changed', enabled: true },
          { type: 'donation_paid', enabled: true },
          { type: 'sponsorship_status_changed', enabled: true },
        ],
      })),
      updatePreferences: vi.fn(),
    };

    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      notificationPreferencesRepository: prefsRepo,
    });

    await notificationRepository.notifyNewAdoptionApplication({
      shelterId: 'shelter-1',
      applicationId: 'app-1',
      petId: 'pet-1',
      applicantName: 'João Silva',
    });

    expect(notificationInserts).toHaveLength(1);
    const inserted = notificationInserts[0] as { user_id: string }[];
    expect(inserted).toHaveLength(1);
    expect(inserted[0].user_id).toBe('member-opted-in');
  });
});

describe('dispatch without preferences repository', () => {
  it('inserts notifications normally when notificationPreferencesRepository is not provided', async () => {
    const { client, notificationInserts } = makeFakeClient();
    const { notificationRepository } = createSupabaseNotificationRepositories({ client });

    await notificationRepository.notifyAdoptionStatusChanged({
      applicantUserId: 'user-a',
      applicationId: 'app-1',
      newStatus: 'approved',
    });

    expect(notificationInserts).toHaveLength(1);
  });
});
