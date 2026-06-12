import { describe, expect, it } from 'vitest';
import { createPetDraftClient } from '../../packages/client/src/index';

type FetchCall = {
  url: string;
  init: RequestInit;
};

const successBody = {
  status: 'ok',
  draft: {
    petId: 'pet-1',
    shelterId: 'shelter-a',
    status: 'draft',
    name: 'Becas',
    species: 'dog',
    locationLabel: 'Lisboa',
    shortDescription: 'Calmo e sociável.',
    mediaIds: ['media-1'],
    heroMediaId: 'media-1',
    medical: {
      vaccinated: true,
      sterilized: true,
      microchipped: true,
      specialNeeds: false,
    },
    publishedAt: null,
    createdAt: '2026-06-10T12:00:00.000Z',
    updatedAt: '2026-06-10T12:00:00.000Z',
  },
};

const createJsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...init.headers },
  });

describe('pet draft load client contract', () => {
  it('loads a pet draft with GET and Authorization header', async () => {
    const calls: FetchCall[] = [];
    const client = createPetDraftClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'user-access-token',
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return createJsonResponse(successBody, { status: 200 });
      },
    });

    const result = await client.loadPetDraft('pet-1');

    expect(result).toEqual({
      ok: true,
      status: 'pet_draft_loaded',
      draft: successBody.draft,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: 'https://worker.pic4paws.pt/pets/drafts/pet-1',
      init: {
        method: 'GET',
        headers: { Authorization: 'Bearer user-access-token' },
      },
    });
    expect(calls[0]?.init.body).toBeUndefined();
  });

  it('returns unauthenticated immediately when no access token', async () => {
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

    await expect(client.loadPetDraft('pet-1')).resolves.toEqual({
      ok: false,
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });
    expect(fetchCalled).toBe(false);
  });

  it('maps 401 to unauthenticated failure', async () => {
    const client = createPetDraftClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'token',
      fetch: async () => createJsonResponse({ status: 'unauthenticated' }, { status: 401 }),
    });

    await expect(client.loadPetDraft('pet-1')).resolves.toMatchObject({
      ok: false,
      status: 'unauthenticated',
    });
  });

  it('maps 403 to forbidden failure', async () => {
    const client = createPetDraftClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'token',
      fetch: async () => createJsonResponse({ status: 'forbidden' }, { status: 403 }),
    });

    await expect(client.loadPetDraft('pet-1')).resolves.toMatchObject({
      ok: false,
      status: 'forbidden',
    });
  });

  it('maps 404 to pet_draft_not_found failure', async () => {
    const client = createPetDraftClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'token',
      fetch: async () => createJsonResponse({ status: 'pet_draft_not_found' }, { status: 404 }),
    });

    await expect(client.loadPetDraft('pet-1')).resolves.toMatchObject({
      ok: false,
      status: 'pet_draft_not_found',
    });
  });

  it('maps 501 to auth_adapter_not_configured failure', async () => {
    const client = createPetDraftClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'token',
      fetch: async () =>
        createJsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 }),
    });

    await expect(client.loadPetDraft('pet-1')).resolves.toMatchObject({
      ok: false,
      status: 'auth_adapter_not_configured',
    });
  });

  it('returns worker_request_failed for malformed success body', async () => {
    const client = createPetDraftClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'token',
      fetch: async () => createJsonResponse({ status: 'ok', draft: null }, { status: 200 }),
    });

    await expect(client.loadPetDraft('pet-1')).resolves.toMatchObject({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['invalid_worker_response'],
    });
  });

  it('sanitizes bearer and service-role markers from failure reasons', async () => {
    const client = createPetDraftClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'token',
      fetch: async () =>
        createJsonResponse(
          {
            status: 'worker_request_failed',
            reasons: ['safe_reason', 'service-role-secret', 'bearer user-token'],
          },
          { status: 500 },
        ),
    });

    const result = await client.loadPetDraft('pet-1');

    expect(result).toMatchObject({ ok: false, status: 'worker_request_failed' });
    expect(JSON.stringify(result)).not.toContain('service-role');
    expect(JSON.stringify(result)).not.toContain('bearer ');
  });
});
