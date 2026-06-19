import { describe, it, expect } from 'vitest';
import { createMobilePetPublishUi } from '../../apps/mobile/src/pet-publish';
import type { PetPublishClient } from '@pic4paws/client';

type PublishMock = Pick<PetPublishClient, 'publishPetDraft'>;

const samplePet = { petId: 'pet-001', petName: 'Bolinha' };

const makeClient = (ok: boolean): PublishMock => ({
  publishPetDraft: async () =>
    ok
      ? { ok: true as const, status: 'pet_published' as const, petId: 'pet-001', publishedAt: '2026-06-19T00:00:00.000Z' }
      : { ok: false as const, status: 'unauthenticated' as const, reasons: [] },
});

describe('pet publish screen — boundary contract', () => {
  it('produces published state on success', async () => {
    const ui = createMobilePetPublishUi({ publishClient: makeClient(true) });
    const result = await ui.publishPetDraft({ pet: samplePet });
    expect(result.state).toBe('published');
    if (result.state === 'published') {
      expect(result.petId).toBe('pet-001');
      expect(result.publishedAt).toBe('2026-06-19T00:00:00.000Z');
      expect(result.petName).toBe('Bolinha');
    }
  });

  it('produces failed state on error', async () => {
    const ui = createMobilePetPublishUi({ publishClient: makeClient(false) });
    const result = await ui.publishPetDraft({ pet: samplePet });
    expect(result.state).toBe('failed');
  });

  it('passes petId and petName to publishPetDraft', async () => {
    const seen: Array<{ petId: string }> = [];
    const trackingClient: PublishMock = {
      publishPetDraft: async (input) => {
        seen.push(input);
        return { ok: false as const, status: 'unauthenticated' as const, reasons: [] };
      },
    };
    const ui = createMobilePetPublishUi({ publishClient: trackingClient });
    await ui.publishPetDraft({ pet: { petId: 'pet-target', petName: 'Rex' } });
    expect(seen[0]).toMatchObject({ petId: 'pet-target' });
  });

  it('getInitialState returns ready with petName in title', () => {
    const ui = createMobilePetPublishUi({ publishClient: makeClient(true) });
    const state = ui.getInitialState(samplePet);
    expect(state.state).toBe('ready');
    expect(state.primaryAction).toBe('Publicar perfil');
    expect(state.petName).toBe('Bolinha');
    expect(state.title).toContain('Bolinha');
  });

  it('failed state does not expose bearer or service-role in reasons', async () => {
    const poisonClient: PublishMock = {
      publishPetDraft: async () => ({
        ok: false as const,
        status: 'unauthenticated' as const,
        reasons: ['Bearer eyJ...', 'service-role key leaked'],
      }),
    };
    const ui = createMobilePetPublishUi({ publishClient: poisonClient });
    const result = await ui.publishPetDraft({ pet: samplePet });
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
