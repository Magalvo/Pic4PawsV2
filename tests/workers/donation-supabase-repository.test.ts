import { describe, expect, it, vi } from 'vitest';
import { createSupabaseDonationRepositories } from '../../apps/workers/src/donation-supabase';
import type { CreateDonationInput } from '../../apps/workers/src/donation';

const makeQueryChain = (result: unknown) => {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'eq'];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain['single'] = vi.fn().mockResolvedValue(result);
  return chain;
};

const makeClient = (chain: ReturnType<typeof makeQueryChain>) => ({
  from: vi.fn().mockReturnValue(chain),
  rpc: vi.fn(),
});

const sampleInput: CreateDonationInput = {
  donorUserId: 'user-donor-1',
  shelterId: 'shelter-a',
  petId: null,
  kind: 'one_time_donation',
  amountCents: 1000,
  paymentMethod: 'mb_way',
  provider: 'eupago',
  anonymous: false,
  donorDisplayName: 'João Silva',
  donorEmail: 'joao@example.pt',
  publicMessage: null,
  createdAt: '2026-06-08T10:00:00.000Z',
};

describe('createSupabaseDonationRepositories', () => {
  describe('createDonation', () => {
    it('inserts a row and returns donationId and createdAt', async () => {
      const chain = makeQueryChain({
        data: { id: 'donation-001', created_at: '2026-06-08T10:00:00.000Z' },
        error: null,
      });
      const client = makeClient(chain);
      const { donationRepository } = createSupabaseDonationRepositories({ client });

      const result = await donationRepository.createDonation(sampleInput);

      expect(result).toEqual({
        donationId: 'donation-001',
        createdAt: '2026-06-08T10:00:00.000Z',
      });
      expect(client.from).toHaveBeenCalledWith('donation_transactions');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          donor_user_id: 'user-donor-1',
          shelter_id: 'shelter-a',
          kind: 'one_time_donation',
          status: 'created',
          provider: 'eupago',
          amount_cents: 1000,
          currency: 'EUR',
          payment_method: 'mb_way',
          anonymous: false,
        }),
      );
      expect(chain.select).toHaveBeenCalledWith('id,created_at');
    });

    it('assigns non-empty providerPaymentId and idempotencyKey', async () => {
      const chain = makeQueryChain({
        data: { id: 'donation-002', created_at: '2026-06-08T10:00:00.000Z' },
        error: null,
      });
      const client = makeClient(chain);
      let capturedRow: Record<string, unknown> | undefined;
      (chain.insert as ReturnType<typeof vi.fn>).mockImplementation((row: unknown) => {
        capturedRow = row as Record<string, unknown>;
        return chain;
      });

      const { donationRepository } = createSupabaseDonationRepositories({ client });
      await donationRepository.createDonation(sampleInput);

      expect(typeof capturedRow?.['provider_payment_id']).toBe('string');
      expect((capturedRow?.['provider_payment_id'] as string).length).toBeGreaterThan(0);
      expect(typeof capturedRow?.['idempotency_key']).toBe('string');
      expect((capturedRow?.['idempotency_key'] as string).length).toBeGreaterThan(0);
    });

    it('throws SupabaseDonationRepositoryError when insert fails', async () => {
      const chain = makeQueryChain({
        data: null,
        error: { message: 'insert failed' },
      });
      const client = makeClient(chain);
      const { donationRepository } = createSupabaseDonationRepositories({ client });

      await expect(donationRepository.createDonation(sampleInput)).rejects.toThrow(
        'Failed to create donation',
      );
    });
  });
});
