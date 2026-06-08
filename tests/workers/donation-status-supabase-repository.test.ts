import { describe, expect, it, vi } from 'vitest';
import { createSupabaseDonationStatusRepositories } from '../../apps/workers/src/donation-status-supabase';
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

const sampleRow = {
  id: 'donation-abc',
  donor_user_id: 'user-donor-1',
  shelter_id: 'shelter-001',
  pet_id: null,
  kind: 'one_time_donation',
  status: 'paid',
  amount_cents: 1000,
  currency: 'EUR',
  payment_method: 'mb_way',
  created_at: '2026-06-08T12:00:00.000Z',
};

describe('createSupabaseDonationStatusRepositories', () => {
  it('returns null when no donation found', async () => {
    const chain = makeQueryChain({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const { donationStatusRepository } = createSupabaseDonationStatusRepositories({
      client: makeClient(chain) as never,
    });

    const result = await donationStatusRepository.getDonationStatus('donation-abc');

    expect(result).toBeNull();
  });

  it('maps Supabase row to DonationStatusRecord correctly', async () => {
    const chain = makeQueryChain({
      maybeSingle: vi.fn().mockResolvedValue({ data: sampleRow, error: null }),
    });
    const { donationStatusRepository } = createSupabaseDonationStatusRepositories({
      client: makeClient(chain) as never,
    });

    const result = await donationStatusRepository.getDonationStatus('donation-abc');

    expect(result).toEqual({
      donationId: 'donation-abc',
      donorUserId: 'user-donor-1',
      shelterId: 'shelter-001',
      petId: null,
      kind: 'one_time_donation',
      donationStatus: 'paid',
      amountCents: 1000,
      currency: 'EUR',
      paymentMethod: 'mb_way',
      createdAt: '2026-06-08T12:00:00.000Z',
    });
  });

  it('queries donation_transactions by id with deleted_at null filter', async () => {
    const chain = makeQueryChain({
      maybeSingle: vi.fn().mockResolvedValue({ data: sampleRow, error: null }),
    });
    const client = makeClient(chain);
    const { donationStatusRepository } = createSupabaseDonationStatusRepositories({
      client: client as never,
    });

    await donationStatusRepository.getDonationStatus('donation-abc');

    expect(client.from).toHaveBeenCalledWith('donation_transactions');
    expect(chain.eq).toHaveBeenCalledWith('id', 'donation-abc');
    expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
  });
});
