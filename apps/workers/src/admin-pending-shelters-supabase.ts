import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type { ShelterKind } from './shelter-profile';
import type {
  AdminPendingShelterSummary,
  AdminPendingSheltersRepository,
  AdminPendingSheltersResult,
} from './admin-pending-shelters';

export class SupabaseAdminPendingSheltersRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseAdminPendingSheltersRepositoryError';
  }
}

export type CreateSupabaseAdminPendingSheltersRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseAdminPendingSheltersRepositoriesResult = {
  adminPendingSheltersRepository: AdminPendingSheltersRepository;
};

type AdminPendingShelterRow = {
  id: string;
  name: string;
  slug: string;
  kind: ShelterKind;
  verification_status: 'pending_review';
  city: string;
  district: string | null;
  country_code: string;
  public_email: string | null;
  public_phone: string | null;
  logo_media_id: string | null;
  created_at: string;
  updated_at: string;
};

const adminPendingShelterColumns =
  'id,name,slug,kind,verification_status,city,district,country_code,public_email,public_phone,logo_media_id,created_at,updated_at';

const toAdminPendingShelterSummary = (
  row: AdminPendingShelterRow,
): AdminPendingShelterSummary => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  kind: row.kind,
  verificationStatus: row.verification_status,
  city: row.city,
  district: row.district,
  countryCode: row.country_code,
  publicEmail: row.public_email,
  publicPhone: row.public_phone,
  logoMediaId: row.logo_media_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const assertResult = <TData>(
  result: SupabaseQueryResult<unknown>,
  failureMessage: string,
): TData => {
  if (result.error) throw new SupabaseAdminPendingSheltersRepositoryError(failureMessage);
  return result.data as TData;
};

export const createSupabaseAdminPendingSheltersRepositories = ({
  client,
}: CreateSupabaseAdminPendingSheltersRepositoriesInput): CreateSupabaseAdminPendingSheltersRepositoriesResult => {
  const adminPendingSheltersRepository: AdminPendingSheltersRepository = {
    listPendingShelters: async ({ limit, offset }) => {
      const result = await client
        .from('shelters')
        .select(adminPendingShelterColumns, { count: 'exact' })
        .eq('verification_status', 'pending_review')
        .is('deleted_at', null)
        .order('updated_at', { ascending: true })
        .range(offset, offset + limit - 1);

      const rows = assertResult<AdminPendingShelterRow[]>(
        result,
        'Failed to list pending shelters',
      ) ?? [];

      const pendingShelters: AdminPendingSheltersResult = {
        shelters: rows.map(toAdminPendingShelterSummary),
        total: result.count ?? 0,
      };

      return pendingShelters;
    },
  };

  return { adminPendingSheltersRepository };
};
