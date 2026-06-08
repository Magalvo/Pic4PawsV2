import { describe, expect, it } from 'vitest';
import {
  createMobileSponsorshipUi,
  mobileSponsorshipUiContent,
} from '../../apps/mobile/src/sponsorship';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  SponsorshipClient,
  SponsorshipClientInput,
  SponsorshipClientResult,
} from '../../packages/client/src/index';

const makeSponsorshipClient = (
  result: SponsorshipClientResult,
): Pick<SponsorshipClient, 'submitSponsorship'> => ({
  submitSponsorship: async () => result,
});

const validInput: SponsorshipClientInput = {
  shelterId: 'shelter-a',
  amountCents: 1000,
  paymentMethod: 'mb_way',
  recurringInterval: 'monthly',
  petId: null,
  dataProcessingAccepted: true,
};

const successResult: SponsorshipClientResult = {
  ok: true,
  status: 'sponsorship_created',
  sponsorshipId: 'sponsorship-001',
  amountCents: 1000,
  currency: 'EUR',
  recurringInterval: 'monthly',
  shelterId: 'shelter-a',
  createdAt: '2026-06-08T10:00:00.000Z',
};

describe('mobile sponsorship UI', () => {
  it('getInitialState returns idle state with PT-PT copy and primaryAction', () => {
    const ui = createMobileSponsorshipUi({
      sponsorshipClient: { submitSponsorship: async () => { throw new Error('no call'); } },
    });
    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.primaryAction).toBeTruthy();
    expect(mobileSponsorshipUiContent.locale).toBe('pt-PT');
    expect(mobileSponsorshipUiContent.status).toBe('product-flow-ready');
  });

  it('mobileSponsorshipUiContent has all 4 required states', () => {
    const stateNames = mobileSponsorshipUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('submitting');
    expect(stateNames).toContain('submitted');
    expect(stateNames).toContain('failed');
    expect(stateNames).toHaveLength(4);
  });

  it('submitSponsorship with success returns submitted state with all fields', async () => {
    const ui = createMobileSponsorshipUi({
      sponsorshipClient: makeSponsorshipClient(successResult),
    });
    const state = await ui.submitSponsorship(validInput);

    expect(state.state).toBe('submitted');
    if (state.state === 'submitted') {
      expect(state.sponsorshipId).toBe('sponsorship-001');
      expect(state.amountCents).toBe(1000);
      expect(state.currency).toBe('EUR');
      expect(state.recurringInterval).toBe('monthly');
      expect(state.shelterId).toBe('shelter-a');
      expect(state.createdAt).toBeTruthy();
    }
  });

  it('submitSponsorship worker_request_failed returns failed with canRetry true', async () => {
    const ui = createMobileSponsorshipUi({
      sponsorshipClient: makeSponsorshipClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });
    const state = await ui.submitSponsorship(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
    }
  });

  it('submitSponsorship unauthenticated returns failed state', async () => {
    const ui = createMobileSponsorshipUi({
      sponsorshipClient: makeSponsorshipClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });
    const state = await ui.submitSponsorship(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') expect(state.status).toBe('unauthenticated');
  });

  it('submitSponsorship invalid_sponsorship returns failed state', async () => {
    const ui = createMobileSponsorshipUi({
      sponsorshipClient: makeSponsorshipClient({
        ok: false,
        status: 'invalid_sponsorship',
        reasons: ['amount_cents_must_be_at_least_100'],
      }),
    });
    const state = await ui.submitSponsorship(validInput);

    expect(state.state).toBe('failed');
    if (state.state === 'failed') expect(state.status).toBe('invalid_sponsorship');
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createMobileSponsorshipUi({
      sponsorshipClient: makeSponsorshipClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    });
    const state = await ui.submitSponsorship(validInput);
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('mobileSponsorshipUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(mobileSponsorshipUiContent.locale).toBe('pt-PT');
    expect(mobileSponsorshipUiContent.status).toBe('product-flow-ready');
    expect(mobileSponsorshipUiContent.title).toBeTruthy();
    expect(mobileSponsorshipUiContent.description).toBeTruthy();
  });

  it('mobile foundation content exposes sponsorship with product-flow-ready status', () => {
    expect(mobileFoundationContent.sponsorship.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.sponsorship.title).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.sponsorship)).not.toContain('service-role');
  });
});
