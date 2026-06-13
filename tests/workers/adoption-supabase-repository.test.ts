import { describe, expect, it, vi } from 'vitest';
import { createSupabaseAdoptionRepositories } from '../../apps/workers/src/adoption-supabase';
import type { CreateAdoptionApplicationInput } from '../../apps/workers/src/adoption';

const makeQueryChain = (result: unknown) => {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'eq', 'is'];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain['single'] = vi.fn().mockResolvedValue(result);
  chain['maybeSingle'] = vi.fn().mockResolvedValue(result);
  return chain;
};

const makeClient = (chain: ReturnType<typeof makeQueryChain>) => ({
  from: vi.fn().mockReturnValue(chain),
  rpc: vi.fn(),
});

describe('createSupabaseAdoptionRepositories', () => {
  describe('loadPetForApplication', () => {
    it('returns petId and shelterId when pet is published and not deleted', async () => {
      const chain = makeQueryChain({
        data: { id: 'pet-pub-1', shelter_id: 'shelter-a' },
        error: null,
      });
      const client = makeClient(chain);
      const { adoptionRepository } = createSupabaseAdoptionRepositories({ client });

      const result = await adoptionRepository.loadPetForApplication('pet-pub-1');

      expect(result).toEqual({ petId: 'pet-pub-1', shelterId: 'shelter-a' });
      expect(client.from).toHaveBeenCalledWith('pets');
      expect(chain.select).toHaveBeenCalledWith('id,shelter_id');
      expect(chain.eq).toHaveBeenCalledWith('id', 'pet-pub-1');
      expect(chain.eq).toHaveBeenCalledWith('status', 'published');
      expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('returns null when the pet is not found or not published', async () => {
      const chain = makeQueryChain({ data: null, error: null });
      const client = makeClient(chain);
      const { adoptionRepository } = createSupabaseAdoptionRepositories({ client });

      const result = await adoptionRepository.loadPetForApplication('unknown-pet');

      expect(result).toBeNull();
    });
  });

  describe('createApplication', () => {
    it('inserts the application row and returns applicationId and submittedAt', async () => {
      const chain = makeQueryChain({
        data: { id: 'app-001', submitted_at: '2026-06-07T10:00:00.000Z' },
        error: null,
      });
      const client = makeClient(chain);
      const { adoptionRepository } = createSupabaseAdoptionRepositories({ client });

      const input: CreateAdoptionApplicationInput = {
        petId: 'pet-pub-1',
        shelterId: 'shelter-a',
        applicantUserId: 'user-1',
        status: 'submitted',
        submittedAt: '2026-06-07T10:00:00.000Z',
        applicantFullName: 'Maria Silva',
        applicantEmail: 'maria@example.pt',
        applicantPhoneNumber: '+351912345678',
        applicantCity: 'Lisboa',
        applicantDistrict: 'Lisboa',
        applicantPostalCode: '1000-001',
        housingType: 'apartment',
        hasOutdoorSpace: false,
        hasChildren: false,
        hasOtherAnimals: false,
        otherAnimalsDescription: null,
        previousPetExperience: 'Tive um gato durante 5 anos.',
        dailyRoutine: 'Trabalho de casa.',
        adoptionMotivation: 'Quero dar um lar.',
        veterinarianContact: null,
        dataProcessingAccepted: true,
        shelterContactAccepted: true,
        consentVersion: 'v1.0',
        consentAcceptedAt: '2026-06-07T10:00:00.000Z',
      };

      const result = await adoptionRepository.createApplication(input);

      expect(result).toEqual({
        applicationId: 'app-001',
        submittedAt: '2026-06-07T10:00:00.000Z',
      });
      expect(client.from).toHaveBeenCalledWith('adoption_applications');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          pet_id: 'pet-pub-1',
          shelter_id: 'shelter-a',
          applicant_user_id: 'user-1',
          status: 'submitted',
          submitted_at: '2026-06-07T10:00:00.000Z',
          applicant_full_name: 'Maria Silva',
          applicant_email: 'maria@example.pt',
          housing_type: 'apartment',
          data_processing_accepted: true,
        }),
      );
      expect(chain.select).toHaveBeenCalledWith('id,submitted_at');
    });
  });
});
