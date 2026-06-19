import { describe, it, expect } from 'vitest';
import { createWebSponsorshipManageUi } from '../../apps/web/src/sponsorship-manage';
import type {
  SponsorshipManageClient,
  SponsorshipManageClientResult,
} from '@pic4paws/client';

const makeClient = (
  result: SponsorshipManageClientResult,
): Pick<SponsorshipManageClient, 'manageSponsorship'> => ({
  manageSponsorship: async () => result,
});

describe('web sponsorship manage page — boundary contract', () => {
  it('produces succeeded state on success', async () => {
    const client = makeClient({
      ok: true,
      status: 'ok',
      sponsorshipId: 'sp-001',
      newStatus: 'cancelled',
    });
    const ui = createWebSponsorshipManageUi({ sponsorshipManageClient: client });
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
    const ui = createWebSponsorshipManageUi({ sponsorshipManageClient: client });
    const result = await ui.manageSponsorship('sp-001', 'paused');
    if (result.state === 'succeeded') {
      expect(result.sponsorshipId).toBe('sp-001');
      expect(result.newStatus).toBe('paused');
    }
  });

  it('produces failed state on network error', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: [] });
    const ui = createWebSponsorshipManageUi({ sponsorshipManageClient: client });
    const result = await ui.manageSponsorship('sp-001', 'cancelled');
    expect(result.state).toBe('failed');
  });

  it('failed state does not expose bearer or service-role', async () => {
    const client = makeClient({ ok: false, status: 'worker_request_failed', reasons: ['Bearer eyJ...', 'service-role key leaked'] });
    const ui = createWebSponsorshipManageUi({ sponsorshipManageClient: client });
    const result = await ui.manageSponsorship('sp-001', 'cancelled');
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
