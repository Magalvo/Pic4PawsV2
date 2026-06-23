import { describe, it, expect } from 'vitest';
import { createWebDonationStatusUi } from '../../apps/web/src/donation-status';
import type { DonationStatusClient, DonationStatusClientItem, DonationStatusClientResult } from '@pic4paws/client';

const donationStub: DonationStatusClientItem = {
  donationId: 'donation-abc',
  kind: 'one_time_donation',
  donationStatus: 'paid',
  amountCents: 1000,
  currency: 'EUR',
  paymentMethod: 'mb_way',
  shelterId: 'shelter-001',
  petId: null,
  receiptMediaId: null,
  createdAt: '2026-06-14T00:00:00.000Z',
};

const makeClient = (
  result: DonationStatusClientResult,
): Pick<DonationStatusClient, 'loadDonationStatus'> => ({
  loadDonationStatus: async () => result,
});

describe('donation status page — boundary contract', () => {
  it('produces failed state when client returns unauthenticated', async () => {
    const client = makeClient({
      ok: false,
      status: 'unauthenticated',
      reasons: ['missing_access_token'],
    });
    const ui = createWebDonationStatusUi({ donationStatusClient: client });
    const result = await ui.loadDonationStatus('donation-missing');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('unauthenticated');
      expect(result.canRetry).toBe(true);
    }
  });

  it('produces loaded state with donation details on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'ok',
      donation: { ...donationStub },
    });
    const ui = createWebDonationStatusUi({ donationStatusClient: client });
    const result = await ui.loadDonationStatus('donation-abc');
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') {
      expect(result.donation.donationId).toBe('donation-abc');
      expect(result.donation.amountCents).toBe(1000);
    }
  });

  it('passes donationId to the client', async () => {
    const seen: string[] = [];
    const trackingClient: Pick<DonationStatusClient, 'loadDonationStatus'> = {
      loadDonationStatus: async (donationId) => {
        seen.push(donationId);
        return { ok: false, status: 'unauthenticated', reasons: [] };
      },
    };
    const ui = createWebDonationStatusUi({ donationStatusClient: trackingClient });
    await ui.loadDonationStatus('donation-xyz-789');
    expect(seen).toEqual(['donation-xyz-789']);
  });
});
