import { describe, it, expect } from 'vitest';
import { createMobileNotificationPreferencesUi } from '../../apps/mobile/src/notification-preferences';
import type {
  NotificationPreferencesClient,
  LoadNotificationPreferencesClientResult,
  UpdateNotificationPreferencesClientResult,
} from '@pic4paws/client';

const makeClient = (opts: {
  load?: LoadNotificationPreferencesClientResult;
  update?: UpdateNotificationPreferencesClientResult;
}): Pick<NotificationPreferencesClient, 'loadPreferences' | 'updatePreferences'> => ({
  loadPreferences: async () =>
    opts.load ?? { ok: true, status: 'ok', preferences: [] },
  updatePreferences: async () =>
    opts.update ?? { ok: false, status: 'worker_request_failed', reasons: [] },
});

const preferences = [
  { type: 'donation_paid' as const, enabled: true },
  { type: 'new_adoption_application' as const, enabled: false },
];

describe('mobile notification preferences screen — boundary contract', () => {
  it('produces loaded state with preferences', async () => {
    const client = makeClient({ load: { ok: true, status: 'ok', preferences } });
    const ui = createMobileNotificationPreferencesUi({ notificationPreferencesClient: client });
    const result = await ui.loadPreferences();
    expect(result.state).toBe('loaded');
    if (result.state === 'loaded') expect(result.preferences).toHaveLength(2);
  });

  it('produces failed state on load error', async () => {
    const client = makeClient({ load: { ok: false, status: 'worker_request_failed', reasons: [] } });
    const ui = createMobileNotificationPreferencesUi({ notificationPreferencesClient: client });
    const result = await ui.loadPreferences();
    expect(result.state).toBe('failed');
  });

  it('produces updated loaded state on successful toggle', async () => {
    const client = makeClient({
      load: { ok: true, status: 'ok', preferences },
      update: { ok: true, status: 'ok', preferences: [{ type: 'donation_paid', enabled: false }, { type: 'new_adoption_application', enabled: false }] },
    });
    const ui = createMobileNotificationPreferencesUi({ notificationPreferencesClient: client });
    const loaded = await ui.loadPreferences();
    if (loaded.state !== 'loaded') throw new Error('expected loaded');
    const result = await ui.updatePreference(loaded, 'donation_paid', false);
    expect(result.state).toBe('loaded');
  });

  it('getInitialState returns idle state', () => {
    const client = makeClient({});
    const ui = createMobileNotificationPreferencesUi({ notificationPreferencesClient: client });
    expect(ui.getInitialState().state).toBe('idle');
  });
});
