import { describe, expect, it } from 'vitest';
import {
  createWorkerSupabaseDependencies,
  handleWorkerRequest,
  WorkerSupabaseWiringError,
  type SupabaseAuthGetUserResult,
  type SupabaseQueryResult,
  type SupabaseTableQueryLike,
  type WorkerEnv,
  type WorkerSupabaseClientFactory,
  type WorkerSupabaseClientFactoryInput,
  type WorkerSupabaseClientLike,
} from '../../apps/workers/src/index';

type Operation = {
  table: string;
  action: 'select' | 'insert' | 'update' | 'delete';
  payload?: unknown;
  columns?: string;
  filters: Array<{ kind: 'eq' | 'in' | 'is'; column: string; value: unknown }>;
  result: 'single' | 'maybeSingle' | 'many';
};

type FakeResponseMap = Record<string, SupabaseQueryResult<unknown>>;

class FakeSupabaseQuery implements SupabaseTableQueryLike {
  private action: Operation['action'] | null = null;
  private payload: unknown;
  private columns: string | undefined;
  private filters: Operation['filters'] = [];

  constructor(
    private readonly table: string,
    private readonly operations: Operation[],
    private readonly responses: FakeResponseMap,
  ) {}

  select(columns = '*'): SupabaseTableQueryLike {
    this.action ??= 'select';
    this.columns = columns;

    return this;
  }

  insert(payload: unknown): SupabaseTableQueryLike {
    this.action = 'insert';
    this.payload = payload;

    return this;
  }

  update(payload: unknown): SupabaseTableQueryLike {
    this.action = 'update';
    this.payload = payload;

    return this;
  }

  upsert(payload: unknown): SupabaseTableQueryLike {
    this.action = 'update';
    this.payload = payload;

    return this;
  }

  delete(): SupabaseTableQueryLike {
    this.action = 'delete';
    return this;
  }

  neq(): SupabaseTableQueryLike {
    return this;
  }

  eq(column: string, value: unknown): SupabaseTableQueryLike {
    this.filters.push({ kind: 'eq', column, value });

    return this;
  }

  in(column: string, value: unknown[]): SupabaseTableQueryLike {
    this.filters.push({ kind: 'in', column, value });

    return this;
  }

  is(column: string, value: unknown): SupabaseTableQueryLike {
    this.filters.push({ kind: 'is', column, value });

    return this;
  }

  order(): SupabaseTableQueryLike {
    return this;
  }

  range(): SupabaseTableQueryLike {
    return this;
  }

  async single(): Promise<SupabaseQueryResult<unknown>> {
    return this.resolve('single');
  }

  async maybeSingle(): Promise<SupabaseQueryResult<unknown>> {
    return this.resolve('maybeSingle');
  }

  async then<TResult1 = SupabaseQueryResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: SupabaseQueryResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.resolve('many').then(onfulfilled, onrejected);
  }

  private async resolve(result: Operation['result']): Promise<SupabaseQueryResult<unknown>> {
    this.operations.push({
      table: this.table,
      action: this.action ?? 'select',
      payload: this.payload,
      columns: this.columns,
      filters: this.filters,
      result,
    });

    return this.responses[`${this.table}:${result}`] ?? { data: null, error: null };
  }
}

const validEnv: WorkerEnv = {
  APP_ENV: 'production',
  PUBLIC_APP_ORIGIN: 'https://pic4paws.pt',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
  CLOUDFLARE_ACCOUNT_ID: 'cloudflare-account',
  R2_PUBLIC_BUCKET: 'pic4paws-public',
  R2_PRIVATE_BUCKET: 'pic4paws-private',
  R2_ACCESS_KEY_ID: 'r2-access-key',
  R2_SECRET_ACCESS_KEY: 'r2-secret-key',
  WORKER_PAYMENT_WEBHOOK_PATH: '/webhooks/payments',
  WORKER_MEDIA_UPLOAD_PATH: '/uploads/media',
  WORKER_PET_DRAFTS_PATH: '/pets/drafts',
  PAYMENT_PRIMARY_PROVIDER: 'eupago',
  EUPAGO_API_KEY: 'eupago-api-key',
  EUPAGO_WEBHOOK_SECRET: 'eupago-webhook-secret',
};

const validDraftPayload = {
  petId: 'pet-1',
  shelterId: 'shelter-a',
  name: 'Becas',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Calmo, sociavel e pronto para uma familia.',
  mediaIds: ['media-1'],
  heroMediaId: 'media-1',
  medical: {
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    specialNeeds: false,
  },
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

const publicMediaRow = {
  id: 'media-1',
  shelter_id: 'shelter-a',
  owner_user_id: 'member-user',
  visibility: 'public',
  r2_object_key: 'public/shelters/shelter-a/pet_public_image/media-1.jpg',
  derivative_metadata: { mediaKind: 'image' },
  deleted_at: null,
};

const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

const createFakeSupabaseClient = (
  responses: FakeResponseMap = {},
  authUserId: string | null = 'auth-member',
) => {
  const operations: Operation[] = [];
  const requestedTokens: string[] = [];
  const client: WorkerSupabaseClientLike = {
    auth: {
      getUser: async (token): Promise<SupabaseAuthGetUserResult> => {
        requestedTokens.push(token);

        return {
          data: { user: authUserId ? { id: authUserId } : null },
          error: null,
        };
      },
    },
    from: (table) => new FakeSupabaseQuery(table, operations, responses),
    rpc: async () => ({ data: null, error: null }),
  };

  return { client, operations, requestedTokens };
};

describe('Worker Supabase dependency wiring', () => {
  it('composes auth and pet repositories from one server-side Supabase client factory', async () => {
    const { client, requestedTokens } = createFakeSupabaseClient({
      'users:maybeSingle': { data: activeUserRow, error: null },
      'shelter_memberships:many': { data: [activeMembershipRow], error: null },
    });
    const factoryInputs: WorkerSupabaseClientFactoryInput[] = [];
    const dependencies = createWorkerSupabaseDependencies({
      config: {
        app: { environment: 'production', publicAppOrigin: 'https://pic4paws.pt' },
        supabase: {
          url: 'https://example.supabase.co',
          anonKey: 'anon-key',
          serviceRoleKey: 'service-role-secret',
        },
        cloudflare: {
          accountId: 'cloudflare-account',
          r2PublicBucket: 'pic4paws-public',
          r2PrivateBucket: 'pic4paws-private',
          r2AccessKeyId: 'r2-access-key',
          r2SecretAccessKey: 'r2-secret-key',
        },
        workers: {
          paymentWebhookPath: '/webhooks/payments',
          mediaUploadPath: '/uploads/media',
          petDraftsPath: '/pets/drafts',
          petFeedPath: '/pets',
          shelterPath: '/shelters',
          adoptionsPath: '/adoptions',
          donationsPath: '/donations',
          sponsorshipsPath: '/sponsorships',
          notificationsPath: '/notifications',
        },
        payments: {
          primaryProvider: 'eupago',
          webhooksEnabled: false,
          eupagoApiKey: 'eupago-api-key',
          eupagoWebhookSecret: 'eupago-webhook-secret',
          ifthenpayApiKey: null,
          ifthenpayWebhookSecret: null,
          stripeSecretKey: null,
          stripeWebhookSecret: null,
        },
      },
      supabaseClientFactory: (input) => {
        factoryInputs.push(input);

        return client;
      },
    });

    await expect(
      dependencies.petDraftAuthenticator?.({
        request: new Request('https://worker.test/pets/drafts'),
        authorizationHeader: 'Bearer test-token',
        bearerToken: 'test-token',
      }),
    ).resolves.toMatchObject({
      id: 'member-user',
      authUserId: 'auth-member',
      status: 'active',
    });
    expect(dependencies.petDraftRepository).toBeDefined();
    expect(dependencies.petPublishRepository).toBeDefined();
    expect(factoryInputs).toEqual([
      {
        supabaseUrl: 'https://example.supabase.co',
        serviceRoleKey: 'service-role-secret',
      },
    ]);
    expect(requestedTokens).toEqual(['test-token']);
    expect(JSON.stringify(dependencies)).not.toContain('service-role-secret');
  });

  it('creates pet drafts through composed Supabase dependencies at the Worker boundary', async () => {
    const { client, operations, requestedTokens } = createFakeSupabaseClient({
      'users:maybeSingle': { data: activeUserRow, error: null },
      'shelter_memberships:many': { data: [activeMembershipRow], error: null },
      'media_assets:many': { data: [publicMediaRow], error: null },
      'pets:single': { data: { id: 'pet-1' }, error: null },
    });
    const factoryInputs: WorkerSupabaseClientFactoryInput[] = [];
    const supabaseClientFactory: WorkerSupabaseClientFactory = (input) => {
      factoryInputs.push(input);

      return client;
    };
    const response = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify(validDraftPayload),
      }),
      validEnv,
      {
        now: () => '2026-06-05T10:00:00.000Z',
        supabaseClientFactory,
      },
    );

    expect(response.status).toBe(201);
    await expect(json(response)).resolves.toEqual({
      status: 'pet_draft_created',
      petId: 'pet-1',
    });
    expect(factoryInputs).toEqual([
      {
        supabaseUrl: 'https://example.supabase.co',
        serviceRoleKey: 'service-role-secret',
      },
    ]);
    expect(requestedTokens).toEqual(['test-token']);
    expect(operations.map((operation) => operation.table)).toEqual([
      'users',
      'shelter_memberships',
      'media_assets',
      'pets',
    ]);
  });

  it('returns sanitized dependency configuration errors without leaking secrets', async () => {
    const response = await handleWorkerRequest(
      new Request('https://worker.test/pets/drafts', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
        body: JSON.stringify(validDraftPayload),
      }),
      validEnv,
      {
        now: () => '2026-06-05T10:00:00.000Z',
        supabaseClientFactory: () => {
          throw new Error('service-role-secret Bearer test-token provider payload');
        },
      },
    );

    expect(response.status).toBe(500);
    const body = await json(response);

    expect(body).toEqual({ status: 'dependency_configuration_error' });
    expect(JSON.stringify(body)).not.toContain('service-role-secret');
    expect(JSON.stringify(body)).not.toContain('test-token');
    expect(JSON.stringify(body)).not.toContain('provider payload');
  });

  it('throws sanitized wiring errors when composed outside the request boundary', () => {
    const createDependencies = () =>
      createWorkerSupabaseDependencies({
        config: {
          app: { environment: 'production', publicAppOrigin: 'https://pic4paws.pt' },
          supabase: {
            url: 'https://example.supabase.co',
            anonKey: 'anon-key',
            serviceRoleKey: 'service-role-secret',
          },
          cloudflare: {
            accountId: 'cloudflare-account',
            r2PublicBucket: 'pic4paws-public',
            r2PrivateBucket: 'pic4paws-private',
            r2AccessKeyId: 'r2-access-key',
            r2SecretAccessKey: 'r2-secret-key',
          },
          workers: {
            paymentWebhookPath: '/webhooks/payments',
            mediaUploadPath: '/uploads/media',
            petDraftsPath: '/pets/drafts',
            petFeedPath: '/pets',
            shelterPath: '/shelters',
            adoptionsPath: '/adoptions',
            donationsPath: '/donations',
            sponsorshipsPath: '/sponsorships',
            notificationsPath: '/notifications',
          },
          payments: {
            primaryProvider: 'eupago',
            webhooksEnabled: false,
            eupagoApiKey: 'eupago-api-key',
            eupagoWebhookSecret: 'eupago-webhook-secret',
            ifthenpayApiKey: null,
            ifthenpayWebhookSecret: null,
            stripeSecretKey: null,
            stripeWebhookSecret: null,
          },
        },
        supabaseClientFactory: () => {
          throw new Error('service-role-secret');
        },
      });

    expect(createDependencies).toThrowError(
      new WorkerSupabaseWiringError('Failed to configure Supabase worker dependencies'),
    );
    expect(createDependencies).not.toThrow(/service-role-secret/);
  });
});
