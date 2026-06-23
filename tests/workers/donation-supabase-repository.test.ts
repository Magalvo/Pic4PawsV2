import { describe, expect, it, vi } from 'vitest';
import { createSupabaseDonationRepositories } from '../../apps/workers/src/donation-supabase';
import type { CreateDonationInput } from '../../apps/workers/src/donation';
import type { SupabaseClientLike } from '../../apps/workers/src/pet-supabase';

const makeQueryChain = (result: unknown) => {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'eq', 'is'];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain['single'] = vi.fn().mockResolvedValue(result);
  chain['maybeSingle'] = vi.fn().mockResolvedValue(result);
  return chain;
};

const makeClient = (chain: ReturnType<typeof makeQueryChain>) => ({
  from: vi.fn().mockReturnValue(chain),
  rpc: vi.fn(),
});

const makeClientByTable = (chains: Record<string, ReturnType<typeof makeQueryChain>>) => ({
  from: vi.fn((table: string) => chains[table]),
  rpc: vi.fn(),
}) as unknown as SupabaseClientLike;

const VALID_IBAN = 'PT50000201231234567890154';

const sampleInput: CreateDonationInput = {
  donorUserId: 'user-donor-1',
  shelterId: 'shelter-a',
  petId: null,
  kind: 'one_time_donation',
  amountCents: 1000,
  paymentMethod: 'mb_way',
  provider: 'eupago',
  initialStatus: 'pending_receipt',
  anonymous: false,
  donorDisplayName: 'João Silva',
  donorEmail: 'joao@example.pt',
  publicMessage: null,
  createdAt: '2026-06-08T10:00:00.000Z',
};

describe('createSupabaseDonationRepositories', () => {
  describe('getDonationEligibilityContext', () => {
    it('loads shelter, payment config, and optional pet scope before insert', async () => {
      const shelterChain = makeQueryChain({
        data: {
          id: 'shelter-a',
          verification_status: 'verified',
          payment_account_status: 'active',
        },
        error: null,
      });
      const configChain = makeQueryChain({
        data: { tier: 'manual', iban: VALID_IBAN, mb_way_phone: null },
        error: null,
      });
      const petChain = makeQueryChain({
        data: { id: 'pet-1', shelter_id: 'shelter-a' },
        error: null,
      });
      const client = makeClientByTable({
        shelters: shelterChain,
        shelter_payment_configs: configChain,
        pets: petChain,
      });
      const { donationRepository } = createSupabaseDonationRepositories({ client });

      await expect(
        donationRepository.getDonationEligibilityContext({
          shelterId: 'shelter-a',
          petId: 'pet-1',
        }),
      ).resolves.toEqual({
        shelter: {
          id: 'shelter-a',
          verificationStatus: 'verified',
          paymentAccountStatus: 'active',
        },
        paymentConfig: { tier: 'manual', iban: VALID_IBAN, mbWayPhone: null },
        pet: { id: 'pet-1', shelterId: 'shelter-a' },
      });
      expect(client.from).toHaveBeenCalledWith('shelters');
      expect(shelterChain.select).toHaveBeenCalledWith(
        'id,verification_status,payment_account_status',
      );
      expect(shelterChain.eq).toHaveBeenCalledWith('id', 'shelter-a');
      expect(client.from).toHaveBeenCalledWith('shelter_payment_configs');
      expect(configChain.select).toHaveBeenCalledWith('tier,iban,mb_way_phone');
      expect(configChain.eq).toHaveBeenCalledWith('shelter_id', 'shelter-a');
      expect(client.from).toHaveBeenCalledWith('pets');
      expect(petChain.select).toHaveBeenCalledWith('id,shelter_id');
      expect(petChain.eq).toHaveBeenCalledWith('id', 'pet-1');
    });
  });

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
          status: 'pending_receipt',
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
