import { describe, expect, it, vi } from 'vitest';
import { createSupabasePaymentWebhookRepositories } from '../../apps/workers/src/payment-webhook-supabase';
import type { SupabaseTableQueryLike, SupabaseQueryResult } from '../../apps/workers/src/pet-supabase';

const makeQueryChain = (
  overrides: Partial<SupabaseTableQueryLike> = {},
): SupabaseTableQueryLike => {
  const chain: SupabaseTableQueryLike = {
    then: (
      onfulfilled?: ((value: SupabaseQueryResult<unknown>) => unknown) | null,
    ) =>
      (Promise.resolve({ data: null, error: null }) as Promise<SupabaseQueryResult<unknown>>).then(
        onfulfilled as never,
      ) as never,
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };

  return chain;
};

const makeClient = (queryChain: SupabaseTableQueryLike) => ({
  from: vi.fn().mockReturnValue(queryChain),
});

describe('createSupabasePaymentWebhookRepositories', () => {
  it('processVerifiedWebhookEvent calls the atomic payment webhook RPC', async () => {
    const chain = makeQueryChain();
    const client = {
      ...makeClient(chain),
      rpc: vi.fn().mockResolvedValue({
        data: {
          already_processed: false,
          donation_found: true,
          previous_status: 'pending_payment',
          new_status: 'paid',
          processed_at: '2026-06-08T12:00:00.000Z',
          financial_timestamp: '2026-06-08T12:00:00.000Z',
          raw_provider_event_ids: ['evt_001'],
        },
        error: null,
      }),
    };
    const { paymentWebhookRepository } = createSupabasePaymentWebhookRepositories({
      client: client as never,
    });

    const result = await paymentWebhookRepository.processVerifiedWebhookEvent({
      providerPaymentId: 'pay_001',
      provider: 'stripe',
      newStatus: 'paid',
      providerEventId: 'evt_001',
      payload: { type: 'payment.completed' },
      receivedAt: '2026-06-08T12:00:00.000Z',
    });

    expect(client.rpc).toHaveBeenCalledWith('process_payment_webhook_event', {
      p_provider_event_id: 'evt_001',
      p_provider: 'stripe',
      p_provider_payment_id: 'pay_001',
      p_new_status: 'paid',
      p_payload: { type: 'payment.completed' },
      p_received_at: '2026-06-08T12:00:00.000Z',
    });
    expect(client.from).not.toHaveBeenCalledWith('donation_transactions');
    expect(chain.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      alreadyProcessed: false,
      donationFound: true,
      previousStatus: 'pending_payment',
      newStatus: 'paid',
      processedAt: '2026-06-08T12:00:00.000Z',
      financialTimestamp: '2026-06-08T12:00:00.000Z',
      rawProviderEventIds: ['evt_001'],
    });
  });

  it('returns alreadyProcessed true from the RPC without requiring a donation transition', async () => {
    const client = {
      ...makeClient(makeQueryChain()),
      rpc: vi.fn().mockResolvedValue({
        data: {
          already_processed: true,
          donation_found: false,
          previous_status: null,
          new_status: 'paid',
          processed_at: '2026-06-08T12:00:00.000Z',
          financial_timestamp: null,
          raw_provider_event_ids: [],
        },
        error: null,
      }),
    };
    const { paymentWebhookRepository } = createSupabasePaymentWebhookRepositories({
      client: client as never,
    });

    await expect(
      paymentWebhookRepository.processVerifiedWebhookEvent({
        providerPaymentId: 'pay_001',
        provider: 'stripe',
        newStatus: 'paid',
        providerEventId: 'evt_001',
        payload: {},
        receivedAt: '2026-06-08T12:00:00.000Z',
      }),
    ).resolves.toMatchObject({ alreadyProcessed: true, donationFound: false });
  });

  it('throws a sanitized repository error when the RPC fails', async () => {
    const client = {
      ...makeClient(makeQueryChain()),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'database exploded with service-role-secret' },
      }),
    };
    const { paymentWebhookRepository } = createSupabasePaymentWebhookRepositories({
      client: client as never,
    });

    await expect(
      paymentWebhookRepository.processVerifiedWebhookEvent({
        providerPaymentId: 'pay_001',
        provider: 'stripe',
        newStatus: 'paid',
        providerEventId: 'evt_001',
        payload: {},
        receivedAt: '2026-06-08T12:00:00.000Z',
      }),
    ).rejects.toThrow('Failed to process payment webhook event');
  });
});
