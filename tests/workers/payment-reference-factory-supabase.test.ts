import { getTableColumns } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';
import { encryptCredential } from '../../apps/workers/src/crypto';
import { createSupabasePaymentReferenceFactory } from '../../apps/workers/src/payment-reference-factory-supabase';
import type { PaymentReferenceInput } from '../../apps/workers/src/payment-reference-factory';
import type { SupabaseClientLike } from '../../apps/workers/src/pet-supabase';
import { shelterPaymentConfigs } from '../../packages/database/src/schema';

const ENCRYPTION_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const input: PaymentReferenceInput = {
  donationId: 'donation-001',
  amountCents: 1500,
  currency: 'EUR',
  shelterId: 'shelter-001',
  orderId: 'order-001',
  paymentMethod: 'multibanco',
};

const makeClient = (data: Record<string, unknown> | null) => {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);

  const client = {
    from: vi.fn().mockReturnValue(chain),
    rpc: vi.fn(),
  } as unknown as SupabaseClientLike;

  return { client, chain };
};

describe('createSupabasePaymentReferenceFactory schema contract', () => {
  it('selects only columns present in the canonical Drizzle table', async () => {
    const { client, chain } = makeClient(null);
    const factory = createSupabasePaymentReferenceFactory({
      client,
      encryptionSecret: ENCRYPTION_SECRET,
      fetch: vi.fn() as unknown as typeof fetch,
    });

    await factory.createReference(input);

    const selected = (chain.select.mock.calls[0]?.[0] as string).split(',');
    const schemaColumns = Object.values(getTableColumns(shelterPaymentConfigs)).map(
      (column) => column.name,
    );

    expect(selected).toEqual([
      'active_provider',
      'eupago_api_key_encrypted',
      'api_key_encrypted',
      'mb_way_phone',
    ]);
    expect(selected.every((column) => schemaColumns.includes(column))).toBe(true);
    expect(selected).not.toContain('ifthenpay_api_key_encrypted');
  });

  it('dispatches Eupago when the unused legacy Ifthenpay credential is null', async () => {
    const encryptedKey = await encryptCredential('eupago-secret', ENCRYPTION_SECRET);
    const { client } = makeClient({
      active_provider: 'eupago',
      eupago_api_key_encrypted: encryptedKey,
      api_key_encrypted: null,
      mb_way_phone: null,
    });
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        transactionID: 'eupago-transaction-001',
        entity: '10611',
        reference: '123456789',
        expiryDate: null,
      }),
    ) as unknown as typeof globalThis.fetch;
    const factory = createSupabasePaymentReferenceFactory({
      client,
      encryptionSecret: ENCRYPTION_SECRET,
      fetch,
    });

    const result = await factory.createReference(input);

    expect(result).toMatchObject({ ok: true, providerPaymentId: 'eupago-transaction-001' });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('uses api_key_encrypted for the legacy Ifthenpay compatibility path', async () => {
    const encryptedKey = await encryptCredential('legacy-ifthenpay-key', ENCRYPTION_SECRET);
    const { client } = makeClient({
      active_provider: 'ifthenpay',
      eupago_api_key_encrypted: null,
      api_key_encrypted: encryptedKey,
      mb_way_phone: null,
    });
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        RequestId: 'ifthenpay-request-001',
        Entity: '12345',
        Reference: '123456789',
      }),
    ) as unknown as typeof globalThis.fetch;
    const factory = createSupabasePaymentReferenceFactory({
      client,
      encryptionSecret: ENCRYPTION_SECRET,
      fetch,
    });

    const result = await factory.createReference(input);

    expect(result).toMatchObject({ ok: true, providerPaymentId: 'ifthenpay-request-001' });
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer legacy-ifthenpay-key' }),
      }),
    );
  });

  it('fails closed without calling Ifthenpay when the legacy credential is missing', async () => {
    const { client } = makeClient({
      active_provider: 'ifthenpay',
      eupago_api_key_encrypted: null,
      api_key_encrypted: null,
      mb_way_phone: null,
    });
    const fetch = vi.fn() as unknown as typeof globalThis.fetch;
    const factory = createSupabasePaymentReferenceFactory({
      client,
      encryptionSecret: ENCRYPTION_SECRET,
      fetch,
    });

    await expect(factory.createReference(input)).resolves.toEqual({
      ok: false,
      reason: 'invalid_response',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails closed without calling Eupago when credential decryption fails', async () => {
    const { client } = makeClient({
      active_provider: 'eupago',
      eupago_api_key_encrypted: 'not-valid-ciphertext',
      api_key_encrypted: null,
      mb_way_phone: null,
    });
    const fetch = vi.fn() as unknown as typeof globalThis.fetch;
    const factory = createSupabasePaymentReferenceFactory({
      client,
      encryptionSecret: ENCRYPTION_SECRET,
      fetch,
    });

    await expect(factory.createReference(input)).resolves.toEqual({
      ok: false,
      reason: 'invalid_response',
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
