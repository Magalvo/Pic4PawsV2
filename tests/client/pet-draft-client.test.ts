import { describe, expect, it } from 'vitest';
import { createPetDraftClient } from '../../packages/client/src/index';

type FetchCall = {
  url: string;
  init: RequestInit;
};

const validDraft = {
  petId: 'pet-1',
  shelterId: 'shelter-a',
  name: 'Becas',
  species: 'dog',
  locationLabel: 'Lisboa',
  shortDescription: 'Calmo, sociável e pronto para uma família.',
  mediaIds: ['media-1'] as string[],
  heroMediaId: 'media-1',
  medical: {
    vaccinated: true,
    sterilized: true,
    microchipped: true,
    specialNeeds: false,
  },
} as const;

const createJsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init.headers,
    },
  });

const createTextResponse = (body: string, init: ResponseInit = {}) => new Response(body, init);

describe('pet draft client contract', () => {
  it('creates pet drafts through the Worker with sanitized payload', async () => {
    const calls: FetchCall[] = [];
    const client = createPetDraftClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'user-access-token',
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });

        return createJsonResponse({
          status: 'pet_draft_created',
          petId: 'pet-1',
          debug: 'service-role-secret r2-secret-key user-access-token',
        }, { status: 201 });
      },
    });

    await expect(
      client.createPetDraft({
        ...validDraft,
        status: 'published',
        publishedAt: '2026-06-04T15:00:00.000Z',
        serviceRoleKey: 'service-role-secret',
      } as typeof validDraft & Record<string, unknown>),
    ).resolves.toEqual({
      ok: true,
      status: 'pet_draft_created',
      petId: 'pet-1',
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: 'https://worker.pic4paws.pt/pets/drafts',
      init: {
        method: 'POST',
        headers: {
          Authorization: 'Bearer user-access-token',
          'Content-Type': 'application/json',
        },
      },
    });
    expect(JSON.parse(calls[0]?.init.body as string)).toEqual(validDraft);
    expect(calls[0]?.init.body).not.toContain('published');
    expect(calls[0]?.init.body).not.toContain('service-role-secret');
  });

  it('updates pet drafts through the Worker with sanitized payload', async () => {
    const calls: FetchCall[] = [];
    const client = createPetDraftClient({
      workerBaseUrl: 'https://worker.pic4paws.pt/',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'user-access-token',
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });

        return createJsonResponse({
          status: 'pet_draft_updated',
          petId: 'pet-1',
        });
      },
    });

    await expect(client.updatePetDraft(validDraft)).resolves.toEqual({
      ok: true,
      status: 'pet_draft_updated',
      petId: 'pet-1',
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: 'https://worker.pic4paws.pt/pets/drafts/pet-1',
      init: {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer user-access-token',
          'Content-Type': 'application/json',
        },
      },
    });
    expect(JSON.parse(calls[0]?.init.body as string)).toEqual(validDraft);
  });

  it('rejects missing bearer tokens before making network requests', async () => {
    let fetchCalled = false;
    const client = createPetDraftClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => null,
      fetch: async () => {
        fetchCalled = true;

        return createJsonResponse({});
      },
    });

    await expect(client.createPetDraft(validDraft)).resolves.toEqual({
      ok: false,
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });
    await expect(client.updatePetDraft(validDraft)).resolves.toEqual({
      ok: false,
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });
    expect(fetchCalled).toBe(false);
  });

  it('normalizes Worker failures without leaking bearer tokens or provider secrets', async () => {
    const client = createPetDraftClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'user-access-token',
      fetch: async () =>
        createJsonResponse(
          {
            status: 'invalid_pet_draft',
            reasons: [
              'media_asset_missing',
              'service-role-secret',
              'r2-secret-key',
              'user-access-token',
              'bearer user-token-marker',
            ],
          },
          { status: 400 },
        ),
    });

    const result = await client.createPetDraft(validDraft);

    expect(result).toEqual({
      ok: false,
      status: 'invalid_pet_draft',
      reasons: ['media_asset_missing'],
    });
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
    expect(JSON.stringify(result)).not.toContain('user-access-token');
    expect(JSON.stringify(result)).not.toContain('user-token-marker');
  });

  it('maps explicit Worker statuses and malformed responses to safe client failures', async () => {
    const makeClient = (response: Response) =>
      createPetDraftClient({
        workerBaseUrl: 'https://worker.pic4paws.pt',
        petDraftsPath: '/pets/drafts',
        getAccessToken: async () => 'user-access-token',
        fetch: async () => response,
      });

    await expect(
      makeClient(
        createJsonResponse(
          {
            status: 'actor_not_authorized',
            reasons: ['actor_not_authorized'],
          },
          { status: 403 },
        ),
      ).createPetDraft(validDraft),
    ).resolves.toEqual({
      ok: false,
      status: 'actor_not_authorized',
      reasons: ['actor_not_authorized'],
    });

    await expect(
      makeClient(createJsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 })).createPetDraft(
        validDraft,
      ),
    ).resolves.toEqual({
      ok: false,
      status: 'auth_adapter_not_configured',
      reasons: ['auth_adapter_not_configured'],
    });

    await expect(
      makeClient(createJsonResponse({ status: 'pet_draft_repository_not_configured' }, { status: 501 })).updatePetDraft(
        validDraft,
      ),
    ).resolves.toEqual({
      ok: false,
      status: 'pet_draft_repository_not_configured',
      reasons: ['pet_draft_repository_not_configured'],
    });

    await expect(
      makeClient(createJsonResponse({ status: 'pet_draft_created' })).createPetDraft(validDraft),
    ).resolves.toEqual({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['invalid_worker_response'],
    });

    await expect(
      makeClient(createTextResponse('service-role-secret r2-secret-key', { status: 502 })).updatePetDraft(
        validDraft,
      ),
    ).resolves.toEqual({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['worker_request_failed'],
    });
  });
});
