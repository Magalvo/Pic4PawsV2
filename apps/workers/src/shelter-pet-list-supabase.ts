import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  ListShelterPetsQuery,
  ListShelterPetsResult,
  ShelterPetListRepository,
  ShelterPetStatus,
  ShelterPetSummary,
} from './shelter-pet-list';

export class SupabaseShelterPetListRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseShelterPetListRepositoryError';
  }
}

export type CreateSupabaseShelterPetListRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseShelterPetListRepositoriesResult = {
  shelterPetListRepository: ShelterPetListRepository;
};

type PetRow = {
  id: string;
  name: string | null;
  species: string | null;
  status: ShelterPetStatus;
  hero_media_id: string | null;
  location_label: string | null;
  created_at: string;
  updated_at: string;
};

const petListColumns =
  'id,name,species,status,hero_media_id,location_label,created_at,updated_at';

const toPetSummary = (row: PetRow): ShelterPetSummary => ({
  petId: row.id,
  name: row.name,
  species: row.species as ShelterPetSummary['species'],
  status: row.status,
  heroMediaId: row.hero_media_id,
  locationLabel: row.location_label,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createSupabaseShelterPetListRepositories = ({
  client,
}: CreateSupabaseShelterPetListRepositoriesInput): CreateSupabaseShelterPetListRepositoriesResult => {
  const shelterPetListRepository: ShelterPetListRepository = {
    listPets: async ({
      shelterId,
      limit = 20,
      offset = 0,
    }: ListShelterPetsQuery): Promise<ListShelterPetsResult> => {
      const result = (await client
        .from('pets')
        .select(petListColumns, { count: 'exact' })
        .eq('shelter_id', shelterId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)) as SupabaseQueryResult<PetRow[]>;

      if (result.error) {
        throw new SupabaseShelterPetListRepositoryError(
          `Failed to list shelter pets: ${result.error.message ?? 'unknown error'}`,
        );
      }

      const rows = result.data ?? [];
      const total = result.count ?? 0;

      return {
        pets: rows.map(toPetSummary),
        total,
      };
    },
  };

  return { shelterPetListRepository };
};
