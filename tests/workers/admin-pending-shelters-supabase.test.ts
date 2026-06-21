import { describe, expect, it, vi } from 'vitest';
import {
  createSupabaseAdminPendingSheltersRepositories,
  SupabaseAdminPendingSheltersRepositoryError,
} from '../../apps/workers/src/admin-pending-shelters-supabase';

const makeQueryChain = (result: unknown) => {
  const chain: Record<string, unknown> = {};
  for (const method of ['insert', 'update', 'in']) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain['select'] = vi.fn().mockReturnValue(chain);
  chain['eq'] = vi.fn().mockReturnValue(chain);
  chain['is'] = vi.fn().mockReturnValue(chain);
  chain['order'] = vi.fn().mockReturnValue(chain);
  chain['range'] = vi.fn().mockResolvedValue(result);
  chain['single'] = vi.fn().mockResolvedValue(result);
  chain['maybeSingle'] = vi.fn().mockResolvedValue(result);
  return chain;
};

const makeClient = (chain: ReturnType<typeof makeQueryChain>) => ({
  from: vi.fn().mockReturnValue(chain),
  rpc: vi.fn(),
});

describe('createSupabaseAdminPendingSheltersRepositories', () => {
  describe('listPendingShelters', () => {
    it('returns mapped pending shelters and total', async () => {
      const chain = makeQueryChain({
        data: [
          {
            id: 'shelter-a',
            name: 'Abrigo dos Amigos',
            slug: 'abrigo-dos-amigos',
            kind: 'shelter',
            verification_status: 'pending_review',
            city: 'Porto',
            district: 'Porto',
            country_code: 'PT',
            public_email: 'contacto@abrigo.pt',
            public_phone: '+351912345678',
            logo_media_id: null,
            created_at: '2026-06-01T10:00:00.000Z',
            updated_at: '2026-06-10T10:00:00.000Z',
          },
        ],
        error: null,
        count: 1,
      });
      const client = makeClient(chain);
      const { adminPendingSheltersRepository } =
        createSupabaseAdminPendingSheltersRepositories({ client });

      const result = await adminPendingSheltersRepository.listPendingShelters({
        limit: 20,
        offset: 0,
      });

      expect(result.total).toBe(1);
      expect(result.shelters).toEqual([
        {
          id: 'shelter-a',
          name: 'Abrigo dos Amigos',
          slug: 'abrigo-dos-amigos',
          kind: 'shelter',
          verificationStatus: 'pending_review',
          city: 'Porto',
          district: 'Porto',
          countryCode: 'PT',
          publicEmail: 'contacto@abrigo.pt',
          publicPhone: '+351912345678',
          logoMediaId: null,
          createdAt: '2026-06-01T10:00:00.000Z',
          updatedAt: '2026-06-10T10:00:00.000Z',
        },
      ]);
    });

    it('filters pending, non-deleted shelters and orders oldest review updates first', async () => {
      const chain = makeQueryChain({ data: [], error: null, count: 0 });
      const client = makeClient(chain);
      const { adminPendingSheltersRepository } =
        createSupabaseAdminPendingSheltersRepositories({ client });

      await adminPendingSheltersRepository.listPendingShelters({ limit: 10, offset: 20 });

      expect(client.from).toHaveBeenCalledWith('shelters');
      expect(chain.select).toHaveBeenCalledWith(
        'id,name,slug,kind,verification_status,city,district,country_code,public_email,public_phone,logo_media_id,created_at,updated_at',
        { count: 'exact' },
      );
      expect(chain.eq).toHaveBeenCalledWith('verification_status', 'pending_review');
      expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
      expect(chain.order).toHaveBeenCalledWith('updated_at', { ascending: true });
      expect(chain.range).toHaveBeenCalledWith(20, 29);
    });

    it('throws a sanitized repository error on Supabase failures', async () => {
      const chain = makeQueryChain({
        data: null,
        error: { message: 'service-role-secret Bearer token' },
        count: null,
      });
      const client = makeClient(chain);
      const { adminPendingSheltersRepository } =
        createSupabaseAdminPendingSheltersRepositories({ client });

      await expect(
        adminPendingSheltersRepository.listPendingShelters({ limit: 20, offset: 0 }),
      ).rejects.toEqual(
        new SupabaseAdminPendingSheltersRepositoryError('Failed to list pending shelters'),
      );
      await expect(
        adminPendingSheltersRepository.listPendingShelters({ limit: 20, offset: 0 }),
      ).rejects.not.toThrow(/service-role|bearer|token/i);
    });
  });
});
