import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  PublicShelterProfile,
  ShelterKind,
  ShelterProfileRepository,
  ShelterVerificationStatus,
} from './shelter-profile';

export class SupabaseShelterRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseShelterRepositoryError';
  }
}

export type CreateSupabaseShelterRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseShelterRepositoriesResult = {
  shelterProfileRepository: ShelterProfileRepository;
};

type ShelterProfileRow = {
  id: string;
  name: string;
  slug: string;
  kind: ShelterKind;
  verification_status: ShelterVerificationStatus;
  public_email: string | null;
  public_phone: string | null;
  city: string;
  district: string | null;
  country_code: string;
  description: string | null;
  logo_media_id: string | null;
  cover_media_id: string | null;
};

// Deliberately excludes private fields: tax_id, registration_number,
// address_line_1, address_line_2, postal_code, latitude, longitude,
// payment_account_status, created_at, updated_at, deleted_at.
const shelterProfileColumns =
  'id,name,slug,kind,verification_status,public_email,public_phone,' +
  'city,district,country_code,description,logo_media_id,cover_media_id';

const assertShelterResult = <TData>(
  result: SupabaseQueryResult<unknown>,
  failureMessage: string,
): TData => {
  if (result.error) {
    throw new SupabaseShelterRepositoryError(failureMessage);
  }

  return result.data as TData;
};

const toPublicShelterProfile = (row: ShelterProfileRow): PublicShelterProfile => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  kind: row.kind,
  verificationStatus: row.verification_status,
  publicEmail: row.public_email,
  publicPhone: row.public_phone,
  city: row.city,
  district: row.district,
  countryCode: row.country_code,
  description: row.description,
  logoMediaId: row.logo_media_id,
  coverMediaId: row.cover_media_id,
});

export const createSupabaseShelterRepositories = ({
  client,
}: CreateSupabaseShelterRepositoriesInput): CreateSupabaseShelterRepositoriesResult => {
  const shelterProfileRepository: ShelterProfileRepository = {
    loadShelterProfile: async ({ shelterId }) => {
      const result = await client
        .from('shelters')
        .select(shelterProfileColumns)
        .eq('id', shelterId)
        .is('deleted_at', null)
        .maybeSingle();
      const row = assertShelterResult<ShelterProfileRow | null>(
        result,
        'Failed to load shelter profile',
      );

      if (!row) return null;

      return toPublicShelterProfile(row);
    },
  };

  return { shelterProfileRepository };
};
