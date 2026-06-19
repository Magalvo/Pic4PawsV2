import { describe, it, expect } from 'vitest';
import { createMobileShelterMemberUi } from '../../apps/mobile/src/shelter-member';
import type {
  ShelterMemberClient,
  ShelterMemberLoadResult,
  ShelterMemberAddResult,
  ShelterMemberRemoveResult,
} from '@pic4paws/client';

const makeClient = (opts: {
  load?: ShelterMemberLoadResult;
  add?: ShelterMemberAddResult;
  remove?: ShelterMemberRemoveResult;
}): Pick<ShelterMemberClient, 'loadShelterMembers' | 'addShelterMember' | 'removeShelterMember'> => ({
  loadShelterMembers: async () => opts.load ?? { ok: true, status: 'ok', members: [], total: 0 },
  addShelterMember: async () => opts.add ?? { ok: false, status: 'worker_request_failed', reasons: [] },
  removeShelterMember: async () => opts.remove ?? { ok: false, status: 'worker_request_failed', reasons: [] },
});

const member = {
  memberId: 'mem-001',
  userId: 'user-001',
  role: 'shelter_member' as const,
  joinedAt: '2026-06-18T00:00:00.000Z',
};

describe('mobile shelter member screen — boundary contract', () => {
  it('produces loaded state with members', async () => {
    const client = makeClient({ load: { ok: true, status: 'ok', members: [member], total: 1 } });
    const ui = createMobileShelterMemberUi({ shelterMemberClient: client });
    const result = await ui.loadShelterMembers('shelter-001');
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') {
      expect(result.members).toHaveLength(1);
      expect(result.members[0]?.memberId).toBe('mem-001');
    }
  });

  it('produces forbidden state on load', async () => {
    const client = makeClient({ load: { ok: false, status: 'forbidden', reasons: [] } });
    const ui = createMobileShelterMemberUi({ shelterMemberClient: client });
    const result = await ui.loadShelterMembers('shelter-001');
    expect(result.state).toBe('forbidden');
  });

  it('produces member_added state on successful add', async () => {
    const client = makeClient({
      add: { ok: true, status: 'ok', memberId: 'mem-002', userId: 'user-002', role: 'shelter_member' },
    });
    const ui = createMobileShelterMemberUi({ shelterMemberClient: client });
    const result = await ui.addShelterMember('shelter-001', { userId: 'user-002', role: 'shelter_member' });
    expect(result.state).toBe('member_added');
    if (result.state === 'member_added') expect(result.memberId).toBe('mem-002');
  });

  it('produces member_removed state on successful remove', async () => {
    const client = makeClient({
      remove: { ok: true, status: 'ok', memberId: 'mem-001' },
    });
    const ui = createMobileShelterMemberUi({ shelterMemberClient: client });
    const result = await ui.removeShelterMember('shelter-001', 'mem-001');
    expect(result.state).toBe('member_removed');
    if (result.state === 'member_removed') expect(result.memberId).toBe('mem-001');
  });

  it('produces action_failed state on add error', async () => {
    const client = makeClient({ add: { ok: false, status: 'worker_request_failed', reasons: [] } });
    const ui = createMobileShelterMemberUi({ shelterMemberClient: client });
    const result = await ui.addShelterMember('shelter-001', { userId: 'u', role: 'shelter_member' });
    expect(result.state).toBe('action_failed');
    if (result.state === 'action_failed') expect(result.canRetry).toBe(true);
  });

  it('getInitialState returns idle state', () => {
    const client = makeClient({});
    const ui = createMobileShelterMemberUi({ shelterMemberClient: client });
    expect(ui.getInitialState().state).toBe('idle');
  });

  it('failed state does not expose bearer or service-role', async () => {
    const client = makeClient({ load: { ok: false, status: 'forbidden', reasons: ['Bearer eyJ...', 'service-role key leaked'] } });
    const ui = createMobileShelterMemberUi({ shelterMemberClient: client });
    const result = await ui.loadShelterMembers('shelter-001');
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('service-role');
    expect(serialized).not.toContain('bearer ');
  });
});
