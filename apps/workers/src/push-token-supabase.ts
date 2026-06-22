import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type { PushTokenPlatform, PushTokenRepository } from './push-token';

export class SupabasePushTokenRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabasePushTokenRepositoryError';
  }
}

export type CreateSupabasePushTokenRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabasePushTokenRepositoriesResult = {
  pushTokenRepository: PushTokenRepository;
};

type PushTokenRow = { id: string };

export const createSupabasePushTokenRepositories = ({
  client,
}: CreateSupabasePushTokenRepositoriesInput): CreateSupabasePushTokenRepositoriesResult => {
  const pushTokenRepository: PushTokenRepository = {
    upsertPushToken: async (
      userId: string,
      token: string,
      platform: PushTokenPlatform,
    ): Promise<void> => {
      const result = (await client
        .from('push_tokens')
        .upsert(
          { user_id: userId, token, platform },
          { onConflict: 'user_id,token' },
        )) as SupabaseQueryResult<unknown>;

      if (result.error) {
        throw new SupabasePushTokenRepositoryError(
          `Failed to upsert push token: ${result.error.message ?? 'unknown error'}`,
        );
      }
    },

    deletePushToken: async (userId: string, token: string): Promise<boolean> => {
      const result = (await client
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token)
        .select('id')) as SupabaseQueryResult<PushTokenRow[]>;

      if (result.error) {
        throw new SupabasePushTokenRepositoryError(
          `Failed to delete push token: ${result.error.message ?? 'unknown error'}`,
        );
      }

      const deleted = Array.isArray(result.data) ? result.data : [];
      return deleted.length > 0;
    },
  };

  return { pushTokenRepository };
};
