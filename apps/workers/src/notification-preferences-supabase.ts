import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type { NotificationType } from './notification';
import type {
  NotificationPreference,
  NotificationPreferencesRepository,
  GetNotificationPreferencesResult,
} from './notification-preferences';

const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  'adoption_status_changed',
  'new_adoption_application',
  'donation_paid',
  'sponsorship_status_changed',
];

type NotificationPreferenceRow = {
  type: NotificationType;
  enabled: boolean;
};

export const createSupabaseNotificationPreferencesRepositories = ({
  client,
}: {
  client: SupabaseClientLike;
}): { notificationPreferencesRepository: NotificationPreferencesRepository } => {
  const notificationPreferencesRepository: NotificationPreferencesRepository = {
    getPreferences: async (userId: string): Promise<GetNotificationPreferencesResult> => {
      const result = (await client
        .from('notification_preferences')
        .select('type,enabled')
        .eq('user_id', userId)) as SupabaseQueryResult<NotificationPreferenceRow[]>;

      if (result.error) {
        throw new Error(
          `Failed to load notification preferences: ${result.error.message ?? 'unknown error'}`,
        );
      }

      const stored = Array.isArray(result.data) ? result.data : [];
      const storedMap = new Map(stored.map((r) => [r.type, r.enabled]));

      const preferences: NotificationPreference[] = ALL_NOTIFICATION_TYPES.map((type) => ({
        type,
        enabled: storedMap.has(type) ? (storedMap.get(type) as boolean) : true,
      }));

      return { preferences };
    },

    updatePreferences: async (
      userId: string,
      preferences: NotificationPreference[],
    ): Promise<GetNotificationPreferencesResult> => {
      const rows = preferences.map((p) => ({
        user_id: userId,
        type: p.type,
        enabled: p.enabled,
        updated_at: new Date().toISOString(),
      }));

      const result = (await client
        .from('notification_preferences')
        .upsert(rows, { onConflict: 'user_id,type' })) as SupabaseQueryResult<unknown>;

      if (result.error) {
        throw new Error(
          `Failed to update notification preferences: ${result.error.message ?? 'unknown error'}`,
        );
      }

      const storedMap = new Map(preferences.map((p) => [p.type, p.enabled]));
      const merged: NotificationPreference[] = ALL_NOTIFICATION_TYPES.map((type) => ({
        type,
        enabled: storedMap.has(type) ? (storedMap.get(type) as boolean) : true,
      }));

      return { preferences: merged };
    },
  };

  return { notificationPreferencesRepository };
};
