import { describe, expect, it } from 'vitest';
import {
  createMobileDonationUi,
  mobileDonationUiContent,
} from '../../apps/mobile/src/donation';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  DonationClient,
  DonationClientInput,
  DonationClientResult,
} from '../../packages/client/src/index';

const makeDonationClient = (
  result: DonationClientResult,
): Pick<DonationClient, 'submitDonation'> => ({
  submitDonation: async () => result,
});

const validInput: DonationClientInput = {
  shelterId: 'shelter-a',
  amountCents: 1000,
  kind: 'one_time_donation',
  paymentMethod: 'mb_way',
  dataProcessingAccepted: true,
  petId: null,
  publicMessage: null,
  anonymous: false,
  donorDisplayName: 'João Silva',
  donorEmail: 'joao@example.pt',
};

const successResult: DonationClientResult = {
  ok: true,
  status: 'donation_created',
  donationId: 'donation-001',
  amountCents: 1000,
  currency: 'EUR',
  kind: 'one_time_donation',
  shelterId: 'shelter-a',
  createdAt: '2026-06-08T10:00:00.000Z',
  tier: 'manual',
  iban: 'PT50000201231234567890154',
  mbWayPhone: null,
};

describe('mobile donation UI', () => {
  it('getInitialState returns idle state with PT-PT copy and primaryAction', () => {
    const ui = createMobileDonationUi({
      donationClient: {
        submitDonation: async () => {
          throw new Error('should not be called');
        },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.message).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(mobileDonationUiContent.locale).toBe('pt-PT');
    expect(mobileDonationUiContent.status).toBe('product-flow-ready');
  });

  it('mobileDonationUiContent has all required states: idle, submitting, submitted, submitted_automated, failed', () => {
    const stateNames = mobileDonationUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('submitting');
    expect(stateNames).toContain('submitted');
    expect(stateNames).toContain('submitted_automated');
    expect(stateNames).toContain('failed');
    expect(stateNames).toHaveLength(5);
  });

  it('submitDonation with success returns submitted state with all donation fields', async () => {
    const ui = createMobileDonationUi({
      donationClient: makeDonationClient(successResult),
    });

    const state = await ui.submitDonation(validInput);

    expect(state.state).toBe('submitted');
    if (state.state === 'submitted') {
      expect(state.donationId).toBe('donation-001');
      expect(state.amountCents).toBe(1000);
      expect(state.currency).toBe('EUR');
      expect(state.kind).toBe('one_time_donation');
      expect(state.shelterId).toBe('shelter-a');
      expect(state.createdAt).toBeTruthy();
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('submitDonation worker_request_failed returns failed state with canRetry true', async () => {
    const ui = createMobileDonationUi({
      donationClient: makeDonationClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.submitDonation(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('submitDonation unauthenticated returns failed state', async () => {
    const ui = createMobileDonationUi({
      donationClient: makeDonationClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });

    const state = await ui.submitDonation(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
      expect(state.canRetry).toBe(true);
    }
  });

  it('submitDonation invalid_donation returns failed state', async () => {
    const ui = createMobileDonationUi({
      donationClient: makeDonationClient({
        ok: false,
        status: 'invalid_donation',
        reasons: ['amount_cents_must_be_at_least_100'],
      }),
    });

    const state = await ui.submitDonation(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('invalid_donation');
    }
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createMobileDonationUi({
      donationClient: makeDonationClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'r2_secret key', 'bearer abc123'],
      }),
    });

    const state = await ui.submitDonation(validInput);
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('r2_secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('automated tier multibanco → submitted_automated state with reference', async () => {
    const ui = createMobileDonationUi({
      donationClient: makeDonationClient({
        ok: true,
        status: 'donation_created',
        donationId: 'donation-auto-001',
        tier: 'automated',
        provider: 'eupago',
        reference: { method: 'multibanco', entity: '10611', reference: '123456789', expiresAt: null },
      }),
    });

    const state = await ui.submitDonation(validInput);

    expect(state.state).toBe('submitted_automated');
    if (state.state === 'submitted_automated') {
      expect(state.donationId).toBe('donation-auto-001');
      expect(state.provider).toBe('eupago');
      expect(state.reference.method).toBe('multibanco');
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('payment_reference_failed → failed state with that status', async () => {
    const ui = createMobileDonationUi({
      donationClient: makeDonationClient({
        ok: false,
        status: 'payment_reference_failed',
        reasons: ['psp_error'],
      }),
    });

    const state = await ui.submitDonation(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('payment_reference_failed');
      expect(state.canRetry).toBe(true);
    }
  });

  it('provider_credentials_unavailable → failed state with that status', async () => {
    const ui = createMobileDonationUi({
      donationClient: makeDonationClient({
        ok: false,
        status: 'provider_credentials_unavailable',
        reasons: ['provider_credentials_unavailable'],
      }),
    });

    const state = await ui.submitDonation(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('provider_credentials_unavailable');
    }
  });

  it('mobileDonationUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(mobileDonationUiContent.locale).toBe('pt-PT');
    expect(mobileDonationUiContent.status).toBe('product-flow-ready');
    expect(mobileDonationUiContent.title).toBeTruthy();
    expect(mobileDonationUiContent.description).toBeTruthy();
  });

  it('mobile foundation content exposes donation with product-flow-ready status', () => {
    expect(mobileFoundationContent.donation.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.donation.title).toBeTruthy();
    expect(mobileFoundationContent.donation.description).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.donation)).not.toContain('service-role');
  });
});
