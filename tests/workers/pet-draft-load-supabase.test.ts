import { describe, expect, it } from 'vitest';
import {
  createSupabasePetRepositories,
  SupabasePetRepositoryError,
  type SupabaseClientLike,
  type SupabaseQueryResult,
  type SupabaseTableQueryLike,
} from '../../apps/workers/src/index';

type Operation = {
  table: string;
  action: 'select' | 'insert' | 'update';
  columns?: string;
  filters: Array<{ kind: 'eq' | 'in' | 'is'; column: string; value: unknown }>;
  result: 'single' | 'maybeSingle' | 'many';
};

type FakeResponseMap = Record<string, SupabaseQueryResult<unknown>>;

class FakeSupabaseQuery implements SupabaseTableQueryLike {
  private action: Operation['action'] | null = null;
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

  insert(): SupabaseTableQueryLike { return this; }
  update(): SupabaseTableQueryLike { return this; }
  upsert(): SupabaseTableQueryLike { return this; }
  neq(): SupabaseTableQueryLike { return this; }
  order(): SupabaseTableQueryLike { return this; }
  range(): SupabaseTableQueryLike { return this; }

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

const petRow = {
  id: 'pet-1',
  shelter_id: 'shelter-a',
  status: 'draft',
  name: 'Becas',
  species: 'dog',
  location_label: 'Lisboa',
  short_description: 'Calmo e sociável.',
  media_ids: ['media-1'],
  hero_media_id: 'media-1',
  medical: {
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    specialNeeds: false,
  },
  published_at: null,
  created_at: '2026-06-10T12:00:00.000Z',
  updated_at: '2026-06-10T12:10:00.000Z',
};

describe('createSupabasePetRepositories — loadDraft', () => {
  it('returns null when the pet row does not exist', async () => {
    const { client } = createFakeSupabaseClient({
      'pets:maybeSingle': { data: null, error: null },
    });
    const { petDraftRepository } = createSupabasePetRepositories({ client });

    await expect(petDraftRepository.loadDraft('pet-unknown')).resolves.toBeNull();
  });

  it('returns the full PetDraftLoadRecord when the row exists', async () => {
    const { client, operations } = createFakeSupabaseClient({
      'pets:maybeSingle': { data: petRow, error: null },
    });
    const { petDraftRepository } = createSupabasePetRepositories({ client });

    const result = await petDraftRepository.loadDraft('pet-1');

    expect(result).toEqual({
      id: 'pet-1',
      shelterId: 'shelter-a',
      status: 'draft',
      name: 'Becas',
      species: 'dog',
      locationLabel: 'Lisboa',
      shortDescription: 'Calmo e sociável.',
      mediaIds: ['media-1'],
      heroMediaId: 'media-1',
      medical: petRow.medical,
      publishedAt: null,
      createdAt: '2026-06-10T12:00:00.000Z',
      updatedAt: '2026-06-10T12:10:00.000Z',
    });
    const op = operations[0];
    expect(op?.table).toBe('pets');
    expect(op?.action).toBe('select');
    expect(op?.result).toBe('maybeSingle');
    expect(op?.filters).toContainEqual({ kind: 'eq', column: 'id', value: 'pet-1' });
    expect(op?.filters).toContainEqual({ kind: 'is', column: 'deleted_at', value: null });
  });

  it('selects created_at and updated_at columns', async () => {
    const { client, operations } = createFakeSupabaseClient({
      'pets:maybeSingle': { data: petRow, error: null },
    });
    const { petDraftRepository } = createSupabasePetRepositories({ client });

    await petDraftRepository.loadDraft('pet-1');

    const op = operations[0];
    expect(op?.columns).toContain('created_at');
    expect(op?.columns).toContain('updated_at');
  });

  it('falls back to epoch for missing created_at and updated_at', async () => {
    const rowWithoutTimestamps = { ...petRow, created_at: null, updated_at: null };
    const { client } = createFakeSupabaseClient({
      'pets:maybeSingle': { data: rowWithoutTimestamps, error: null },
    });
    const { petDraftRepository } = createSupabasePetRepositories({ client });

    const result = await petDraftRepository.loadDraft('pet-1');

    expect(result?.createdAt).toBe(new Date(0).toISOString());
    expect(result?.updatedAt).toBe(new Date(0).toISOString());
  });

  it('throws SupabasePetRepositoryError on Supabase error', async () => {
    const { client } = createFakeSupabaseClient({
      'pets:maybeSingle': { data: null, error: { message: 'DB error' } },
    });
    const { petDraftRepository } = createSupabasePetRepositories({ client });

    await expect(petDraftRepository.loadDraft('pet-1')).rejects.toBeInstanceOf(
      SupabasePetRepositoryError,
    );
  });
});
