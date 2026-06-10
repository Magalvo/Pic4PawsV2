import { describe, expect, it } from 'vitest';
import {
  createMobilePetArchiveUi,
  mobilePetArchiveUiContent,
} from '../../apps/mobile/src/pet-archive';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
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

describe('mobile pet archive UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createMobilePetArchiveUi({
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
    expect(mobilePetArchiveUiContent.locale).toBe('pt-PT');
    expect(mobilePetArchiveUiContent.status).toBe('product-flow-ready');
  });

  it('mobilePetArchiveUiContent has all 5 required states', () => {
    const stateNames = mobilePetArchiveUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('submitting');
    expect(stateNames).toContain('archived');
    expect(stateNames).toContain('published');
    expect(stateNames).toContain('failed');
    expect(stateNames).toHaveLength(5);
  });

  it('archivePet success returns archived state with petId', async () => {
    const ui = createMobilePetArchiveUi({
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
    const ui = createMobilePetArchiveUi({
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
    const ui = createMobilePetArchiveUi({
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
    const ui = createMobilePetArchiveUi({
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
    const ui = createMobilePetArchiveUi({
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

  it('archivePet pet_archive_repository_not_configured returns failed state', async () => {
    const ui = createMobilePetArchiveUi({
      petArchiveClient: makeClient({
        ok: false,
        status: 'pet_archive_repository_not_configured',
        reasons: ['pet_archive_repository_not_configured'],
      }),
    });

    const state = await ui.archivePet('pet-001');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('pet_archive_repository_not_configured');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createMobilePetArchiveUi({
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

  it('mobilePetArchiveUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(mobilePetArchiveUiContent.locale).toBe('pt-PT');
    expect(mobilePetArchiveUiContent.status).toBe('product-flow-ready');
    expect(mobilePetArchiveUiContent.title).toBeTruthy();
    expect(mobilePetArchiveUiContent.description).toBeTruthy();
  });

  it('mobile foundation content exposes petArchive with product-flow-ready status', () => {
    expect(mobileFoundationContent.petArchive.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.petArchive.title).toBeTruthy();
    expect(mobileFoundationContent.petArchive.description).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.petArchive)).not.toContain('service-role');
  });

  it('archivePet success with different petId returns archived state matching petId', async () => {
    const ui = createMobilePetArchiveUi({
      petArchiveClient: makeClient({ ok: true, status: 'ok', petId: 'pet-xyz' }),
    });

    const state = await ui.archivePet('pet-xyz');

    expect(state.state).toBe('archived');
    if (state.state === 'archived') {
      expect(state.petId).toBe('pet-xyz');
    }
  });
});

describe('mobile pet archive UI — republishPet', () => {
  it('republishPet success returns published state with petId', async () => {
    const ui = createMobilePetArchiveUi({
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
    const ui = createMobilePetArchiveUi({
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
    const ui = createMobilePetArchiveUi({
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

  it('mobilePetArchiveUiContent states includes published state', () => {
    const stateNames = mobilePetArchiveUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('published');
  });
});
