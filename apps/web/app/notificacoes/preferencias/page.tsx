'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '../../../src/supabase-browser';
import { createNotificationPreferencesClient } from '@pic4paws/client';
import type { NotificationClientType } from '@pic4paws/client';
import {
  createWebNotificationPreferencesUi,
  type WebNotificationPreferencesState,
  type WebNotificationPreferencesLoadedState,
} from '../../../src/notification-preferences';
import { workerUrl } from '../../../src/env';

const TYPE_LABELS: Record<NotificationClientType, string> = {
  adoption_status_changed: 'Estado de adoção alterado',
  new_adoption_application: 'Nova candidatura de adoção',
  donation_paid: 'Donativo recebido',
  sponsorship_status_changed: 'Estado de apadrinhamento alterado',
};

export default function PreferenciasNotificacaoPage() {
  const [viewModel, setViewModel] = useState<WebNotificationPreferencesState | null>(null);

  const makeUi = useCallback(() => {
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const notificationPreferencesClient = createNotificationPreferencesClient({
      workerBaseUrl: workerUrl(),
      notificationsPath: '/notifications',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    return createWebNotificationPreferencesUi({ notificationPreferencesClient });
  }, []);

  const load = useCallback(() => {
    setViewModel(null);
    makeUi().loadPreferences().then(setViewModel);
  }, [makeUi]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = useCallback(async (type: string, enabled: boolean) => {
    const current = viewModel;
    if (!current || current.state !== 'loaded') return;
    const next = await makeUi().updatePreference(
      current as WebNotificationPreferencesLoadedState,
      type,
      enabled,
    );
    setViewModel(next);
  }, [viewModel, makeUi]);

  if (viewModel === null || viewModel.state === 'idle') {
    return <p>A carregar preferências...</p>;
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <p>Não foi possível carregar as preferências.</p>
        <button type="button" onClick={load}>Tentar de novo</button>
      </main>
    );
  }

  return (
    <main>
      <h1>Preferências de notificação</h1>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {viewModel.preferences.map((pref) => (
          <li key={pref.type} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <span>{TYPE_LABELS[pref.type as NotificationClientType] ?? pref.type}</span>
            <input
              type="checkbox"
              checked={pref.enabled}
              onChange={(e) => handleToggle(pref.type, e.target.checked)}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
