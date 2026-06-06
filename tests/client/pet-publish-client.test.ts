import { describe, expect, it } from 'vitest';
import { createPetPublishClient } from '../../packages/client/src/index';

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

describe('pet publish client contract', () => {
  it('publishes a persisted pet draft through the Worker without sending client publish claims', async () => {
    const calls: FetchCall[] = [];
    const client = createPetPublishClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'user-access-token',
      fetch: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });

        return createJsonResponse({
          status: 'pet_published',
          petId: 'pet-1',
          publishedAt: '2026-06-04T15:00:00.000Z',
          debug: 'service-role-secret r2-secret-key user-access-token',
        });
      },
    });

    await expect(
      client.publishPetDraft({
        petId: 'pet-1',
        mediaIds: ['client-must-not-send'],
        status: 'published',
        serviceRoleKey: 'service-role-secret',
      } as { petId: string } & Record<string, unknown>),
    ).resolves.toEqual({
      ok: true,
      status: 'pet_published',
      petId: 'pet-1',
      publishedAt: '2026-06-04T15:00:00.000Z',
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: 'https://worker.pic4paws.pt/pets/drafts/pet-1/publish',
      init: {
        method: 'POST',
        headers: {
          Authorization: 'Bearer user-access-token',
          'Content-Type': 'application/json',
        },
      },
    });
    expect(JSON.parse(calls[0]?.init.body as string)).toEqual({});
    expect(calls[0]?.init.body).not.toContain('client-must-not-send');
    expect(calls[0]?.init.body).not.toContain('published');
    expect(calls[0]?.init.body).not.toContain('service-role-secret');
  });

  it('rejects missing bearer tokens before making network requests', async () => {
    let fetchCalled = false;
    const client = createPetPublishClient({
      workerBaseUrl: 'https://worker.pic4paws.pt',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => '   ',
      fetch: async () => {
        fetchCalled = true;

        return createJsonResponse({});
      },
    });

    await expect(client.publishPetDraft({ petId: 'pet-1' })).resolves.toEqual({
      ok: false,
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });
    expect(fetchCalled).toBe(false);
  });

  it('normalizes Worker failures without leaking bearer tokens or provider secrets', async () => {
    const client = createPetPublishClient({
      workerBaseUrl: 'https://worker.pic4paws.pt/',
      petDraftsPath: '/pets/drafts',
      getAccessToken: async () => 'user-access-token',
      fetch: async () =>
        createJsonResponse(
          {
            status: 'pet_publish_rejected',
            reasons: [
              'missing_mediaIds',
              'service-role-secret',
              'r2-secret-key',
              'user-access-token',
              'bearer user-token-marker',
            ],
          },
          { status: 400 },
        ),
    });

    const result = await client.publishPetDraft({ petId: 'pet-1' });

    expect(result).toEqual({
      ok: false,
      status: 'pet_publish_rejected',
      reasons: ['missing_mediaIds'],
    });
    expect(JSON.stringify(result)).not.toContain('service-role-secret');
    expect(JSON.stringify(result)).not.toContain('r2-secret-key');
    expect(JSON.stringify(result)).not.toContain('user-access-token');
    expect(JSON.stringify(result)).not.toContain('user-token-marker');
  });

  it('maps explicit Worker statuses and malformed responses to safe client failures', async () => {
    const makeClient = (response: Response) =>
      createPetPublishClient({
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
      ).publishPetDraft({ petId: 'pet-1' }),
    ).resolves.toEqual({
      ok: false,
      status: 'actor_not_authorized',
      reasons: ['actor_not_authorized'],
    });

    await expect(
      makeClient(createJsonResponse({ status: 'pet_draft_not_found' }, { status: 404 })).publishPetDraft({
        petId: 'pet-1',
      }),
    ).resolves.toEqual({
      ok: false,
      status: 'pet_draft_not_found',
      reasons: ['pet_draft_not_found'],
    });

    await expect(
      makeClient(createJsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 })).publishPetDraft({
        petId: 'pet-1',
      }),
    ).resolves.toEqual({
      ok: false,
      status: 'auth_adapter_not_configured',
      reasons: ['auth_adapter_not_configured'],
    });

    await expect(
      makeClient(
        createJsonResponse({ status: 'pet_publish_repository_not_configured' }, { status: 501 }),
      ).publishPetDraft({ petId: 'pet-1' }),
    ).resolves.toEqual({
      ok: false,
      status: 'pet_publish_repository_not_configured',
      reasons: ['pet_publish_repository_not_configured'],
    });

    await expect(
      makeClient(createJsonResponse({ status: 'pet_published' })).publishPetDraft({
        petId: 'pet-1',
      }),
    ).resolves.toEqual({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['invalid_worker_response'],
    });

    await expect(
      makeClient(createTextResponse('service-role-secret r2-secret-key', { status: 502 })).publishPetDraft({
        petId: 'pet-1',
      }),
    ).resolves.toEqual({
      ok: false,
      status: 'worker_request_failed',
      reasons: ['worker_request_failed'],
    });
  });
});
