import { describe, expect, it, vi } from 'vitest';
import { createSupabaseAdoptionListRepositories } from '../../apps/workers/src/adoption-list-supabase';

const makeQueryChain = (result: unknown) => {
  const chain: Record<string, unknown> = {};
  const methods = ['insert', 'update', 'in'];
  for (const method of methods) {
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

describe('createSupabaseAdoptionListRepositories', () => {
  describe('listApplications', () => {
    it('returns mapped applications and total for the given shelterId', async () => {
      const chain = makeQueryChain({
        data: [
          {
            id: 'app-001',
            pet_id: 'pet-pub-1',
            applicant_user_id: 'user-adopter-1',
            applicant_full_name: 'Maria Silva',
            applicant_email: 'maria@example.pt',
            applicant_city: 'Lisboa',
            status: 'submitted',
            submitted_at: '2026-06-07T10:00:00.000Z',
          },
        ],
        error: null,
        count: 1,
      });
      const client = makeClient(chain);
      const { adoptionListRepository } = createSupabaseAdoptionListRepositories({ client });

      const result = await adoptionListRepository.listApplications({
        shelterId: 'shelter-a',
        limit: 20,
        offset: 0,
      });

      expect(result.total).toBe(1);
      expect(result.applications).toHaveLength(1);
      expect(result.applications[0]).toEqual({
        applicationId: 'app-001',
        petId: 'pet-pub-1',
        applicantUserId: 'user-adopter-1',
        applicantFullName: 'Maria Silva',
        applicantEmail: 'maria@example.pt',
        applicantCity: 'Lisboa',
        status: 'submitted',
        submittedAt: '2026-06-07T10:00:00.000Z',
      });
      expect(client.from).toHaveBeenCalledWith('adoption_applications');
      expect(chain.eq).toHaveBeenCalledWith('shelter_id', 'shelter-a');
      expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('returns empty applications and zero total when none exist', async () => {
      const chain = makeQueryChain({ data: [], error: null, count: 0 });
      const client = makeClient(chain);
      const { adoptionListRepository } = createSupabaseAdoptionListRepositories({ client });

      const result = await adoptionListRepository.listApplications({ shelterId: 'shelter-b' });

      expect(result.total).toBe(0);
      expect(result.applications).toEqual([]);
    });

    it('applies limit and offset via range and orders by submitted_at descending', async () => {
      const chain = makeQueryChain({ data: [], error: null, count: 100 });
      const client = makeClient(chain);
      const { adoptionListRepository } = createSupabaseAdoptionListRepositories({ client });

      await adoptionListRepository.listApplications({
        shelterId: 'shelter-a',
        limit: 10,
        offset: 30,
      });

      expect(chain.range).toHaveBeenCalledWith(30, 39);
      expect(chain.order).toHaveBeenCalledWith('submitted_at', { ascending: false });
    });
  });
});
