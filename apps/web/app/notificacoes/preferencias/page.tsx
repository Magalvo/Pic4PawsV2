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
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl animate-pulse">⚙️</span>
          <p className="mt-4 text-muted text-sm" aria-live="polite">A carregar preferências...</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl">⚠️</span>
          <p className="mt-4 text-sm text-muted">Não foi possível carregar as preferências.</p>
          <button type="button" onClick={load} className="mt-4 px-4 py-2 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors">
            Tentar de novo
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <a href="/notificacoes" className="text-sm text-muted hover:text-ink transition-colors">← Notificações</a>
        <h1 className="text-2xl font-extrabold text-ink">Preferências de notificação</h1>
      </div>

      <p className="text-sm text-muted mb-4">Escolhe que notificações queres receber.</p>

      <div className="bg-surface rounded-card border border-border shadow-sm overflow-hidden">
        {viewModel.preferences.map((pref, i) => (
          <label
            key={pref.type}
            className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-bg/60 transition-colors ${i > 0 ? 'border-t border-border' : ''}`}
          >
            <span className="text-sm font-medium text-ink">
              {TYPE_LABELS[pref.type as NotificationClientType] ?? pref.type}
            </span>
            <span className="relative shrink-0 ml-4">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={pref.enabled}
                onChange={(e) => handleToggle(pref.type, e.target.checked)}
              />
              <span
                className={`block w-10 h-6 rounded-pill transition-colors ${pref.enabled ? 'bg-primary' : 'bg-border'}`}
                aria-hidden="true"
              />
              <span
                className={`absolute top-1 left-1 block w-4 h-4 rounded-full bg-white shadow transition-transform ${pref.enabled ? 'translate-x-4' : 'translate-x-0'}`}
                aria-hidden="true"
              />
            </span>
          </label>
        ))}
      </div>
    </main>
  );
}
