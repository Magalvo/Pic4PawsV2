import { describe, expect, it, vi } from 'vitest';
import { createSupabaseDonationListRepositories } from '../../apps/workers/src/donation-list-supabase';
import { SupabaseDonationListRepositoryError } from '../../apps/workers/src/donation-list-supabase';
import type { SupabaseClientLike } from '../../apps/workers/src/pet-supabase';

const makeMockClient = (data: unknown[], count = 0, error: unknown = null) => {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data, count, error }),
  };
  return {
    from: vi.fn().mockReturnValue(query),
  } as unknown as SupabaseClientLike;
};

const sampleRow = {
  id: 'donation-001',
  kind: 'one_time_donation',
  status: 'paid',
  amount_cents: 1000,
  currency: 'EUR',
  payment_method: 'mb_way',
  anonymous: false,
  donor_display_name: 'João Silva',
  public_message: 'Força abrigo!',
  created_at: '2026-06-08T10:00:00.000Z',
};

describe('SupabaseDonationListRepository', () => {
  it('maps donation_transactions rows to DonationListSummary correctly', async () => {
    const client = makeMockClient([sampleRow], 1);
    const { donationListRepository } = createSupabaseDonationListRepositories({ client });

    const result = await donationListRepository.listDonations({
      shelterId: 'shelter-a',
      limit: 20,
      offset: 0,
    });

    expect(result.donations).toHaveLength(1);
    expect(result.total).toBe(1);
    const d = result.donations[0];
    expect(d?.donationId).toBe('donation-001');
    expect(d?.kind).toBe('one_time_donation');
    expect(d?.status).toBe('paid');
    expect(d?.amountCents).toBe(1000);
    expect(d?.currency).toBe('EUR');
    expect(d?.paymentMethod).toBe('mb_way');
    expect(d?.anonymous).toBe(false);
    expect(d?.donorDisplayName).toBe('João Silva');
    expect(d?.publicMessage).toBe('Força abrigo!');
    expect(d?.createdAt).toBe('2026-06-08T10:00:00.000Z');
  });

  it('returns empty donations and zero total when no rows exist', async () => {
    const client = makeMockClient([], 0);
    const { donationListRepository } = createSupabaseDonationListRepositories({ client });

    const result = await donationListRepository.listDonations({
      shelterId: 'shelter-a',
    });

    expect(result.donations).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('throws SupabaseDonationListRepositoryError on Supabase error', async () => {
    const client = makeMockClient([], 0, { message: 'db error' });
    const { donationListRepository } = createSupabaseDonationListRepositories({ client });

    await expect(
      donationListRepository.listDonations({ shelterId: 'shelter-a' }),
    ).rejects.toThrow(SupabaseDonationListRepositoryError);
  });
});
