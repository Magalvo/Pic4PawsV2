import { describe, it, expect } from 'vitest';
import { createMobileAdoptionUi } from '../../apps/mobile/src/adoption';
import type {
  AdoptionApplicationClient,
  AdoptionApplicationClientResult,
} from '@pic4paws/client';

const makeClient = (
  result: AdoptionApplicationClientResult,
): Pick<AdoptionApplicationClient, 'submitApplication'> => ({
  submitApplication: async () => result,
});

const validInput = {
  petId: 'pet-001',
  applicantFullName: 'Ana Costa',
  applicantEmail: 'ana@example.com',
  applicantPhoneNumber: '912000000',
  applicantCity: 'Lisboa',
  housingType: 'apartment' as const,
  hasOutdoorSpace: false,
  hasChildren: false,
  hasOtherAnimals: false,
  previousPetExperience: 'Tive um cão durante 5 anos.',
  dailyRoutine: 'Trabalho em casa.',
  adoptionMotivation: 'Quero dar uma família a um animal.',
  dataProcessingAccepted: true as const,
  shelterContactAccepted: true as const,
  consentVersion: 'v1.0',
  consentAcceptedAt: '2026-06-17T00:00:00.000Z',
};

describe('adoption screen — boundary contract', () => {
  it('produces submitted state on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'adoption_application_submitted',
      applicationId: 'app-001',
      petId: 'pet-001',
      shelterId: 'shelter-001',
      submittedAt: '2026-06-17T00:00:00.000Z',
    });
    const ui = createMobileAdoptionUi({ adoptionApplicationClient: client });
    const result = await ui.submitApplication(validInput);
    expect(result.state).toBe('submitted');
  });

  it('produces pet_not_found state when pet is not found', async () => {
    const client = makeClient({
      ok: false,
      status: 'pet_not_found',
      reasons: [],
    });
    const ui = createMobileAdoptionUi({ adoptionApplicationClient: client });
    const result = await ui.submitApplication(validInput);
    expect(result.state).toBe('pet_not_found');
  });

  it('produces failed state with unauthenticated status', async () => {
    const client = makeClient({
      ok: false,
      status: 'unauthenticated',
      reasons: [],
    });
    const ui = createMobileAdoptionUi({ adoptionApplicationClient: client });
    const result = await ui.submitApplication(validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['network_error'],
    });
    const ui = createMobileAdoptionUi({ adoptionApplicationClient: client });
    const result = await ui.submitApplication(validInput);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('worker_request_failed');
    }
  });

  it('getInitialState returns idle state with PT-PT copy', () => {
    const client = makeClient({
      ok: true,
      status: 'adoption_application_submitted',
      applicationId: 'app-001',
      petId: 'pet-001',
      shelterId: 'shelter-001',
      submittedAt: '2026-06-17T00:00:00.000Z',
    });
    const ui = createMobileAdoptionUi({ adoptionApplicationClient: client });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.message).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
  });

  it('passes all input fields to the client', async () => {
    const seen: typeof validInput[] = [];
    const trackingClient: Pick<AdoptionApplicationClient, 'submitApplication'> = {
      submitApplication: async (input) => {
        seen.push(input as typeof validInput);
        return {
          ok: true,
          status: 'adoption_application_submitted',
          applicationId: 'app-001',
          petId: 'pet-001',
          shelterId: 'shelter-001',
          submittedAt: '2026-06-17T00:00:00.000Z',
        };
      },
    };
    const ui = createMobileAdoptionUi({ adoptionApplicationClient: trackingClient });
    await ui.submitApplication(validInput);
    expect(seen[0]?.petId).toBe('pet-001');
    expect(seen[0]?.applicantFullName).toBe('Ana Costa');
  });
});
