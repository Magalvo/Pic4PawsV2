import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  AddShelterMemberInput,
  AddShelterMemberResult,
  ListShelterMembersQuery,
  ListShelterMembersResult,
  RemoveShelterMemberInput,
  ShelterMemberRepository,
  ShelterMemberRole,
  ShelterMemberSummary,
} from './shelter-member';

export class SupabaseShelterMemberRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseShelterMemberRepositoryError';
  }
}

export type CreateSupabaseShelterMemberRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseShelterMemberRepositoriesResult = {
  shelterMemberRepository: ShelterMemberRepository;
};

type ShelterMemberRow = {
  id: string;
  user_id: string;
  shelter_id: string;
  role: ShelterMemberRole;
  created_at: string;
  deleted_at: string | null;
};

const shelterMemberColumns = 'id,user_id,shelter_id,role,created_at,deleted_at';

const toShelterMemberSummary = (row: ShelterMemberRow): ShelterMemberSummary => ({
  memberId: row.id,
  userId: row.user_id,
  role: row.role,
  joinedAt: row.created_at,
});

export const createSupabaseShelterMemberRepositories = ({
  client,
}: CreateSupabaseShelterMemberRepositoriesInput): CreateSupabaseShelterMemberRepositoriesResult => {
  const shelterMemberRepository: ShelterMemberRepository = {
    listMembers: async ({
      shelterId,
      limit = 20,
      offset = 0,
    }: ListShelterMembersQuery): Promise<ListShelterMembersResult> => {
      const result = (await client
        .from('shelter_memberships')
        .select(shelterMemberColumns)
        .eq('shelter_id', shelterId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1)) as SupabaseQueryResult<ShelterMemberRow[]>;

      if (result.error) {
        throw new SupabaseShelterMemberRepositoryError(
          `Failed to list shelter members: ${result.error.message}`,
        );
      }

      const members = (result.data ?? []).map(toShelterMemberSummary);

      // Count active memberships separately for the total
      const countResult = (await client
        .from('shelter_memberships')
        .select('id')
        .eq('shelter_id', shelterId)
        .is('deleted_at', null)) as SupabaseQueryResult<{ id: string }[]>;

      const total = countResult.data?.length ?? members.length;

      return { members, total };
    },

    addMember: async (input: AddShelterMemberInput): Promise<AddShelterMemberResult | null> => {
      const { shelterId, userId, role, now } = input;
      // Check for existing active membership
      const existing = (await client
        .from('shelter_memberships')
        .select('id')
        .eq('shelter_id', shelterId)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .maybeSingle()) as SupabaseQueryResult<{ id: string } | null>;

      if (existing.error) {
        throw new SupabaseShelterMemberRepositoryError(
          `Failed to check existing membership: ${existing.error.message}`,
        );
      }

      if (existing.data) {
        // Already an active member
        return null;
      }

      const insertResult = (await client
        .from('shelter_memberships')
        .insert({
          shelter_id: shelterId,
          user_id: userId,
          role,
          created_at: now,
          deleted_at: null,
        })
        .select('id,user_id,role')
        .maybeSingle()) as SupabaseQueryResult<{ id: string; user_id: string; role: ShelterMemberRole } | null>;

      if (insertResult.error) {
        throw new SupabaseShelterMemberRepositoryError(
          `Failed to add shelter member: ${insertResult.error.message}`,
        );
      }

      if (!insertResult.data) return null;

      return {
        memberId: insertResult.data.id,
        userId: insertResult.data.user_id,
        role: insertResult.data.role,
      };
    },

    removeMember: async ({
      shelterId,
      memberId,
    }: RemoveShelterMemberInput): Promise<{ memberId: string } | null> => {
      // Soft-delete: set deleted_at
      const existing = (await client
        .from('shelter_memberships')
        .select('id')
        .eq('id', memberId)
        .eq('shelter_id', shelterId)
        .is('deleted_at', null)
        .maybeSingle()) as SupabaseQueryResult<{ id: string } | null>;

      if (existing.error) {
        throw new SupabaseShelterMemberRepositoryError(
          `Failed to check member: ${existing.error.message}`,
        );
      }

      if (!existing.data) return null;

      const updateResult = (await client
        .from('shelter_memberships')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', memberId)
        .eq('shelter_id', shelterId)
        .select('id')
        .maybeSingle()) as SupabaseQueryResult<{ id: string } | null>;

      if (updateResult.error) {
        throw new SupabaseShelterMemberRepositoryError(
          `Failed to remove shelter member: ${updateResult.error.message}`,
        );
      }

      if (!updateResult.data) return null;

      return { memberId: updateResult.data.id };
    },
  };

  return { shelterMemberRepository };
};
