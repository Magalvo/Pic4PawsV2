import { describe, expect, it, vi } from 'vitest';
import {
  createMobileShelterPetListUi,
  mobileShelterPetListUiContent,
} from '../../apps/mobile/src/shelter-pet-list';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  ShelterPetListClient,
  ShelterPetListClientResult,
  ShelterPetClientSummary,
} from '../../packages/client/src/index';

const makePet = (overrides: Partial<ShelterPetClientSummary> = {}): ShelterPetClientSummary => ({
  petId: 'pet-1',
  name: 'Becas',
  species: 'dog',
  status: 'draft',
  heroMediaId: null,
  locationLabel: 'Lisboa',
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-10T12:00:00.000Z',
  ...overrides,
});

const makeClient = (
  result: ShelterPetListClientResult,
): Pick<ShelterPetListClient, 'loadShelterPets'> => ({
  loadShelterPets: vi.fn().mockResolvedValue(result),
});

describe('mobileShelterPetListUiContent', () => {
  it('has pt-PT locale and product-flow-ready status', () => {
    expect(mobileShelterPetListUiContent.locale).toBe('pt-PT');
    expect(mobileShelterPetListUiContent.status).toBe('product-flow-ready');
  });

  it('has all 6 states defined', () => {
    const stateNames = mobileShelterPetListUiContent.states.map((s) => s.state);
    expect(stateNames).toEqual(['idle', 'loading', 'loaded', 'empty', 'forbidden', 'failed']);
  });

  it('does not expose credentials in content', () => {
    const content = JSON.stringify(mobileShelterPetListUiContent);
    expect(content).not.toContain('service-role');
    expect(content).not.toContain('bearer ');
  });
});

describe('createMobileShelterPetListUi — getInitialState', () => {
  it('returns idle state', () => {
    const ui = createMobileShelterPetListUi({
      shelterPetListClient: makeClient({ ok: true, status: 'ok', pets: [], total: 0 }),
    });
    expect(ui.getInitialState().state).toBe('idle');
    expect(ui.getInitialState().title).toBeTruthy();
  });
});

describe('createMobileShelterPetListUi — loadShelterPets', () => {
  it('returns loaded state with pets on success', async () => {
    const pet = makePet();
    const ui = createMobileShelterPetListUi({
      shelterPetListClient: makeClient({ ok: true, status: 'ok', pets: [pet], total: 1 }),
    });

    const state = await ui.loadShelterPets('shelter-a');

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.pets).toHaveLength(1);
      expect(state.total).toBe(1);
    }
  });

  it('returns empty state when no pets exist', async () => {
    const ui = createMobileShelterPetListUi({
      shelterPetListClient: makeClient({ ok: true, status: 'ok', pets: [], total: 0 }),
    });

    const state = await ui.loadShelterPets('shelter-a');
    expect(state.state).toBe('empty');
  });

  it('returns forbidden state on forbidden result', async () => {
    const ui = createMobileShelterPetListUi({
      shelterPetListClient: makeClient({
        ok: false,
        status: 'forbidden',
        reasons: ['not_a_member'],
      }),
    });

    const state = await ui.loadShelterPets('shelter-a');

    expect(state.state).toBe('forbidden');
    if (state.state === 'forbidden') {
      expect(state.message).toBeTruthy();
    }
  });

  it('returns failed state on worker_request_failed', async () => {
    const ui = createMobileShelterPetListUi({
      shelterPetListClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadShelterPets('shelter-a');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.canRetry).toBe(true);
    }
  });

  it('sanitizes reasons — service-role and bearer absent from failed state', async () => {
    const ui = createMobileShelterPetListUi({
      shelterPetListClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    });

    const state = await ui.loadShelterPets('shelter-a');
    const serialized = JSON.stringify(state);

    expect(state.state).toBe('failed');
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer abc123');
  });
});

describe('mobile foundation content', () => {
  it('exposes shelterPetList entry with product-flow-ready status', () => {
    expect(mobileFoundationContent.shelterPetList.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.shelterPetList.title).toBeTruthy();
  });

  it('shelterPetList entry does not expose credentials', () => {
    const content = JSON.stringify(mobileFoundationContent.shelterPetList);
    expect(content).not.toContain('service-role');
    expect(content).not.toContain('bearer ');
  });
});
