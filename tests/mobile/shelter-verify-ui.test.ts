import { describe, expect, it, vi } from 'vitest';
import { createMobileShelterVerifyUi } from '../../apps/mobile/src/shelter-verify';
import type {
  ShelterVerificationClient,
  UpdateVerificationClientResult,
} from '../../packages/client/src/index';

const makeClient = (
  result: UpdateVerificationClientResult,
): Pick<ShelterVerificationClient, 'updateVerificationStatus'> => ({
  updateVerificationStatus: vi.fn().mockResolvedValue(result),
});

describe('createMobileShelterVerifyUi — updateVerificationStatus', () => {
  it('returns updated state for pending_review', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({ ok: true, status: 'updated', shelterId: 'shelter-1', verificationStatus: 'pending_review' }),
    });
    const state = await ui.updateVerificationStatus('shelter-1', 'pending_review');

    expect(state.state).toBe('updated');
    if (state.state === 'updated') {
      expect(state.shelterId).toBe('shelter-1');
      expect(state.verificationStatus).toBe('pending_review');
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('returns updated state for verified', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({ ok: true, status: 'updated', shelterId: 'shelter-1', verificationStatus: 'verified' }),
    });
    const state = await ui.updateVerificationStatus('shelter-1', 'verified');

    expect(state.state).toBe('updated');
    if (state.state === 'updated') expect(state.verificationStatus).toBe('verified');
  });

  it('returns updated state for rejected', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({ ok: true, status: 'updated', shelterId: 'shelter-1', verificationStatus: 'rejected' }),
    });
    const state = await ui.updateVerificationStatus('shelter-1', 'rejected');

    expect(state.state).toBe('updated');
    if (state.state === 'updated') expect(state.verificationStatus).toBe('rejected');
  });

  it('returns updated state for suspended', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({ ok: true, status: 'updated', shelterId: 'shelter-1', verificationStatus: 'suspended' }),
    });
    const state = await ui.updateVerificationStatus('shelter-1', 'suspended');

    expect(state.state).toBe('updated');
    if (state.state === 'updated') expect(state.verificationStatus).toBe('suspended');
  });

  it('returns failed with forbidden-specific copy', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({ ok: false, status: 'forbidden', reasons: ['forbidden'] }),
    });
    const state = await ui.updateVerificationStatus('shelter-1', 'verified');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('forbidden');
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns failed with invalid_transition-specific copy', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({ ok: false, status: 'invalid_transition', reasons: ['invalid_transition'] }),
    });
    const state = await ui.updateVerificationStatus('shelter-1', 'verified');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('invalid_transition');
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns failed with shelter_not_found-specific copy', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({ ok: false, status: 'shelter_not_found', reasons: ['shelter_not_found'] }),
    });
    const state = await ui.updateVerificationStatus('missing', 'pending_review');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('shelter_not_found');
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns failed with unauthenticated-specific copy', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({ ok: false, status: 'unauthenticated', reasons: ['missing_access_token'] }),
    });
    const state = await ui.updateVerificationStatus('shelter-1', 'pending_review');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
      expect(state.canRetry).toBe(true);
    }
  });

  it('returns failed with canRetry for generic failures', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({ ok: false, status: 'worker_request_failed', reasons: ['network_error'] }),
    });
    const state = await ui.updateVerificationStatus('shelter-1', 'pending_review');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') expect(state.canRetry).toBe(true);
  });

  it('sanitizes service-role and bearer patterns from failed state reasons', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['error', 'service-role-key', 'bearer token-value'],
      }),
    });
    const state = await ui.updateVerificationStatus('shelter-1', 'pending_review');

    expect(state.state).toBe('failed');
    const serialized = JSON.stringify(state);
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });

  it('sanitizes credentials in forbidden failed state', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({
        ok: false,
        status: 'forbidden',
        reasons: ['service-role-key', 'bearer token-value'],
      }),
    });
    const state = await ui.updateVerificationStatus('shelter-1', 'verified');

    expect(state.state).toBe('failed');
    const serialized = JSON.stringify(state);
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });

  it('sanitizes credentials in invalid_transition failed state', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({
        ok: false,
        status: 'invalid_transition',
        reasons: ['service-role-key', 'bearer token-value'],
      }),
    });
    const state = await ui.updateVerificationStatus('shelter-1', 'verified');

    expect(state.state).toBe('failed');
    const serialized = JSON.stringify(state);
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });

  it('sanitizes credentials in shelter_not_found failed state', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({
        ok: false,
        status: 'shelter_not_found',
        reasons: ['service-role-key', 'bearer token-value'],
      }),
    });
    const state = await ui.updateVerificationStatus('missing', 'pending_review');

    expect(state.state).toBe('failed');
    const serialized = JSON.stringify(state);
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });

  it('sanitizes credentials in unauthenticated failed state', async () => {
    const ui = createMobileShelterVerifyUi({
      shelterVerificationClient: makeClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['service-role-key', 'bearer token-value'],
      }),
    });
    const state = await ui.updateVerificationStatus('shelter-1', 'pending_review');

    expect(state.state).toBe('failed');
    const serialized = JSON.stringify(state);
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
