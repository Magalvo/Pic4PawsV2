import { describe, expect, it } from 'vitest';
import {
  createSupabaseAuthAdapter,
  SupabaseAuthAdapterError,
  type SupabaseAuthClientLike,
  type SupabaseAuthQueryResult,
  type SupabaseAuthTableQueryLike,
} from '../../apps/workers/src/index';

type Operation = {
  table: string;
  action: 'select';
  columns?: string;
  filters: Array<{ kind: 'eq' | 'is'; column: string; value: unknown }>;
  result: 'maybeSingle' | 'many';
};

type FakeResponseMap = Record<string, SupabaseAuthQueryResult<unknown>>;

class FakeSupabaseAuthQuery implements SupabaseAuthTableQueryLike {
  private columns: string | undefined;
  private filters: Operation['filters'] = [];

  constructor(
    private readonly table: string,
    private readonly operations: Operation[],
    private readonly responses: FakeResponseMap,
  ) {}

  select(columns = '*'): SupabaseAuthTableQueryLike {
    this.columns = columns;

    return this;
  }

  eq(column: string, value: unknown): SupabaseAuthTableQueryLike {
    this.filters.push({ kind: 'eq', column, value });

    return this;
  }

  is(column: string, value: null): SupabaseAuthTableQueryLike {
    this.filters.push({ kind: 'is', column, value });

    return this;
  }

  async maybeSingle(): Promise<SupabaseAuthQueryResult<unknown>> {
    return this.resolve('maybeSingle');
  }

  async then<TResult1 = SupabaseAuthQueryResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: SupabaseAuthQueryResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.resolve('many').then(onfulfilled, onrejected);
  }

  private async resolve(result: Operation['result']): Promise<SupabaseAuthQueryResult<unknown>> {
    this.operations.push({
      table: this.table,
      action: 'select',
      columns: this.columns,
      filters: this.filters,
      result,
    });

    return this.responses[`${this.table}:${result}`] ?? { data: null, error: null };
  }
}

const createFakeSupabaseAuthClient = (
  responses: FakeResponseMap = {},
  authUserId: string | null = 'auth-member',
) => {
  const operations: Operation[] = [];
  const requestedTokens: string[] = [];
  const client: SupabaseAuthClientLike = {
    auth: {
      getUser: async (token) => {
        requestedTokens.push(token);

        return {
          data: { user: authUserId ? { id: authUserId } : null },
          error: null,
        };
      },
    },
    from: (table) => new FakeSupabaseAuthQuery(table, operations, responses),
  };

  return { client, operations, requestedTokens };
};

const activeUserRow = {
  id: 'member-user',
  auth_user_id: 'auth-member',
  role: 'shelter_member',
  status: 'active',
};

const activeMembershipRow = {
  id: 'membership-1',
  user_id: 'member-user',
  shelter_id: 'shelter-a',
  role: 'shelter_member',
  deleted_at: null,
};

describe('Supabase auth adapter', () => {
  it('resolves an active actor and active shelter memberships through an injected client', async () => {
    const { client, operations, requestedTokens } = createFakeSupabaseAuthClient({
      'users:maybeSingle': { data: activeUserRow, error: null },
      'shelter_memberships:many': { data: [activeMembershipRow], error: null },
    });
    const authenticate = createSupabaseAuthAdapter({ client });

    await expect(
      authenticate({
        request: new Request('https://worker.pic4paws.pt/api/pet-drafts'),
        authorizationHeader: 'Bearer test-token',
        bearerToken: 'test-token',
      }),
    ).resolves.toEqual({
      id: 'member-user',
      authUserId: 'auth-member',
      role: 'shelter_member',
      status: 'active',
      memberships: [
        {
          id: 'membership-1',
          userId: 'member-user',
          shelterId: 'shelter-a',
          role: 'shelter_member',
          deletedAt: null,
        },
      ],
    });
    expect(requestedTokens).toEqual(['test-token']);
    expect(operations).toEqual([
      {
        table: 'users',
        action: 'select',
        columns: 'id,auth_user_id,role,status',
        filters: [{ kind: 'eq', column: 'auth_user_id', value: 'auth-member' }],
        result: 'maybeSingle',
      },
      {
        table: 'shelter_memberships',
        action: 'select',
        columns: 'id,user_id,shelter_id,role,deleted_at',
        filters: [
          { kind: 'eq', column: 'user_id', value: 'member-user' },
          { kind: 'is', column: 'deleted_at', value: null },
        ],
        result: 'many',
      },
    ]);
  });

  it('resolves null for missing auth users, missing application users and inactive application users', async () => {
    const missingAuth = createSupabaseAuthAdapter({
      client: createFakeSupabaseAuthClient({}, null).client,
    });
    const missingAppUser = createSupabaseAuthAdapter({
      client: createFakeSupabaseAuthClient({
        'users:maybeSingle': { data: null, error: null },
      }).client,
    });
    const inactiveAppUser = createSupabaseAuthAdapter({
      client: createFakeSupabaseAuthClient({
        'users:maybeSingle': {
          data: { ...activeUserRow, status: 'suspended' },
          error: null,
        },
      }).client,
    });

    const input = {
      request: new Request('https://worker.pic4paws.pt/api/pet-drafts'),
      authorizationHeader: 'Bearer test-token',
      bearerToken: 'test-token',
    };

    await expect(missingAuth(input)).resolves.toBeNull();
    await expect(missingAppUser(input)).resolves.toBeNull();
    await expect(inactiveAppUser(input)).resolves.toBeNull();
  });

  it('throws sanitized adapter errors without leaking secrets or tokens', async () => {
    const { client } = createFakeSupabaseAuthClient({
      'users:maybeSingle': {
        data: null,
        error: { message: 'service-role-secret Bearer test-token provider payload' },
      },
    });
    const authenticate = createSupabaseAuthAdapter({ client });

    await expect(
      authenticate({
        request: new Request('https://worker.pic4paws.pt/api/pet-drafts'),
        authorizationHeader: 'Bearer test-token',
        bearerToken: 'test-token',
      }),
    ).rejects.toEqual(new SupabaseAuthAdapterError('Failed to resolve authenticated actor'));
    await expect(
      authenticate({
        request: new Request('https://worker.pic4paws.pt/api/pet-drafts'),
        authorizationHeader: 'Bearer test-token',
        bearerToken: 'test-token',
      }),
    ).rejects.not.toThrow(/service-role-secret|test-token|provider payload/);
  });
});
