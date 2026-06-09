import { describe, expect, it, vi } from 'vitest';
import {
  createWebNotificationPreferencesUi,
  webNotificationPreferencesUiContent,
} from '../../apps/web/src/notification-preferences';
import { webFoundationContent } from '../../apps/web/src/foundation';
import type {
  NotificationPreferencesClient,
  LoadNotificationPreferencesClientResult,
  UpdateNotificationPreferencesClientResult,
  NotificationPreferenceItem,
} from '../../packages/client/src/index';

const allEnabled: NotificationPreferenceItem[] = [
  { type: 'adoption_status_changed', enabled: true },
  { type: 'new_adoption_application', enabled: true },
  { type: 'donation_paid', enabled: true },
  { type: 'sponsorship_status_changed', enabled: true },
];

const makeClient = (
  loadResult: LoadNotificationPreferencesClientResult,
  updateResult: UpdateNotificationPreferencesClientResult = { ok: true, status: 'ok', preferences: allEnabled },
): Pick<NotificationPreferencesClient, 'loadPreferences' | 'updatePreferences'> => ({
  loadPreferences: vi.fn().mockResolvedValue(loadResult),
  updatePreferences: vi.fn().mockResolvedValue(updateResult),
});

describe('web notification preferences UI', () => {
  it('getInitialState returns idle state', () => {
    const ui = createWebNotificationPreferencesUi({
      notificationPreferencesClient: makeClient({ ok: true, status: 'ok', preferences: allEnabled }),
    });

    const state = ui.getInitialState();

    expect(state.state).toBe('idle');
    expect(webNotificationPreferencesUiContent.locale).toBe('pt-PT');
    expect(webNotificationPreferencesUiContent.status).toBe('product-flow-ready');
  });

  it('loadPreferences returns loaded state with preferences', async () => {
    const ui = createWebNotificationPreferencesUi({
      notificationPreferencesClient: makeClient({ ok: true, status: 'ok', preferences: allEnabled }),
    });

    const state = await ui.loadPreferences();

    expect(state.state).toBe('loaded');
    if (state.state === 'loaded') {
      expect(state.preferences).toHaveLength(4);
    }
  });

  it('loadPreferences returns failed state on worker_request_failed', async () => {
    const ui = createWebNotificationPreferencesUi({
      notificationPreferencesClient: makeClient({
        ok: false,
        status: 'worker_request_failed',
        reasons: ['network_error'],
      }),
    });

    const state = await ui.loadPreferences();

    expect(state.state).toBe('failed');
    if (state.state === 'failed') {
      expect(state.message).toBeTruthy();
    }
  });

  it('loadPreferences returns failed state on unauthenticated', async () => {
    const ui = createWebNotificationPreferencesUi({
      notificationPreferencesClient: makeClient({
        ok: false,
        status: 'unauthenticated',
        reasons: ['missing_access_token'],
      }),
    });

    const state = await ui.loadPreferences();

    expect(state.state).toBe('failed');
  });

  it('updatePreference returns optimistically updated loaded state', async () => {
    const client = makeClient({ ok: true, status: 'ok', preferences: allEnabled });
    const ui = createWebNotificationPreferencesUi({ notificationPreferencesClient: client });

    const loadedState = await ui.loadPreferences();
    if (loadedState.state !== 'loaded') throw new Error('expected loaded');

    const updated = await ui.updatePreference(loadedState, 'donation_paid', false);

    expect(updated.state).toBe('loaded');
    if (updated.state === 'loaded') {
      const pref = updated.preferences.find((p) => p.type === 'donation_paid');
      expect(pref?.enabled).toBe(false);
      const others = updated.preferences.filter((p) => p.type !== 'donation_paid');
      expect(others.every((p) => p.enabled)).toBe(true);
    }
  });

  it('updatePreference fires background update without awaiting', async () => {
    const client = makeClient({ ok: true, status: 'ok', preferences: allEnabled });
    const ui = createWebNotificationPreferencesUi({ notificationPreferencesClient: client });

    const loadedState = await ui.loadPreferences();
    if (loadedState.state !== 'loaded') throw new Error('expected loaded');

    await ui.updatePreference(loadedState, 'donation_paid', false);

    expect(client.updatePreferences).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ type: 'donation_paid', enabled: false })]),
    );
  });

  it('webNotificationPreferencesUiContent has pt-PT locale and product-flow-ready status', () => {
    expect(webNotificationPreferencesUiContent.locale).toBe('pt-PT');
    expect(webNotificationPreferencesUiContent.status).toBe('product-flow-ready');
    expect(webNotificationPreferencesUiContent.title).toBeTruthy();
  });

  it('web foundation content exposes notificationPreferences with product-flow-ready status', () => {
    expect(webFoundationContent.notificationPreferences.status).toBe('product-flow-ready');
    expect(webFoundationContent.notificationPreferences.title).toBeTruthy();
    expect(JSON.stringify(webFoundationContent.notificationPreferences)).not.toContain('service-role');
  });
});
