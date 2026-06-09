import { describe, expect, it, vi } from 'vitest';
import { createAdoptionDonorListClient } from '../../packages/client/src/index';

const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

const makeInput = (fetchFn: ReturnType<typeof vi.fn>, token: string | null = 'valid-token') => ({
  workerBaseUrl: 'https://worker.test',
  adoptionsPath: '/adoptions' as const,
  getAccessToken: vi.fn().mockResolvedValue(token),
  fetch: fetchFn,
});

describe('createAdoptionDonorListClient', () => {
  it('returns ok with applications on success', async () => {
    const fetchFn = makeFetch(200, {
      status: 'ok',
      applications: [
        {
          applicationId: 'app-001',
          petId: 'pet-001',
          shelterId: 'shelter-001',
          status: 'submitted',
          submittedAt: '2026-01-01T12:00:00Z',
        },
      ],
      total: 1,
    });

    const client = createAdoptionDonorListClient(makeInput(fetchFn));
    const result = await client.loadDonorAdoptions();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe('ok');
      expect(result.applications).toHaveLength(1);
      expect(result.total).toBe(1);
    }
  });

  it('returns ok with empty list', async () => {
    const fetchFn = makeFetch(200, { status: 'ok', applications: [], total: 0 });

    const client = createAdoptionDonorListClient(makeInput(fetchFn));
    const result = await client.loadDonorAdoptions();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.applications).toHaveLength(0);
      expect(result.total).toBe(0);
    }
  });

  it('returns unauthenticated when no access token', async () => {
    const fetchFn = makeFetch(200, {});
    const client = createAdoptionDonorListClient(makeInput(fetchFn, null));
    const result = await client.loadDonorAdoptions();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('unauthenticated');
    }
  });

  it('returns adoption_donor_list_repository_not_configured on 501', async () => {
    const fetchFn = makeFetch(501, {
      status: 'adoption_donor_list_repository_not_configured',
    });

    const client = createAdoptionDonorListClient(makeInput(fetchFn));
    const result = await client.loadDonorAdoptions();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('adoption_donor_list_repository_not_configured');
    }
  });

  it('returns worker_request_failed on network error', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('network down'));
    const client = createAdoptionDonorListClient(makeInput(fetchFn));
    const result = await client.loadDonorAdoptions();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_request_failed');
    }
  });

  it('returns worker_response_invalid when response shape is wrong', async () => {
    const fetchFn = makeFetch(200, { status: 'ok', unexpected_field: true });
    const client = createAdoptionDonorListClient(makeInput(fetchFn));
    const result = await client.loadDonorAdoptions();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe('worker_response_invalid');
    }
  });
});
