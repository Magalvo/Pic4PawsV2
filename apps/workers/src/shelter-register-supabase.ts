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

      const shelterInsert = await client
        .from('shelters')
        .insert({
          id: shelterId,
          name: input.name,
          slug,
          kind: input.kind,
          verification_status: 'draft',
          city: input.city,
          district: input.district,
          country_code: 'PT',
          public_email: input.publicEmail,
          public_phone: input.publicPhone,
          description: input.description,
        })
        .select('id')
        .single();

      if (shelterInsert.error) {
        throw new SupabaseShelterRegistrationRepositoryError(
          `Failed to create shelter: ${shelterInsert.error.message ?? 'unknown error'}`,
        );
      }

      const membershipInsert = await client
        .from('shelter_memberships')
        .insert({
          id: crypto.randomUUID(),
          shelter_id: shelterId,
          user_id: actorUserId,
          role: 'shelter_owner',
        })
        .select('id')
        .single();

      if (membershipInsert.error) {
        throw new SupabaseShelterRegistrationRepositoryError(
          `Failed to create shelter membership: ${membershipInsert.error.message ?? 'unknown error'}`,
        );
      }

      return { shelterId };
    },
  };

  return { shelterRegistrationRepository };
};
