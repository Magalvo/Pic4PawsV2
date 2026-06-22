import { describe, expect, it, vi } from 'vitest';
import {
  createSupabasePushTokenRepositories,
  SupabasePushTokenRepositoryError,
} from '../../apps/workers/src/push-token-supabase';
import type { SupabaseClientLike } from '../../apps/workers/src/pet-supabase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeQuery = (overrides: Record<string, unknown> = {}) => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: vi.fn((resolve: (v: unknown) => unknown) => resolve({ data: null, error: null })),
  ...overrides,
});

const makeClient = (queryOverrides: Record<string, unknown> = {}): SupabaseClientLike => ({
  from: vi.fn().mockReturnValue(makeQuery(queryOverrides)),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
});

// ─── upsertPushToken ─────────────────────────────────────────────────────────

describe('createSupabasePushTokenRepositories — upsertPushToken', () => {
  it('calls upsert on push_tokens table with correct fields', async () => {
    const client = makeClient();
    const { pushTokenRepository } = createSupabasePushTokenRepositories({ client });

    await pushTokenRepository.upsertPushToken('user-001', 'ExponentPushToken[abc]', 'expo');

    expect(client.from).toHaveBeenCalledWith('push_tokens');
    const query = (client.from as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(query.upsert).toHaveBeenCalledWith(
      { user_id: 'user-001', token: 'ExponentPushToken[abc]', platform: 'expo' },
      { onConflict: 'user_id,token' },
    );
  });

  it('throws SupabasePushTokenRepositoryError on Supabase error', async () => {
    const errorQuery = makeQuery({
      then: vi.fn((resolve: (v: unknown) => unknown) =>
        resolve({ data: null, error: { message: 'db error' } }),
      ),
    });
    const client: SupabaseClientLike = {
      from: vi.fn().mockReturnValue(errorQuery),
      rpc: vi.fn(),
    };
    const { pushTokenRepository } = createSupabasePushTokenRepositories({ client });

    await expect(
      pushTokenRepository.upsertPushToken('user-001', 'tok', 'expo'),
    ).rejects.toThrow(SupabasePushTokenRepositoryError);
  });
});

// ─── deletePushToken ─────────────────────────────────────────────────────────

describe('createSupabasePushTokenRepositories — deletePushToken', () => {
  it('calls delete+eq on push_tokens and returns true when row deleted', async () => {
    const deletedRow = [{ id: 'pt-001' }];
    const queryChain = makeQuery({
      then: vi.fn((resolve: (v: unknown) => unknown) =>
        resolve({ data: deletedRow, error: null }),
      ),
    });
    const client: SupabaseClientLike = {
      from: vi.fn().mockReturnValue(queryChain),
      rpc: vi.fn(),
    };
    const { pushTokenRepository } = createSupabasePushTokenRepositories({ client });

    const result = await pushTokenRepository.deletePushToken('user-001', 'tok-abc');

    expect(result).toBe(true);
    expect(client.from).toHaveBeenCalledWith('push_tokens');
    expect(queryChain.delete).toHaveBeenCalled();
    expect(queryChain.eq).toHaveBeenCalledWith('user_id', 'user-001');
    expect(queryChain.eq).toHaveBeenCalledWith('token', 'tok-abc');
  });

  it('returns false when no row matched (token not found)', async () => {
    const queryChain = makeQuery({
      then: vi.fn((resolve: (v: unknown) => unknown) =>
        resolve({ data: [], error: null }),
      ),
    });
    const client: SupabaseClientLike = {
      from: vi.fn().mockReturnValue(queryChain),
      rpc: vi.fn(),
    };
    const { pushTokenRepository } = createSupabasePushTokenRepositories({ client });

    const result = await pushTokenRepository.deletePushToken('user-001', 'unknown-tok');
    expect(result).toBe(false);
  });

  it('throws SupabasePushTokenRepositoryError on Supabase error', async () => {
    const queryChain = makeQuery({
      then: vi.fn((resolve: (v: unknown) => unknown) =>
        resolve({ data: null, error: { message: 'db error' } }),
      ),
    });
    const client: SupabaseClientLike = {
      from: vi.fn().mockReturnValue(queryChain),
      rpc: vi.fn(),
    };
    const { pushTokenRepository } = createSupabasePushTokenRepositories({ client });

    await expect(
      pushTokenRepository.deletePushToken('user-001', 'tok'),
    ).rejects.toThrow(SupabasePushTokenRepositoryError);
  });
});
