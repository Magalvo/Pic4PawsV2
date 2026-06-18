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
    return <p>A carregar notificações...</p>;
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <p>Não foi possível carregar as notificações.</p>
        <button type="button" onClick={load}>Tentar de novo</button>
      </main>
    );
  }

  if (viewModel.notifications.length === 0) {
    return (
      <main>
        <h1>Notificações</h1>
        <p>Não tens notificações.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Notificações</h1>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {viewModel.notifications.map((n) => (
          <li key={n.notificationId} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <strong>{TYPE_LABELS[n.type] ?? n.type}</strong>
            <br />
            <small>{new Date(n.createdAt).toLocaleDateString('pt-PT')}</small>
            {!n.readAt && (
              <>
                {' '}
                <button type="button" onClick={() => handleMarkRead(n.notificationId)}>
                  Marcar como lida
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
