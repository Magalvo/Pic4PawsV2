'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '../../src/supabase-browser';
import { createNotificationClient } from '@pic4paws/client';
import type { NotificationClientType } from '@pic4paws/client';
import {
  createWebNotificationUi,
  type WebNotificationState,
  type WebNotificationLoadedState,
} from '../../src/notification';
import { workerUrl } from '../../src/env';

const TYPE_LABELS: Record<NotificationClientType, string> = {
  adoption_status_changed: 'Estado de adoção alterado',
  new_adoption_application: 'Nova candidatura de adoção',
  donation_paid: 'Donativo recebido',
  sponsorship_status_changed: 'Estado de apadrinhamento alterado',
};

export default function NotificacoesPage() {
  const [viewModel, setViewModel] = useState<WebNotificationState | null>(null);

  const makeUi = useCallback(() => {
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const notificationClient = createNotificationClient({
      workerBaseUrl: workerUrl(),
      notificationsPath: '/notifications',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    return createWebNotificationUi({ notificationClient });
  }, []);

  const load = useCallback(() => {
    setViewModel(null);
    makeUi().loadNotifications().then(setViewModel);
  }, [makeUi]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = useCallback(async (notificationId: string) => {
    const current = viewModel;
    if (!current || current.state !== 'loaded') return;
    const next = await makeUi().markRead(current as WebNotificationLoadedState, notificationId);
    setViewModel(next);
  }, [viewModel, makeUi]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl animate-pulse">🔔</span>
          <p className="mt-4 text-muted text-sm" aria-live="polite">A carregar notificações...</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl">⚠️</span>
          <p className="mt-4 text-sm text-muted">Não foi possível carregar as notificações.</p>
          <button type="button" onClick={load} className="mt-4 px-4 py-2 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors">
            Tentar de novo
          </button>
        </div>
      </main>
    );
  }

  if (viewModel.notifications.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold text-ink mb-6">Notificações</h1>
        <div className="text-center py-16">
          <span className="text-4xl">🔕</span>
          <p className="mt-4 text-sm text-muted">Não tens notificações.</p>
          <a href="/notificacoes/preferencias" className="mt-3 inline-block text-primary text-sm font-semibold hover:underline">
            Gerir preferências →
          </a>
        </div>
      </main>
    );
  }

  const unreadCount = viewModel.notifications.filter((n) => !n.readAt).length;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Notificações</h1>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-primary/10 text-primary">
              {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
            </span>
          )}
          <a href="/notificacoes/preferencias" className="text-xs text-muted hover:text-ink transition-colors">Preferências</a>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {viewModel.notifications.map((n) => (
          <div
            key={n.notificationId}
            className={`bg-surface rounded-card border p-4 shadow-sm flex items-start justify-between gap-4 transition-colors ${!n.readAt ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {!n.readAt && (
                <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-primary" aria-label="Não lida" />
              )}
              <div>
                <p className={`text-sm ${!n.readAt ? 'font-semibold text-ink' : 'font-medium text-muted'}`}>
                  {TYPE_LABELS[n.type] ?? n.type}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(n.createdAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            {!n.readAt && (
              <button
                type="button"
                onClick={() => handleMarkRead(n.notificationId)}
                className="shrink-0 px-3 py-1.5 rounded-control border border-border text-xs font-semibold text-muted hover:text-ink transition-colors"
              >
                Marcar lida
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
