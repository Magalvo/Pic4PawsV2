import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type { ShelterKind, ShelterVerificationStatus } from './shelter-profile';
import type {
  PublicShelterSummary,
  ShelterSearchRepository,
  ShelterSearchResult,
} from './shelter-search';

export class SupabaseShelterSearchRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseShelterSearchRepositoryError';
  }
}

export type CreateSupabaseShelterSearchRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseShelterSearchRepositoriesResult = {
  shelterSearchRepository: ShelterSearchRepository;
};

type ShelterSearchRow = {
  id: string;
  name: string;
  slug: string;
  kind: ShelterKind;
  verification_status: ShelterVerificationStatus;
  city: string;
  district: string | null;
  country_code: string;
  logo_media_id: string | null;
};

const shelterSearchColumns =
  'id,name,slug,kind,verification_status,city,district,country_code,logo_media_id';

const toPublicShelterSummary = (row: ShelterSearchRow): PublicShelterSummary => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  kind: row.kind,
  verificationStatus: row.verification_status,
  city: row.city,
  district: row.district,
  countryCode: row.country_code,
  logoMediaId: row.logo_media_id,
});

const assertResult = <TData>(
  result: SupabaseQueryResult<unknown>,
  failureMessage: string,
): TData => {
  if (result.error) throw new SupabaseShelterSearchRepositoryError(failureMessage);
  return result.data as TData;
};

export const createSupabaseShelterSearchRepositories = ({
  client,
}: CreateSupabaseShelterSearchRepositoriesInput): CreateSupabaseShelterSearchRepositoriesResult => {
  const shelterSearchRepository: ShelterSearchRepository = {
    searchShelters: async ({ limit, offset, kind }) => {
      let query = client
        .from('shelters')
        .select(shelterSearchColumns, { count: 'exact' })
        .eq('verification_status', 'verified')
        .is('deleted_at', null)
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (kind) {
        query = query.eq('kind', kind);
      }

      const result = await query;
      const rows = assertResult<ShelterSearchRow[]>(result, 'Failed to search shelters');
      const total = (result as { count?: number | null }).count ?? 0;

      const shelters: ShelterSearchResult = {
        shelters: rows.map(toPublicShelterSummary),
        total,
      };

      return shelters;
    },
  };

  return { shelterSearchRepository };
};
