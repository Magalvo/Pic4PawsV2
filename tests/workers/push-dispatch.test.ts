import { describe, expect, it, vi } from 'vitest';
import { createSupabaseNotificationRepositories } from '../../apps/workers/src/notification-supabase';
import type { PushNotificationProvider } from '../../apps/workers/src/push-token';
import type { SupabaseClientLike } from '../../apps/workers/src/index';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    chain['delete'] = () => makeChain(table);
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

const makePushProvider = (): PushNotificationProvider & { calls: unknown[] } => {
  const calls: unknown[] = [];
  return {
    calls,
    sendPushNotification: vi.fn().mockImplementation(async (params) => {
      calls.push(params);
    }),
  };
};

// ─── notifyAdoptionStatusChanged ─────────────────────────────────────────────

describe('push dispatch — notifyAdoptionStatusChanged', () => {
  it('calls sendPushNotification with correct args after DB insert', async () => {
    const { client } = makeFakeClient();
    const push = makePushProvider();
    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      pushNotificationProvider: push,
    });

    await notificationRepository.notifyAdoptionStatusChanged({
      applicantUserId: 'user-a',
      applicationId: 'app-1',
      newStatus: 'approved',
    });

    // Allow microtask queue to flush the fire-and-forget
    await Promise.resolve();

    expect(push.sendPushNotification).toHaveBeenCalledWith({
      userId: 'user-a',
      type: 'adoption_status_changed',
      payload: { applicationId: 'app-1', newStatus: 'approved' },
    });
  });

  it('does not call sendPushNotification when provider is not set', async () => {
    const { client } = makeFakeClient();
    const push = makePushProvider();
    const { notificationRepository } = createSupabaseNotificationRepositories({ client });

    await notificationRepository.notifyAdoptionStatusChanged({
      applicantUserId: 'user-a',
      applicationId: 'app-1',
      newStatus: 'approved',
    });

    await Promise.resolve();
    expect(push.sendPushNotification).not.toHaveBeenCalled();
  });

  it('silently catches push errors — does not throw', async () => {
    const { client } = makeFakeClient();
    const push: PushNotificationProvider = {
      sendPushNotification: vi.fn().mockRejectedValue(new Error('push failed')),
    };
    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      pushNotificationProvider: push,
    });

    await expect(
      notificationRepository.notifyAdoptionStatusChanged({
        applicantUserId: 'user-a',
        applicationId: 'app-1',
        newStatus: 'approved',
      }),
    ).resolves.not.toThrow();
  });
});

// ─── notifySponsorshipStatusChanged ──────────────────────────────────────────

describe('push dispatch — notifySponsorshipStatusChanged', () => {
  it('calls sendPushNotification with correct args', async () => {
    const { client } = makeFakeClient();
    const push = makePushProvider();
    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      pushNotificationProvider: push,
    });

    await notificationRepository.notifySponsorshipStatusChanged({
      donorUserId: 'user-donor',
      sponsorshipId: 'spon-1',
      newStatus: 'cancelled',
    });

    await Promise.resolve();

    expect(push.sendPushNotification).toHaveBeenCalledWith({
      userId: 'user-donor',
      type: 'sponsorship_status_changed',
      payload: { sponsorshipId: 'spon-1', newStatus: 'cancelled' },
    });
  });
});

// ─── notifyDonationPaid ───────────────────────────────────────────────────────

describe('push dispatch — notifyDonationPaid', () => {
  it('calls sendPushNotification with resolved donorUserId', async () => {
    const { client } = makeFakeClient({ donationRow: { user_id: 'user-donor' } });
    const push = makePushProvider();
    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      pushNotificationProvider: push,
    });

    await notificationRepository.notifyDonationPaid({
      providerPaymentId: 'pay-1',
      provider: 'eupago',
    });

    await Promise.resolve();

    expect(push.sendPushNotification).toHaveBeenCalledWith({
      userId: 'user-donor',
      type: 'donation_paid',
      payload: { providerPaymentId: 'pay-1', provider: 'eupago' },
    });
  });

  it('does not call sendPushNotification when donation row not found', async () => {
    const { client } = makeFakeClient({ donationRow: null });
    const push = makePushProvider();
    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      pushNotificationProvider: push,
    });

    await notificationRepository.notifyDonationPaid({
      providerPaymentId: 'pay-x',
      provider: 'eupago',
    });

    await Promise.resolve();
    expect(push.sendPushNotification).not.toHaveBeenCalled();
  });
});

// ─── notifyNewAdoptionApplication (fan-out) ───────────────────────────────────

describe('push dispatch — notifyNewAdoptionApplication fan-out', () => {
  it('calls sendPushNotification once per opted-in member', async () => {
    const { client } = makeFakeClient({
      memberRows: [{ user_id: 'member-1' }, { user_id: 'member-2' }],
    });
    const push = makePushProvider();
    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      pushNotificationProvider: push,
    });

    await notificationRepository.notifyNewAdoptionApplication({
      shelterId: 'shelter-1',
      applicationId: 'app-1',
      petId: 'pet-1',
      applicantName: 'João Silva',
    });

    await Promise.resolve();

    expect(push.sendPushNotification).toHaveBeenCalledTimes(2);
    expect(push.sendPushNotification).toHaveBeenCalledWith({
      userId: 'member-1',
      type: 'new_adoption_application',
      payload: { shelterId: 'shelter-1', applicationId: 'app-1', petId: 'pet-1', applicantName: 'João Silva' },
    });
    expect(push.sendPushNotification).toHaveBeenCalledWith({
      userId: 'member-2',
      type: 'new_adoption_application',
      payload: { shelterId: 'shelter-1', applicationId: 'app-1', petId: 'pet-1', applicantName: 'João Silva' },
    });
  });

  it('does not call sendPushNotification when no members', async () => {
    const { client } = makeFakeClient({ memberRows: [] });
    const push = makePushProvider();
    const { notificationRepository } = createSupabaseNotificationRepositories({
      client,
      pushNotificationProvider: push,
    });

    await notificationRepository.notifyNewAdoptionApplication({
      shelterId: 'shelter-1',
      applicationId: 'app-1',
      petId: 'pet-1',
      applicantName: 'João Silva',
    });

    await Promise.resolve();
    expect(push.sendPushNotification).not.toHaveBeenCalled();
  });
});
