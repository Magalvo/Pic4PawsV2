import type { SupabaseClientLike } from './pet-supabase';
import type { ShelterRegistrationInput, ShelterRegistrationRepository } from './shelter-register';

export class SupabaseShelterRegistrationRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseShelterRegistrationRepositoryError';
  }
}

export type CreateSupabaseShelterRegistrationRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseShelterRegistrationRepositoriesResult = {
  shelterRegistrationRepository: ShelterRegistrationRepository;
};

const toSlug = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const createSupabaseShelterRegistrationRepositories = ({
  client,
}: CreateSupabaseShelterRegistrationRepositoriesInput): CreateSupabaseShelterRegistrationRepositoriesResult => {
  const shelterRegistrationRepository: ShelterRegistrationRepository = {
    registerShelter: async (
      input: ShelterRegistrationInput,
      actorUserId: string,
    ): Promise<{ shelterId: string }> => {
      const shelterId = crypto.randomUUID();
      const slug = toSlug(input.name);

      const result = await client.rpc('register_shelter', {
        p_shelter_id: shelterId,
        p_name: input.name,
        p_slug: slug,
        p_kind: input.kind,
        p_city: input.city,
        p_district: input.district ?? null,
        p_country_code: 'PT',
        p_public_email: input.publicEmail ?? null,
        p_public_phone: input.publicPhone ?? null,
        p_description: input.description ?? null,
        p_membership_id: crypto.randomUUID(),
        p_user_id: actorUserId,
      });

      if (result.error) {
        throw new SupabaseShelterRegistrationRepositoryError(
          `Failed to register shelter: ${result.error.message ?? 'unknown error'}`,
        );
      }

      return { shelterId };
    },
  };

  return { shelterRegistrationRepository };
};
