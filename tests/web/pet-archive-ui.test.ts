import { describe, expect, it } from 'vitest';
import {
  createWebPetArchiveUi,
  webPetArchiveUiContent,
} from '../../apps/web/src/pet-archive';
import { webFoundationContent } from '../../apps/web/src/foundation';
import type {
  PetArchiveClient,
  PetArchiveClientResult,
  PetRepublishClientResult,
} from '../../packages/client/src/index';

const makeClient = (
  archiveResult: PetArchiveClientResult,
  republishResult: PetRepublishClientResult = { ok: true, status: 'ok', petId: 'pet-001' },
): Pick<PetArchiveClient, 'archivePet' | 'republishPet'> => ({
  archivePet: async () => archiveResult,
  republishPet: async () => republishResult,
});

describe('web pet archive UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createWebPetArchiveUi({
      petArchiveClient: {
        archivePet: async () => { throw new Error('should not be called'); },
        republishPet: async () => { throw new Error('should not be called'); },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.message).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(webPetArchiveUiContent.locale).toBe('pt-PT');
    expect(webPetArchiveUiContent.status).toBe('product-flow-ready');
  });

  it('webPetArchiveUiContent has all 5 required states', () => {
    const stateNames = webPetArchiveUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('submitting');
    expect(stateNames).toContain('archived');
    expect(stateNames).toContain('published');
    expect(stateNames).toContain('failed');
    expect(stateNames).toHaveLength(5);
  });

  it('archivePet success returns archived state with petId', async () => {
    const ui = createWebPetArchiveUi({
      petArchiveClient: makeClient({ ok: true, status: 'ok', petId: 'pet-001' }),
    });

    const state = await ui.archivePet('pet-001');

    expect(state.state).toBe('archived');
    if (state.state === 'archived') {
      expect(state.petId).toBe('pet-001');
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('archivePet worker_request_failed returns failed state with canRetry', async () => {
    const ui = createWebPetArchiveUi({
      petArchiveClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.archivePet('pet-001');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('archivePet forbidden returns failed state', async () => {
    const ui = createWebPetArchiveUi({
      petArchiveClient: makeClient({
        ok: false,
        status: 'forbidden',
        reasons: ['forbidden'],
      }),
    });

    const state = await ui.archivePet('pet-001');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('forbidden');
    }
  });

  it('archivePet pet_not_found returns failed state', async () => {
    const ui = createWebPetArchiveUi({
      petArchiveClient: makeClient({
        ok: false,
        status: 'pet_not_found',
        reasons: ['pet_not_found'],
      }),
    });

    const state = await ui.archivePet('pet-404');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('pet_not_found');
    }
  });

  it('archivePet pet_already_archived returns failed state', async () => {
    const ui = createWebPetArchiveUi({
      petArchiveClient: makeClient({
        ok: false,
        status: 'pet_already_archived',
        reasons: ['pet_already_archived'],
      }),
    });

    const state = await ui.archivePet('pet-001');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('pet_already_archived');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createWebPetArchiveUi({
      petArchiveClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    });

    const state = await ui.archivePet('pet-001');
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('webPetArchiveUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(webPetArchiveUiContent.locale).toBe('pt-PT');
    expect(webPetArchiveUiContent.status).toBe('product-flow-ready');
    expect(webPetArchiveUiContent.title).toBeTruthy();
    expect(webPetArchiveUiContent.description).toBeTruthy();
  });

  it('web foundation content exposes petArchive with product-flow-ready status', () => {
    expect(webFoundationContent.petArchive.status).toBe('product-flow-ready');
    expect(webFoundationContent.petArchive.title).toBeTruthy();
    expect(webFoundationContent.petArchive.description).toBeTruthy();
    expect(JSON.stringify(webFoundationContent.petArchive)).not.toContain('service-role');
  });
});

describe('web pet archive UI — republishPet', () => {
  it('republishPet success returns published state with petId', async () => {
    const ui = createWebPetArchiveUi({
      petArchiveClient: makeClient(
        { ok: true, status: 'ok', petId: 'pet-001' },
        { ok: true, status: 'ok', petId: 'pet-001' },
      ),
    });

    const state = await ui.republishPet('pet-001');

    expect(state.state).toBe('published');
    if (state.state === 'published') {
      expect(state.petId).toBe('pet-001');
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('republishPet pet_not_archived returns failed state', async () => {
    const ui = createWebPetArchiveUi({
      petArchiveClient: makeClient(
        { ok: true, status: 'ok', petId: 'pet-001' },
        { ok: false, status: 'pet_not_archived', reasons: ['pet_not_archived'] },
      ),
    });

    const state = await ui.republishPet('pet-001');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('pet_not_archived');
      expect(state.canRetry).toBe(true);
    }
  });

  it('republishPet worker_request_failed returns failed state with canRetry', async () => {
    const ui = createWebPetArchiveUi({
      petArchiveClient: makeClient(
        { ok: true, status: 'ok', petId: 'pet-001' },
        { ok: false, status: 'worker_request_failed', reasons: ['network_error'] },
      ),
    });

    const state = await ui.republishPet('pet-001');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
    }
  });

  it('webPetArchiveUiContent states includes published state', () => {
    const stateNames = webPetArchiveUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('published');
  });
});
