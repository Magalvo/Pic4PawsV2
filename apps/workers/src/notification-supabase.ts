import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  ListNotificationsQuery,
  ListNotificationsResult,
  NotificationRecord,
  NotificationRepository,
  NotificationType,
} from './notification';
import type { NotificationPreferencesRepository } from './notification-preferences';

export class SupabaseNotificationRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseNotificationRepositoryError';
  }
}

export type CreateSupabaseNotificationRepositoriesInput = {
  client: SupabaseClientLike;
  notificationPreferencesRepository?: NotificationPreferencesRepository;
};

export type CreateSupabaseNotificationRepositoriesResult = {
  notificationRepository: NotificationRepository;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

type ShelterMembershipRow = {
  user_id: string;
};

type DonationTransactionRow = {
  user_id: string | null;
};

export const createSupabaseNotificationRepositories = ({
  client,
  notificationPreferencesRepository,
}: CreateSupabaseNotificationRepositoriesInput): CreateSupabaseNotificationRepositoriesResult => {
  const isOptedOut = async (userId: string, type: NotificationType): Promise<boolean> => {
    if (!notificationPreferencesRepository) return false;
    const result = await notificationPreferencesRepository.getPreferences(userId);
    if (!('preferences' in result)) return false;
    const pref = result.preferences.find((p) => p.type === type);
    return pref !== undefined && !pref.enabled;
  };

  const notificationRepository: NotificationRepository = {
    listNotifications: async (
      userId: string,
      { limit, offset }: ListNotificationsQuery,
    ): Promise<ListNotificationsResult> => {
      const result = (await client
        .from('notifications')
        .select('id,user_id,type,payload,read_at,created_at', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)) as SupabaseQueryResult<NotificationRow[]>;

      if (result.error) {
        throw new SupabaseNotificationRepositoryError(
          `Failed to list notifications: ${result.error.message ?? 'unknown error'}`,
        );
      }

      const rows = Array.isArray(result.data) ? result.data : [];
      const total = result.count ?? 0;

      const unreadResult = (await client
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .is('read_at', null)) as SupabaseQueryResult<{ id: string }[]>;

      if (unreadResult.error) {
        throw new SupabaseNotificationRepositoryError(
          `Failed to count unread notifications: ${unreadResult.error.message ?? 'unknown error'}`,
        );
      }

      const unreadCount = unreadResult.count ?? 0;

      return {
        notifications: rows.map(
          (row): NotificationRecord => ({
            notificationId: row.id,
            userId: row.user_id,
            type: row.type,
            payload: row.payload,
            readAt: row.read_at,
            createdAt: row.created_at,
          }),
        ),
        total,
        unreadCount,
      };
    },

    markNotificationRead: async (notificationId: string, userId: string): Promise<boolean> => {
      const result = (await client
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select('id')) as SupabaseQueryResult<{ id: string }[]>;

      if (result.error) {
        throw new SupabaseNotificationRepositoryError(
          `Failed to mark notification read: ${result.error.message ?? 'unknown error'}`,
        );
      }

      const updated = Array.isArray(result.data) ? result.data : [];

      return updated.length > 0;
    },

    notifyAdoptionStatusChanged: async ({
      applicantUserId,
      applicationId,
      newStatus,
    }: {
      applicantUserId: string;
      applicationId: string;
      newStatus: string;
    }): Promise<void> => {
      if (await isOptedOut(applicantUserId, 'adoption_status_changed')) return;

      const result = (await client.from('notifications').insert({
        user_id: applicantUserId,
        type: 'adoption_status_changed' as NotificationType,
        payload: { applicationId, newStatus },
      })) as SupabaseQueryResult<unknown>;

      if (result.error) {
        throw new SupabaseNotificationRepositoryError(
          `Failed to notify adoption status changed: ${result.error.message ?? 'unknown error'}`,
        );
      }
    },

    notifyNewAdoptionApplication: async ({
      shelterId,
      applicationId,
      petId,
      applicantName,
    }: {
      shelterId: string;
      applicationId: string;
      petId: string;
      applicantName: string;
    }): Promise<void> => {
      const membersResult = (await client
        .from('shelter_memberships')
        .select('user_id')
        .eq('shelter_id', shelterId)
        .is('deleted_at', null)) as SupabaseQueryResult<ShelterMembershipRow[]>;

      if (membersResult.error) {
        throw new SupabaseNotificationRepositoryError(
          `Failed to load shelter members: ${membersResult.error.message ?? 'unknown error'}`,
        );
      }

      const allMembers = Array.isArray(membersResult.data) ? membersResult.data : [];

      if (allMembers.length === 0) return;

      const optedOutFlags = await Promise.all(
        allMembers.map((m) => isOptedOut(m.user_id, 'new_adoption_application')),
      );
      const members = allMembers.filter((_, i) => !optedOutFlags[i]);

      if (members.length === 0) return;

      const insertResult = (await client.from('notifications').insert(
        members.map((m) => ({
          user_id: m.user_id,
          type: 'new_adoption_application' as NotificationType,
          payload: { shelterId, applicationId, petId, applicantName },
        })),
      )) as SupabaseQueryResult<unknown>;

      if (insertResult.error) {
        throw new SupabaseNotificationRepositoryError(
          `Failed to notify new adoption application: ${insertResult.error.message ?? 'unknown error'}`,
        );
      }
    },

    notifyDonationPaid: async ({
      providerPaymentId,
      provider,
    }: {
      providerPaymentId: string;
      provider: string;
    }): Promise<void> => {
      const donationResult = (await client
        .from('donation_transactions')
        .select('user_id')
        .eq('provider_payment_id', providerPaymentId)
        .eq('provider', provider)
        .single()) as SupabaseQueryResult<DonationTransactionRow>;

      if (donationResult.error || !donationResult.data?.user_id) return;

      if (await isOptedOut(donationResult.data.user_id, 'donation_paid')) return;

      const result = (await client.from('notifications').insert({
        user_id: donationResult.data.user_id,
        type: 'donation_paid' as NotificationType,
        payload: { providerPaymentId, provider },
      })) as SupabaseQueryResult<unknown>;

      if (result.error) {
        throw new SupabaseNotificationRepositoryError(
          `Failed to notify donation paid: ${result.error.message ?? 'unknown error'}`,
        );
      }
    },

    notifySponsorshipStatusChanged: async ({
      donorUserId,
      sponsorshipId,
      newStatus,
    }: {
      donorUserId: string;
      sponsorshipId: string;
      newStatus: string;
    }): Promise<void> => {
      if (await isOptedOut(donorUserId, 'sponsorship_status_changed')) return;

      const result = (await client.from('notifications').insert({
        user_id: donorUserId,
        type: 'sponsorship_status_changed' as NotificationType,
        payload: { sponsorshipId, newStatus },
      })) as SupabaseQueryResult<unknown>;

      if (result.error) {
        throw new SupabaseNotificationRepositoryError(
          `Failed to notify sponsorship status changed: ${result.error.message ?? 'unknown error'}`,
        );
      }
    },
  };

  return { notificationRepository };
};
