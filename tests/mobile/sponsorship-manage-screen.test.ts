import { describe, it, expect } from 'vitest';
import { createMobileSponsorshipManageUi } from '../../apps/mobile/src/sponsorship-manage';
import type {
  SponsorshipManageClient,
  SponsorshipManageClientResult,
} from '@pic4paws/client';

const makeClient = (
  result: SponsorshipManageClientResult,
): Pick<SponsorshipManageClient, 'manageSponsorship'> => ({
  manageSponsorship: async () => result,
});

describe('mobile sponsorship manage screen — boundary contract', () => {
  it('produces succeeded state on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'ok',
      sponsorshipId: 'sp-001',
      newStatus: 'cancelled',
    });
    const ui = createMobileSponsorshipManageUi({ sponsorshipManageClient: client });
    const result = await ui.manageSponsorship('sp-001', 'cancelled');
    expect(result.state).toBe('succeeded');
  });

  it('succeeded state includes sponsorshipId and newStatus', async () => {
    const client = makeClient({
      ok: true,
      status: 'ok',
      sponsorshipId: 'sp-001',
      newStatus: 'paused',
    });
    const ui = createMobileSponsorshipManageUi({ sponsorshipManageClient: client });
    const result = await ui.manageSponsorship('sp-001', 'paused');
    if (result.state === 'succeeded') {
      expect(result.sponsorshipId).toBe('sp-001');
      expect(result.newStatus).toBe('paused');
    }
  });

  it('produces failed state with forbidden status', async () => {
    const client = makeClient({ ok: false, status: 'forbidden', reasons: [] });
    const ui = createMobileSponsorshipManageUi({ sponsorshipManageClient: client });
    const result = await ui.manageSponsorship('sp-001', 'cancelled');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.status).toBe('forbidden');
    }
  });

  it('produces failed state with canRetry on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileSponsorshipManageUi({ sponsorshipManageClient: client });
    const result = await ui.manageSponsorship('sp-001', 'cancelled');
    expect(result.state).toBe('failed');
    if (result.state === 'failed') {
      expect(result.canRetry).toBe(true);
    }
  });

  it('getInitialState returns idle state', () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createMobileSponsorshipManageUi({ sponsorshipManageClient: client });
    const state = ui.getInitialState();
    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
  });

  it('failed state does not expose bearer or service-role', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: ['Bearer eyJ...', 'service-role key leaked'] });
    const ui = createMobileSponsorshipManageUi({ sponsorshipManageClient: client });
    const result = await ui.manageSponsorship('sp-001', 'cancelled');
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
