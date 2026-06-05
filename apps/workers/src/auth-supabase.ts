import {
  resolveAuthenticatedActor,
  type AuthUserRecord,
  type AuthenticatedActor,
  type ShelterMembershipRecord,
} from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';

type SupabaseErrorLike = {
  message?: string;
};

export type SupabaseAuthQueryResult<TData> = {
  data: TData | null;
  error: SupabaseErrorLike | null;
};

export type SupabaseAuthUserLike = {
  id: string;
};

export type SupabaseAuthGetUserResult = {
  data: {
    user: SupabaseAuthUserLike | null;
  } | null;
  error: SupabaseErrorLike | null;
};

export type SupabaseAuthTableQueryLike = PromiseLike<SupabaseAuthQueryResult<unknown>> & {
  select: (columns?: string) => SupabaseAuthTableQueryLike;
  eq: (column: string, value: unknown) => SupabaseAuthTableQueryLike;
  is: (column: string, value: null) => SupabaseAuthTableQueryLike;
  maybeSingle: () => Promise<SupabaseAuthQueryResult<unknown>>;
};

export type SupabaseAuthClientLike = {
  auth: {
    getUser: (bearerToken: string) => Promise<SupabaseAuthGetUserResult>;
  };
  from: (table: string) => SupabaseAuthTableQueryLike;
};

export class SupabaseAuthAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseAuthAdapterError';
  }
}

export type CreateSupabaseAuthAdapterInput = {
  client: SupabaseAuthClientLike;
};

type UserRow = {
  id: string;
  auth_user_id: string;
  role: AuthUserRecord['role'];
  status: AuthUserRecord['status'];
};

type ShelterMembershipRow = {
  id: string;
  user_id: string;
  shelter_id: string;
  role: ShelterMembershipRecord['role'];
  deleted_at?: string | null;
};

const userColumns = 'id,auth_user_id,role,status';
const membershipColumns = 'id,user_id,shelter_id,role,deleted_at';
const adapterFailureMessage = 'Failed to resolve authenticated actor';

const assertSupabaseAuthResult = <TData>(
  result: SupabaseAuthQueryResult<unknown>,
): TData => {
  if (result.error) {
    throw new SupabaseAuthAdapterError(adapterFailureMessage);
  }

  return result.data as TData;
};

const toAuthUserRecord = (row: UserRow): AuthUserRecord => ({
  id: row.id,
  authUserId: row.auth_user_id,
  role: row.role,
  status: row.status,
});

const toShelterMembershipRecord = (row: ShelterMembershipRow): ShelterMembershipRecord => ({
  id: row.id,
  userId: row.user_id,
  shelterId: row.shelter_id,
  role: row.role,
  deletedAt: row.deleted_at ?? null,
});

export const createSupabaseAuthAdapter = ({
  client,
}: CreateSupabaseAuthAdapterInput): WorkerPetDraftAuthenticator => async ({
  request,
  authorizationHeader,
  bearerToken,
}): Promise<AuthenticatedActor | null> => {
  void request;
  void authorizationHeader;

  const authResult = await client.auth.getUser(bearerToken);

  if (authResult.error) {
    throw new SupabaseAuthAdapterError(adapterFailureMessage);
  }

  const authUserId = authResult.data?.user?.id;

  if (!authUserId) {
    return null;
  }

  const userResult = await client
    .from('users')
    .select(userColumns)
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  const userRow = assertSupabaseAuthResult<UserRow | null>(userResult);

  if (!userRow || userRow.status !== 'active') {
    return null;
  }

  const membershipsResult = await client
    .from('shelter_memberships')
    .select(membershipColumns)
    .eq('user_id', userRow.id)
    .is('deleted_at', null);
  const membershipRows = assertSupabaseAuthResult<ShelterMembershipRow[]>(membershipsResult) ?? [];

  return resolveAuthenticatedActor({
    authUserId,
    users: [toAuthUserRecord(userRow)],
    memberships: membershipRows.map(toShelterMembershipRecord),
  });
};
