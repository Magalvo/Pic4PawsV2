import { describe, expect, it } from 'vitest';
import {
  createMobileShelterMemberUi,
  mobileShelterMemberUiContent,
} from '../../apps/mobile/src/shelter-member';
import { mobileFoundationContent } from '../../apps/mobile/src/foundation';
import type {
  ShelterMemberClient,
  ShelterMemberLoadResult,
  ShelterMemberAddResult,
  ShelterMemberRemoveResult,
} from '../../packages/client/src/index';


const makeFullClient = (
  loadResult: ShelterMemberLoadResult,
  addResult?: ShelterMemberAddResult,
  removeResult?: ShelterMemberRemoveResult,
): ShelterMemberClient => ({
  loadShelterMembers: async () => loadResult,
  addShelterMember: async () =>
    addResult ?? { ok: false, status: 'worker_request_failed', reasons: ['not_configured'] },
  removeShelterMember: async () =>
    removeResult ?? { ok: false, status: 'worker_request_failed', reasons: ['not_configured'] },
});

describe('mobile shelter member UI', () => {
  it('getInitialState returns idle state with PT-PT copy', () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: {
        loadShelterMembers: async () => { throw new Error('should not be called'); },
        addShelterMember: async () => { throw new Error('should not be called'); },
        removeShelterMember: async () => { throw new Error('should not be called'); },
      },
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(state.title).toBeTruthy();
    expect(state.message).toBeTruthy();
    expect(state.primaryAction).toBeTruthy();
    expect(mobileShelterMemberUiContent.locale).toBe('pt-PT');
    expect(mobileShelterMemberUiContent.status).toBe('product-flow-ready');
  });

  it('mobileShelterMemberUiContent has all 8 required states', () => {
    const stateNames = mobileShelterMemberUiContent.states.map((s) => s.state);

    expect(stateNames).toContain('idle');
    expect(stateNames).toContain('loading');
    expect(stateNames).toContain('loaded');
    expect(stateNames).toContain('forbidden');
    expect(stateNames).toContain('failed');
    expect(stateNames).toContain('member_added');
    expect(stateNames).toContain('member_removed');
    expect(stateNames).toContain('action_failed');
    expect(stateNames).toHaveLength(8);
  });

  it('loadShelterMembers success returns loaded state with members', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient({
        ok: true,
        status: 'ok',
        members: [
          { memberId: 'm-1', userId: 'u-1', role: 'shelter_owner', joinedAt: '2026-01-01T00:00:00Z' },
        ],
        total: 1,
      }),
    });

    const state = await ui.loadShelterMembers('shelter-001');

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.members).toHaveLength(1);
      expect(state.members[0].memberId).toBe('m-1');
      expect(state.total).toBe(1);
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadShelterMembers success with empty list returns loaded state', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient({ ok: true, status: 'ok', members: [], total: 0 }),
    });

    const state = await ui.loadShelterMembers('shelter-001');

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.members).toHaveLength(0);
      expect(state.total).toBe(0);
    }
  });

  it('loadShelterMembers forbidden returns forbidden state', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient({
        ok: false,
        status: 'forbidden',
        reasons: ['forbidden'],
      }),
    });

    const state = await ui.loadShelterMembers('shelter-001');

    expect(state.state).toBe('forbidden');
    if (state.state === 'forbidden') {
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('loadShelterMembers worker_request_failed returns failed state with canRetry', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadShelterMembers('shelter-001');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('worker_request_failed');
      expect(state.canRetry).toBe(true);
    }
  });

  it('loadShelterMembers unauthenticated returns failed state', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });

    const state = await ui.loadShelterMembers('shelter-001');

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.status).toBe('unauthenticated');
    }
  });

  it('addShelterMember success returns member_added state', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient(
        { ok: true, status: 'ok', members: [], total: 0 },
        { ok: true, status: 'ok', memberId: 'm-new', userId: 'u-new', role: 'shelter_member' },
      ),
    });

    const state = await ui.addShelterMember('shelter-001', { userId: 'u-new', role: 'shelter_member' });

    expect(state.state).toBe('member_added');
    if (state.state === 'member_added') {
      expect(state.memberId).toBe('m-new');
      expect(state.userId).toBe('u-new');
      expect(state.role).toBe('shelter_member');
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('addShelterMember member_already_exists returns action_failed state', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient(
        { ok: true, status: 'ok', members: [], total: 0 },
        { ok: false, status: 'member_already_exists', reasons: ['member_already_exists'] },
      ),
    });

    const state = await ui.addShelterMember('shelter-001', { userId: 'u-1', role: 'shelter_member' });

    expect(state.state).toBe('action_failed');
    if (state.state === 'action_failed') {
      expect(state.status).toBe('member_already_exists');
      expect(state.canRetry).toBe(true);
    }
  });

  it('addShelterMember network error returns action_failed state', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient(
        { ok: true, status: 'ok', members: [], total: 0 },
        { ok: false, status: 'worker_request_failed', reasons: ['network_error'] },
      ),
    });

    const state = await ui.addShelterMember('shelter-001', { userId: 'u-1', role: 'shelter_member' });

    expect(state.state).toBe('action_failed');
  });

  it('addShelterMember shelter_member_repository_not_configured returns action_failed state', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient(
        { ok: true, status: 'ok', members: [], total: 0 },
        { ok: false, status: 'shelter_member_repository_not_configured', reasons: ['shelter_member_repository_not_configured'] },
      ),
    });

    const state = await ui.addShelterMember('shelter-001', { userId: 'u-1', role: 'shelter_member' });

    expect(state.state).toBe('action_failed');
    if (state.state === 'action_failed') {
      expect(state.status).toBe('shelter_member_repository_not_configured');
    }
  });

  it('removeShelterMember success returns member_removed state', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient(
        { ok: true, status: 'ok', members: [], total: 0 },
        undefined,
        { ok: true, status: 'ok', memberId: 'm-1' },
      ),
    });

    const state = await ui.removeShelterMember('shelter-001', 'm-1');

    expect(state.state).toBe('member_removed');
    if (state.state === 'member_removed') {
      expect(state.memberId).toBe('m-1');
      expect(state.title).toBeTruthy();
      expect(state.message).toBeTruthy();
    }
  });

  it('removeShelterMember member_not_found returns action_failed state', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient(
        { ok: true, status: 'ok', members: [], total: 0 },
        undefined,
        { ok: false, status: 'member_not_found', reasons: ['member_not_found'] },
      ),
    });

    const state = await ui.removeShelterMember('shelter-001', 'm-1');

    expect(state.state).toBe('action_failed');
    if (state.state === 'action_failed') {
      expect(state.status).toBe('member_not_found');
    }
  });

  it('removeShelterMember network error returns action_failed state', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient(
        { ok: true, status: 'ok', members: [], total: 0 },
        undefined,
        { ok: false, status: 'worker_request_failed', reasons: ['network_error'] },
      ),
    });

    const state = await ui.removeShelterMember('shelter-001', 'm-1');

    expect(state.state).toBe('action_failed');
  });

  it('failed state strips credential markers from reasons', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['safe_reason', 'service-role-secret', 'bearer abc123'],
      }),
    });

    const state = await ui.loadShelterMembers('shelter-001');
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer abc123');
  });

  it('action_failed state strips credential markers from reasons', async () => {
    const ui = createMobileShelterMemberUi({
      shelterMemberClient: makeFullClient(
        { ok: true, status: 'ok', members: [], total: 0 },
        { ok: false, status: 'worker_request_failed', reasons: ['service-role-secret', 'bearer token'] },
      ),
    });

    const state = await ui.addShelterMember('shelter-001', { userId: 'u-1', role: 'shelter_member' });
    const serialized = JSON.stringify(state);

    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('bearer token');
  });

  it('mobileShelterMemberUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(mobileShelterMemberUiContent.locale).toBe('pt-PT');
    expect(mobileShelterMemberUiContent.status).toBe('product-flow-ready');
    expect(mobileShelterMemberUiContent.title).toBeTruthy();
    expect(mobileShelterMemberUiContent.description).toBeTruthy();
  });

  it('mobile foundation content exposes shelterMember with product-flow-ready status', () => {
    expect(mobileFoundationContent.shelterMember.status).toBe('product-flow-ready');
    expect(mobileFoundationContent.shelterMember.title).toBeTruthy();
    expect(mobileFoundationContent.shelterMember.description).toBeTruthy();
    expect(JSON.stringify(mobileFoundationContent.shelterMember)).not.toContain('service-role');
  });
});
