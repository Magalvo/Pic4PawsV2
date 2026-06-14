import { describe, it, expect } from 'vitest';
import { createWebAdoptionUi } from '../../apps/web/src/adoption';
import type {
  AdoptionApplicationClient,
  AdoptionApplicationClientInput,
  AdoptionApplicationClientResult,
} from '@pic4paws/client';

const makeClient = (
  result: AdoptionApplicationClientResult,
): Pick<AdoptionApplicationClient, 'submitApplication'> => ({
  submitApplication: async () => result,
});

const validInput: AdoptionApplicationClientInput = {
  petId: 'pet-abc',
  applicantFullName: 'Maria Silva',
  applicantEmail: 'maria@example.pt',
  applicantPhoneNumber: '+351912345678',
  applicantCity: 'Lisboa',
  housingType: 'apartment',
  hasOutdoorSpace: false,
  hasChildren: false,
  hasOtherAnimals: false,
  previousPetExperience: 'Tive um gato.',
  dailyRoutine: 'Trabalho de casa.',
  adoptionMotivation: 'Quero adotar.',
  dataProcessingAccepted: true,
  shelterContactAccepted: true,
  consentVersion: 'v1.0',
  consentAcceptedAt: '2026-06-14T00:00:00.000Z',
};

describe('adoption page — boundary contract', () => {
  it('produces failed state when client returns unauthenticated', async () => {
    const client = makeClient({
      ok: false,
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });
    const ui = createWebAdoptionUi({ adoptionApplicationClient: client });
    const result = await ui.submitApplication(validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('unauthenticated');
      expect(result.canRetry).toBe(true);
    }
  });

  it('produces submitted state on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'adoption_application_submitted',
      applicationId: 'app-xyz',
      submittedAt: '2026-06-14T00:00:00.000Z',
      petId: 'pet-abc',
      shelterId: 'shelter-001',
    });
    const ui = createWebAdoptionUi({ adoptionApplicationClient: client });
    const result = await ui.submitApplication(validInput);
    expect(result.state).toBe('submitted');
    if (result.state === 'submitted') {
      expect(result.applicationId).toBe('app-xyz');
    }
  });

  it('passes petId from input to the client', async () => {
    const seen: string[] = [];
    const trackingClient: Pick<AdoptionApplicationClient, 'submitApplication'> = {
      submitApplication: async (input) => {
        seen.push(input.petId);
        return { ok: false, status: 'unauthenticated', reasons: [] };
      },
    };
    const ui = createWebAdoptionUi({ adoptionApplicationClient: trackingClient });
    await ui.submitApplication({ ...validInput, petId: 'pet-target-001' });
    expect(seen).toEqual(['pet-target-001']);
  });
});
