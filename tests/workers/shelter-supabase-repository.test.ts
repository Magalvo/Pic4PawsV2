import { describe, expect, it } from 'vitest';
import {
  createSupabaseShelterRepositories,
  SupabaseShelterRepositoryError,
} from '../../apps/workers/src/shelter-supabase';
import type {
  SupabaseClientLike,
  SupabaseTableQueryLike,
  SupabaseQueryResult,
} from '../../apps/workers/src/index';

type Operation = {
  table: string;
  action: 'select' | 'insert' | 'update';
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
    const operation: Operation = {
      table: this.table,
      action: this.action ?? 'select',
      payload: this.payload,
      columns: this.columns,
      filters: this.filters,
      result,
    };
    this.operations.push(operation);

    return this.responses[`${this.table}:${result}`] ?? { data: null, error: null };
  }
}

const createFakeSupabaseClient = (responses: FakeResponseMap = {}) => {
  const operations: Operation[] = [];
  const client: SupabaseClientLike = {
    from: (table) => new FakeSupabaseQuery(table, operations, responses),
    rpc: async () => ({ data: null, error: null }),
  };

  return { client, operations };
};

const shelterRow = {
  id: 'shelter-a',
  name: 'Abrigo dos Amigos',
  slug: 'abrigo-dos-amigos',
  kind: 'shelter',
  verification_status: 'verified',
  public_email: 'contacto@abrigodosamigos.pt',
  public_phone: '+351912345678',
  city: 'Porto',
  district: 'Porto',
  country_code: 'PT',
  description: 'Um abrigo com coração.',
  logo_media_id: 'logo-media-1',
  cover_media_id: 'cover-media-1',
};

describe('Supabase shelter repository adapters', () => {
  it('loads shelter profile by ID using correct columns, filters, and row mapping', async () => {
    const { client, operations } = createFakeSupabaseClient({
      'shelters:maybeSingle': { data: shelterRow, error: null },
    });
    const { shelterProfileRepository } = createSupabaseShelterRepositories({ client });

    await expect(
      shelterProfileRepository.loadShelterProfile({ shelterId: 'shelter-a' }),
    ).resolves.toEqual({
      id: 'shelter-a',
      name: 'Abrigo dos Amigos',
      slug: 'abrigo-dos-amigos',
      kind: 'shelter',
      verificationStatus: 'verified',
      publicEmail: 'contacto@abrigodosamigos.pt',
      publicPhone: '+351912345678',
      city: 'Porto',
      district: 'Porto',
      countryCode: 'PT',
      description: 'Um abrigo com coração.',
      logoMediaId: 'logo-media-1',
      coverMediaId: 'cover-media-1',
    });

    expect(operations).toEqual([
      {
        table: 'shelters',
        action: 'select',
        columns:
          'id,name,slug,kind,verification_status,public_email,public_phone,' +
          'city,district,country_code,description,logo_media_id,cover_media_id',
        filters: [
          { kind: 'eq', column: 'id', value: 'shelter-a' },
          { kind: 'is', column: 'deleted_at', value: null },
        ],
        result: 'maybeSingle',
      },
    ]);
  });

  it('returns null when shelter row is absent', async () => {
    const { client } = createFakeSupabaseClient({
      'shelters:maybeSingle': { data: null, error: null },
    });
    const { shelterProfileRepository } = createSupabaseShelterRepositories({ client });

    await expect(
      shelterProfileRepository.loadShelterProfile({ shelterId: 'unknown-shelter' }),
    ).resolves.toBeNull();
  });

  it('throws sanitized adapter error without leaking secrets', async () => {
    const { client } = createFakeSupabaseClient({
      'shelters:maybeSingle': {
        data: null,
        error: { message: 'service-role-secret r2-secret-key Bearer test-token' },
      },
    });
    const { shelterProfileRepository } = createSupabaseShelterRepositories({ client });

    await expect(
      shelterProfileRepository.loadShelterProfile({ shelterId: 'shelter-a' }),
    ).rejects.toEqual(new SupabaseShelterRepositoryError('Failed to load shelter profile'));

    await expect(
      shelterProfileRepository.loadShelterProfile({ shelterId: 'shelter-a' }),
    ).rejects.not.toThrow(/service-role-secret|r2-secret-key|test-token/);
  });
});
