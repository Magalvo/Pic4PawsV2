import { describe, it, expect } from 'vitest';
import { createWebShelterMemberUi } from '../../apps/web/src/shelter-member';
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

describe('web shelter member page — boundary contract', () => {
  it('produces loaded state with members', async () => {
    const member = { memberId: 'm1', userId: 'u1', role: 'shelter_member' as const, joinedAt: '2026-06-18T00:00:00.000Z' };
    const client = makeClient({ load: { ok: true, status: 'ok', members: [member], total: 1 } });
    const ui = createWebShelterMemberUi({ shelterMemberClient: client });
    const result = await ui.loadShelterMembers('shelter-001');
    expect(result.state).toBe('loaded');
  });

  it('produces forbidden state', async () => {
    const client = makeClient({ load: { ok: false, status: 'forbidden', reasons: [] } });
    const ui = createWebShelterMemberUi({ shelterMemberClient: client });
    const result = await ui.loadShelterMembers('shelter-001');
    expect(result.state).toBe('forbidden');
  });

  it('produces member_added on successful add', async () => {
    const client = makeClient({
      add: { ok: true, status: 'ok', memberId: 'm2', userId: 'u2', role: 'shelter_member' },
    });
    const ui = createWebShelterMemberUi({ shelterMemberClient: client });
    const result = await ui.addShelterMember('shelter-001', { userId: 'u2', role: 'shelter_member' });
    expect(result.state).toBe('member_added');
  });
});
