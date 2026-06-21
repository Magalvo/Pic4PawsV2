import type { SupabaseClientLike } from './pet-supabase';
import type {
  UserRegistrationInput,
  UserRegistrationRepository,
  UserRegistrationResult,
} from './user-register';

export class SupabaseUserRegistrationRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseUserRegistrationRepositoryError';
  }
}

export type CreateSupabaseUserRegistrationRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseUserRegistrationRepositoriesResult = {
  userRegistrationRepository: UserRegistrationRepository;
};

const isEmailAlreadyRegistered = (message: string): boolean =>
  message.toLowerCase().includes('already registered');

export const createSupabaseUserRegistrationRepositories = ({
  client,
}: CreateSupabaseUserRegistrationRepositoriesInput): CreateSupabaseUserRegistrationRepositoriesResult => {
  const userRegistrationRepository: UserRegistrationRepository = {
    registerUser: async (
      input: UserRegistrationInput,
      now: string,
    ): Promise<UserRegistrationResult> => {
      const result = await client.rpc('register_user', {
        p_email: input.email,
        p_password: input.password,
        p_display_name: input.displayName,
        p_gdpr_consent_version: input.gdprConsentVersion,
        p_gdpr_consent_accepted_at: now,
      });

      if (result.error) {
        const message = (result.error as { message?: string }).message ?? '';
        if (isEmailAlreadyRegistered(message)) {
          return { ok: false, reason: 'email_already_registered' };
        }
        throw new SupabaseUserRegistrationRepositoryError(`Failed to register user: ${message}`);
      }

      return { ok: true };
    },
  };

  return { userRegistrationRepository };
};
