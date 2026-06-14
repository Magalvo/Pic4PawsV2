import type { SupabaseClientLike } from './pet-supabase';
import type { ShelterUpdateInput, ShelterUpdateRepository } from './shelter-update';

export class SupabaseShelterUpdateRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseShelterUpdateRepositoryError';
  }
}

export type CreateSupabaseShelterUpdateRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseShelterUpdateRepositoriesResult = {
  shelterUpdateRepository: ShelterUpdateRepository;
};

const toColumnMap = (input: ShelterUpdateInput): Record<string, unknown> => {
  const cols: Record<string, unknown> = {};
  if (input.name !== undefined) cols.name = input.name;
  if (input.kind !== undefined) cols.kind = input.kind;
  if (input.city !== undefined) cols.city = input.city;
  if (input.district !== undefined) cols.district = input.district;
  if (input.publicEmail !== undefined) cols.public_email = input.publicEmail;
  if (input.publicPhone !== undefined) cols.public_phone = input.publicPhone;
  if (input.description !== undefined) cols.description = input.description;
  if (input.latitude !== undefined) cols.latitude = input.latitude;
  if (input.longitude !== undefined) cols.longitude = input.longitude;
  return cols;
};

export const createSupabaseShelterUpdateRepositories = ({
  client,
}: CreateSupabaseShelterUpdateRepositoriesInput): CreateSupabaseShelterUpdateRepositoriesResult => {
  const shelterUpdateRepository: ShelterUpdateRepository = {
    updateShelter: async (
      shelterId: string,
      input: ShelterUpdateInput,
    ): Promise<{ shelterId: string } | null> => {
      const cols = toColumnMap(input);

      const result = await client
        .from('shelters')
        .update(cols)
        .eq('id', shelterId)
        .is('deleted_at', null)
        .select('id')
        .maybeSingle();

      if (result.error) {
        throw new SupabaseShelterUpdateRepositoryError(
          `Failed to update shelter: ${result.error.message ?? 'unknown error'}`,
        );
      }

      if (!result.data) return null;

      return { shelterId: (result.data as { id: string }).id };
    },
  };

  return { shelterUpdateRepository };
};
