import { describe, expect, it } from 'vitest';
import { createSupabaseFinancialsRepositories } from '../../apps/workers/src/financials-supabase';
import type { SupabaseClientLike } from '../../apps/workers/src/index';

// ─── Fake Supabase client ─────────────────────────────────────────────────────

type FakeRow = Record<string, unknown>;

const makeFakeClient = (tables: Record<string, FakeRow[]>) => {
  const makeChain = (rows: FakeRow[]) => {
    const chain: Record<string, unknown> = {};

    chain['select'] = () => makeChain(rows);
    chain['eq'] = (_col: string, val: string) => {
      const filtered = rows.filter((r) => Object.values(r).includes(val));
      return makeChain(filtered);
    };
    chain['is'] = () => makeChain(rows);
    chain['order'] = () => makeChain(rows);
    chain['range'] = () => makeChain(rows);

    chain['then'] = (
      resolve: (v: unknown) => unknown,
      reject?: (e: unknown) => unknown,
    ) => Promise.resolve({ data: rows, error: null, count: rows.length }).then(resolve, reject);

    return chain;
  };

  const client = {
    from: (table: string) => makeChain(tables[table] ?? []),
  } as unknown as SupabaseClientLike;

  return client;
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createSupabaseFinancialsRepositories — donations aggregation', () => {
  it('returns zero counts when no donations exist', async () => {
    const client = makeFakeClient({ donation_transactions: [], sponsorships: [] });
    const { financialsRepository } = createSupabaseFinancialsRepositories({ client });

    const result = await financialsRepository.getFinancials('shelter-1');

    expect(result.donations.count).toBe(0);
    expect(result.donations.paidTotalCents).toBe(0);
    expect(result.donations.byStatus).toHaveLength(0);
  });

  it('aggregates donations by status', async () => {
    const client = makeFakeClient({
      donation_transactions: [
        { shelter_id: 'shelter-1', status: 'paid', amount_cents: 5000, currency: 'EUR' },
        { shelter_id: 'shelter-1', status: 'paid', amount_cents: 3000, currency: 'EUR' },
        { shelter_id: 'shelter-1', status: 'pending_payment', amount_cents: 2000, currency: 'EUR' },
        { shelter_id: 'shelter-1', status: 'failed', amount_cents: 1000, currency: 'EUR' },
      ],
      sponsorships: [],
    });
    const { financialsRepository } = createSupabaseFinancialsRepositories({ client });

    const result = await financialsRepository.getFinancials('shelter-1');

    expect(result.donations.count).toBe(4);
    const paid = result.donations.byStatus.find((b) => b.status === 'paid');
    expect(paid?.count).toBe(2);
    expect(paid?.totalCents).toBe(8000);
    const pending = result.donations.byStatus.find((b) => b.status === 'pending_payment');
    expect(pending?.count).toBe(1);
    expect(pending?.totalCents).toBe(2000);
  });

  it('computes paidTotalCents from paid donations only', async () => {
    const client = makeFakeClient({
      donation_transactions: [
        { shelter_id: 'shelter-1', status: 'paid', amount_cents: 10000, currency: 'EUR' },
        { shelter_id: 'shelter-1', status: 'failed', amount_cents: 5000, currency: 'EUR' },
      ],
      sponsorships: [],
    });
    const { financialsRepository } = createSupabaseFinancialsRepositories({ client });

    const result = await financialsRepository.getFinancials('shelter-1');

    expect(result.donations.paidTotalCents).toBe(10000);
  });
});

describe('createSupabaseFinancialsRepositories — sponsorships aggregation', () => {
  it('returns zero counts when no sponsorships exist', async () => {
    const client = makeFakeClient({ donation_transactions: [], sponsorships: [] });
    const { financialsRepository } = createSupabaseFinancialsRepositories({ client });

    const result = await financialsRepository.getFinancials('shelter-1');

    expect(result.sponsorships.activeCount).toBe(0);
    expect(result.sponsorships.pausedCount).toBe(0);
    expect(result.sponsorships.cancelledCount).toBe(0);
    expect(result.sponsorships.activeTotalCents).toBe(0);
  });

  it('aggregates sponsorships by status', async () => {
    const client = makeFakeClient({
      donation_transactions: [],
      sponsorships: [
        { shelter_id: 'shelter-1', status: 'active', amount_cents: 5000 },
        { shelter_id: 'shelter-1', status: 'active', amount_cents: 3000 },
        { shelter_id: 'shelter-1', status: 'paused', amount_cents: 2000 },
        { shelter_id: 'shelter-1', status: 'cancelled', amount_cents: 1000 },
        { shelter_id: 'shelter-1', status: 'cancelled', amount_cents: 500 },
      ],
    });
    const { financialsRepository } = createSupabaseFinancialsRepositories({ client });

    const result = await financialsRepository.getFinancials('shelter-1');

    expect(result.sponsorships.activeCount).toBe(2);
    expect(result.sponsorships.pausedCount).toBe(1);
    expect(result.sponsorships.cancelledCount).toBe(2);
    expect(result.sponsorships.activeTotalCents).toBe(8000);
  });
});

describe('createSupabaseFinancialsRepositories — currency', () => {
  it('uses EUR as default currency when no records exist', async () => {
    const client = makeFakeClient({ donation_transactions: [], sponsorships: [] });
    const { financialsRepository } = createSupabaseFinancialsRepositories({ client });

    const result = await financialsRepository.getFinancials('shelter-1');

    expect(result.currency).toBe('EUR');
  });

  it('picks currency from the first donation row', async () => {
    const client = makeFakeClient({
      donation_transactions: [
        { shelter_id: 'shelter-1', status: 'paid', amount_cents: 1000, currency: 'USD' },
      ],
      sponsorships: [],
    });
    const { financialsRepository } = createSupabaseFinancialsRepositories({ client });

    const result = await financialsRepository.getFinancials('shelter-1');

    expect(result.currency).toBe('USD');
  });
});
