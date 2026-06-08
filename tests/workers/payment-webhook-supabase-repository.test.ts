import { describe, expect, it, vi } from 'vitest';
import { createSupabasePaymentWebhookRepositories } from '../../apps/workers/src/payment-webhook-supabase';
import type { SupabaseTableQueryLike, SupabaseQueryResult } from '../../apps/workers/src/pet-supabase';

const makeQueryChain = (
  overrides: Partial<SupabaseTableQueryLike> = {},
): SupabaseTableQueryLike => {
  const chain: SupabaseTableQueryLike = {
    then: (resolve: (value: SupabaseQueryResult<unknown>) => unknown) =>
      Promise.resolve(resolve({ data: null, error: null })),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
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
  it('isEventAlreadyProcessed returns false when no event found', async () => {
    const chain = makeQueryChain({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const { paymentWebhookRepository } = createSupabasePaymentWebhookRepositories({
      client: makeClient(chain) as never,
    });

    const result = await paymentWebhookRepository.isEventAlreadyProcessed('evt_001', 'stripe');

    expect(result).toBe(false);
  });

  it('isEventAlreadyProcessed returns true when event exists', async () => {
    const chain = makeQueryChain({
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-row-id' }, error: null }),
    });
    const { paymentWebhookRepository } = createSupabasePaymentWebhookRepositories({
      client: makeClient(chain) as never,
    });

    const result = await paymentWebhookRepository.isEventAlreadyProcessed('evt_001', 'stripe');

    expect(result).toBe(true);
  });

  it('recordWebhookEvent inserts into payment_webhook_events table', async () => {
    const chain = makeQueryChain({
      single: vi.fn().mockResolvedValue({ data: { id: 'new-row-id' }, error: null }),
    });
    const client = makeClient(chain);
    const { paymentWebhookRepository } = createSupabasePaymentWebhookRepositories({
      client: client as never,
    });

    await paymentWebhookRepository.recordWebhookEvent({
      providerEventId: 'evt_001',
      provider: 'stripe',
      payload: { type: 'payment.completed' },
      receivedAt: '2026-06-08T12:00:00.000Z',
    });

    expect(client.from).toHaveBeenCalledWith('payment_webhook_events');
    expect(chain.insert).toHaveBeenCalled();
  });

  it('updateDonationStatus updates donation_transactions and returns found: true', async () => {
    const chain = makeQueryChain({
      then: (resolve: (value: SupabaseQueryResult<unknown>) => unknown) =>
        Promise.resolve(resolve({ data: [{ id: 'row' }], error: null, count: 1 } as never)),
    });
    const client = makeClient(chain);
    const { paymentWebhookRepository } = createSupabasePaymentWebhookRepositories({
      client: client as never,
    });

    const result = await paymentWebhookRepository.updateDonationStatus({
      providerPaymentId: 'pay_001',
      provider: 'stripe',
      newStatus: 'paid',
      providerEventId: 'evt_001',
    });

    expect(client.from).toHaveBeenCalledWith('donation_transactions');
    expect(chain.update).toHaveBeenCalled();
    expect(result).toEqual({ found: true });
  });
});
