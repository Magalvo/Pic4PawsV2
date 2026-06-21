import type { SupabaseClientLike } from './pet-supabase';
import type {
  UserRegistrationInput,
  UserRegistrationRepository,
  UserRegistrationResult,
} from './user-register';

type AdminCreateUserParams = {
  email: string;
  password: string;
  email_confirm: boolean;
};

type AdminCreateUserResult = {
  data: { user: { id: string } | null } | null;
  error: { message?: string } | null;
};

type AdminDeleteUserResult = {
  error: { message?: string } | null;
};

// Narrower client type: only the capabilities this repository needs.
// The real service-role Supabase SDK satisfies this at runtime — the cast
// lives in dependencies.ts where the wiring happens.
export type UserRegistrationSupabaseClientLike = Pick<SupabaseClientLike, 'rpc'> & {
  auth: {
    admin: {
      createUser: (params: AdminCreateUserParams) => Promise<AdminCreateUserResult>;
      deleteUser: (id: string) => Promise<AdminDeleteUserResult>;
    };
  };
};

export class SupabaseUserRegistrationRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseUserRegistrationRepositoryError';
  }
}

export type CreateSupabaseUserRegistrationRepositoriesInput = {
  client: UserRegistrationSupabaseClientLike;
};

export type CreateSupabaseUserRegistrationRepositoriesResult = {
  userRegistrationRepository: UserRegistrationRepository;
};

const isEmailAlreadyRegistered = (message: string): boolean =>
  message.toLowerCase().includes('already registered') ||
  message.toLowerCase().includes('already been registered');

export const createSupabaseUserRegistrationRepositories = ({
  client,
}: CreateSupabaseUserRegistrationRepositoriesInput): CreateSupabaseUserRegistrationRepositoriesResult => {
  const userRegistrationRepository: UserRegistrationRepository = {
    registerUser: async (
      input: UserRegistrationInput,
      now: string,
    ): Promise<UserRegistrationResult> => {
      // Step 1: create the Supabase auth user via the admin API.
      // Supabase handles password hashing and auth.identities internally.
      const createResult = await client.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
      });

      if (createResult.error) {
        const message = (createResult.error as { message?: string }).message ?? '';
        if (isEmailAlreadyRegistered(message)) {
          return { ok: false, reason: 'email_already_registered' };
        }
        throw new SupabaseUserRegistrationRepositoryError(
          `Failed to create auth user: ${message}`,
        );
      }

      const authUserId = createResult.data?.user?.id;
      if (!authUserId) {
        throw new SupabaseUserRegistrationRepositoryError(
          'Auth user created but no ID returned',
        );
      }

      // Step 2: create the public.users profile row via RPC.
      const profileResult = await client.rpc('register_user', {
        p_auth_user_id: authUserId,
        p_email: input.email,
        p_display_name: input.displayName,
        p_gdpr_consent_version: input.gdprConsentVersion,
        p_gdpr_consent_accepted_at: now,
      });

      if (profileResult.error) {
        // Best-effort rollback: delete the auth user so the account is not
        // permanently orphaned. If deleteUser itself fails, swallow that error
        // and re-throw the original profile failure.
        await client.auth.admin.deleteUser(authUserId).catch(() => {});
        const message = (profileResult.error as { message?: string }).message ?? '';
        throw new SupabaseUserRegistrationRepositoryError(
          `Failed to create user profile: ${message}`,
        );
      }

      return { ok: true };
    },
  };

  return { userRegistrationRepository };
};
