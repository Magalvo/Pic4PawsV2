import { describe, it, expect } from 'vitest';
import { createMobilePetArchiveUi } from '../../apps/mobile/src/pet-archive';
import type { PetArchiveClient } from '@pic4paws/client';

type ArchiveMock = Pick<PetArchiveClient, 'archivePet' | 'republishPet'>;

const makeClient = (ok: boolean, petId = 'pet-001'): ArchiveMock => ({
  archivePet: async () =>
    ok
      ? { ok: true as const, status: 'ok' as const, petId }
      : { ok: false as const, status: 'unauthenticated' as const, reasons: [] },
  republishPet: async () => ({ ok: true as const, status: 'ok' as const, petId }),
});

describe('pet archive screen — boundary contract', () => {
  it('produces archived state on success', async () => {
    const ui = createMobilePetArchiveUi({ petArchiveClient: makeClient(true) });
    const result = await ui.archivePet('pet-001');
    expect(result.state).toBe('archived');
    if (result.state === 'archived') {
      expect(result.petId).toBe('pet-001');
    }
  });

  it('produces failed state on archive error', async () => {
    const ui = createMobilePetArchiveUi({ petArchiveClient: makeClient(false) });
    const result = await ui.archivePet('pet-001');
    expect(result.state).toBe('failed');
  });

  it('passes petId to archivePet', async () => {
    const seen: string[] = [];
    const trackingClient: ArchiveMock = {
      archivePet: async (id) => {
        seen.push(id);
        return { ok: false as const, status: 'unauthenticated' as const, reasons: [] };
      },
      republishPet: async (id) => ({ ok: true as const, status: 'ok' as const, petId: id }),
    };
    const ui = createMobilePetArchiveUi({ petArchiveClient: trackingClient });
    await ui.archivePet('pet-target');
    expect(seen).toEqual(['pet-target']);
  });

  it('getInitialState returns idle', () => {
    const ui = createMobilePetArchiveUi({ petArchiveClient: makeClient(true) });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.primaryAction).toBe('Arquivar');
  });

  it('failed state does not expose bearer or service-role in reasons', async () => {
    const poisonClient: ArchiveMock = {
      archivePet: async () => ({
        ok: false as const,
        status: 'unauthenticated' as const,
        reasons: ['Bearer eyJ...', 'service-role key leaked'],
      }),
      republishPet: async (id) => ({ ok: true as const, status: 'ok' as const, petId: id }),
    };
    const ui = createMobilePetArchiveUi({ petArchiveClient: poisonClient });
    const result = await ui.archivePet('pet-001');
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
