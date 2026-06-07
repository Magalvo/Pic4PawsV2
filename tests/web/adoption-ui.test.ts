import { describe, expect, it } from 'vitest';
import {
  createWebAdoptionUi,
  webAdoptionUiContent,
} from '../../apps/web/src/adoption';
import { webFoundationContent } from '../../apps/web/src/foundation';
import type {
  AdoptionApplicationClient,
  AdoptionApplicationClientInput,
  AdoptionApplicationClientResult,
} from '../../packages/client/src/index';

const makeAdoptionClient = (
  result: AdoptionApplicationClientResult,
): Pick<AdoptionApplicationClient, 'submitApplication'> => ({
  submitApplication: async () => result,
});

const validInput: AdoptionApplicationClientInput = {
  petId: 'pet-pub-1',
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
  consentAcceptedAt: '2026-06-07T10:00:00.000Z',
};

describe('web adoption UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createWebAdoptionUi({
      adoptionApplicationClient: {
        submitApplication: async () => {
          throw new Error('should not be called');
        },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(webAdoptionUiContent.locale).toBe('pt-PT');
    expect(webAdoptionUiContent.status).toBe('product-flow-ready');
    expect(webAdoptionUiContent.states.map((s) => s.state)).toEqual([
      'idle',
      'submitting',
      'submitted',
      'pet_not_found',
      'failed',
    ]);
  });

  it('submitApplication with success returns submitted state with applicationId and submittedAt', async () => {
    const ui = createWebAdoptionUi({
      adoptionApplicationClient: makeAdoptionClient({
        ok: true,
        status: 'adoption_application_submitted',
        applicationId: 'app-001',
        petId: 'pet-pub-1',
        shelterId: 'shelter-a',
        submittedAt: '2026-06-07T10:00:00.000Z',
      }),
    });

    const state = await ui.submitApplication(validInput);

    expect(state.state).toBe('submitted');
    if (state.state === 'submitted') {
      expect(state.applicationId).toBe('app-001');
      expect(state.submittedAt).toBeTruthy();
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('submitApplication returns pet_not_found state when client returns pet_not_found', async () => {
    const ui = createWebAdoptionUi({
      adoptionApplicationClient: makeAdoptionClient({
        ok: false,
        status: 'pet_not_found',
        reasons: ['pet_not_found'],
      }),
    });

    const state = await ui.submitApplication(validInput);

    expect(state.state).toBe('pet_not_found');
    if (state.state === 'pet_not_found') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('submitApplication worker_request_failed returns failed state with canRetry', async () => {
    const ui = createWebAdoptionUi({
      adoptionApplicationClient: makeAdoptionClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.submitApplication(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
    }
  });

  it('submitApplication unauthenticated returns failed state', async () => {
    const ui = createWebAdoptionUi({
      adoptionApplicationClient: makeAdoptionClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });

    const state = await ui.submitApplication(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createWebAdoptionUi({
      adoptionApplicationClient: makeAdoptionClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'r2_secret key'],
      }),
    });

    const state = await ui.submitApplication(validInput);
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2_secret');
  });

  it('webAdoptionUiContent has pt-PT locale and all required states', () => {
    expect(webAdoptionUiContent.locale).toBe('pt-PT');
    expect(webAdoptionUiContent.status).toBe('product-flow-ready');

    const stateNames = webAdoptionUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('submitted');
    expect(stateNames).toContain('pet_not_found');
    expect(stateNames).toContain('failed');
  });

  it('web foundation content exposes adoptionApplication with product-flow-ready status', () => {
    expect(webFoundationContent.adoptionApplication.status).toBe('product-flow-ready');
    expect(webFoundationContent.adoptionApplication.title).toBeTruthy();
    expect(JSON.stringify(webFoundationContent.adoptionApplication)).not.toContain('service-role');
  });
});
