import { describe, expect, it } from 'vitest';
import { createPetMediaAttachClient } from '../../packages/client/src/index';

type FetchCall = {
  url: string;
  init: RequestInit;
};

const createJsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init.headers,
    },
  });

const createTextResponse = (body: string, init: ResponseInit = {}) => new Response(body, init);

describe('pet media attach client contract', () => {
  it('attaches uploaded media to a pet draft through the Worker with sanitized payload', async () => {
    const calls: FetchCall[] = [];
    const client = createPetMediaAttachClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'user-access-token',
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });

        return createJsonResponse({
          status: 'pet_media_attached',
          petId: 'pet-1',
          mediaId: 'media-1',
          mediaIds: ['media-1'],
          heroMediaId: 'media-1',
          debug: 'service-role-secret r2-secret-key user-access-token signedUrl',
        });
      },
    });

    await expect(
      client.attachPetMedia({
        petId: 'pet-1',
        mediaId: 'media-1',
        signedUrl: 'https://client-must-not-send.test',
        serviceRoleKey: 'service-role-secret',
      } as { petId: string; mediaId: string } & Record<string, unknown>),
    ).resolves.toEqual({
      ok: true,
      status: 'pet_media_attached',
      petId: 'pet-1',
      mediaId: 'media-1',
      mediaIds: ['media-1'],
      heroMediaId: 'media-1',
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: 'https://worker.pic4paws.pt/pets/drafts/pet-1/media',
      init: {
        method: 'POST',
        headers: {
          Authorization: 'Bearer user-access-token',
          'Content-Type': 'application/json',
        },
      },
    });
    expect(JSON.parse(calls[0]?.init.body as string)).toEqual({ mediaId: 'media-1' });
    expect(calls[0]?.init.body).not.toContain('client-must-not-send');
    expect(calls[0]?.init.body).not.toContain('service-role-secret');
    expect(JSON.stringify(calls[0]?.init.headers)).toContain('user-access-token');
  });

  it('rejects missing bearer tokens before making network requests', async () => {
    let fetchCalled = false;
    const client = createPetMediaAttachClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => null,
      fetch: async () => {
        fetchCalled = true;

        return createJsonResponse({});
      },
    });

    await expect(
      client.attachPetMedia({ petId: 'pet-1', mediaId: 'media-1' }),
    ).resolves.toEqual({
      ok: false,
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });
    expect(fetchCalled).toBe(false);
  });

  it('normalizes Worker failures without leaking bearer tokens or provider secrets', async () => {
    const client = createPetMediaAttachClient({
      workerBaseUrl: 'https://worker.pic4paws.pt/',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'user-access-token',
      fetch: async () =>
        createJsonResponse(
          {
            status: 'pet_media_attach_rejected',
            reasons: [
              'media_not_public_image',
              'service-role-secret',
              'r2-secret-key',
              'user-access-token',
              'signedUrl=https://uploads.test',
            ],
          },
          { status: 400 },
        ),
    });

    const result = await client.attachPetMedia({ petId: 'pet-1', mediaId: 'media-1' });

    expect(result).toEqual({
      ok: false,
      status: 'pet_media_attach_rejected',
      reasons: ['media_not_public_image'],
    });
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
    expect(JSON.stringify(result)).not.toContain('user-access-token');
    expect(JSON.stringify(result)).not.toContain('signedUrl');
  });

  it('maps explicit Worker statuses and malformed responses to safe client failures', async () => {
    const makeClient = (response: Response) =>
      createPetMediaAttachClient({
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
      ).attachPetMedia({ petId: 'pet-1', mediaId: 'media-1' }),
    ).resolves.toEqual({
      ok: false,
      status: 'actor_not_authorized',
      reasons: ['actor_not_authorized'],
    });

    await expect(
      makeClient(
        createJsonResponse({ status: 'pet_media_attach_context_not_found' }, { status: 404 }),
      ).attachPetMedia({ petId: 'pet-1', mediaId: 'media-1' }),
    ).resolves.toEqual({
      ok: false,
      status: 'pet_media_attach_context_not_found',
      reasons: ['pet_media_attach_context_not_found'],
    });

    await expect(
      makeClient(createJsonResponse({ status: 'pet_media_attached' })).attachPetMedia({
        petId: 'pet-1',
        mediaId: 'media-1',
      }),
    ).resolves.toEqual({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['invalid_worker_response'],
    });

    await expect(
      makeClient(createTextResponse('service-role-secret r2-secret-key', { status: 502 })).attachPetMedia({
        petId: 'pet-1',
        mediaId: 'media-1',
      }),
    ).resolves.toEqual({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['worker_request_failed'],
    });
  });
});
