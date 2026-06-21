'use client';

import { useEffect, useState, useRef } from 'react';
import { createAdminPendingSheltersClient } from '@pic4paws/client';
import {
  createWebAdminPendingSheltersUi,
  type WebAdminPendingSheltersState,
} from '../../../src/admin-pending-shelters';
import { createSupabaseBrowserClient } from '../../../src/supabase-browser';
import { workerUrl } from '../../../src/env';

type AdminPendingSheltersUi = ReturnType<typeof createWebAdminPendingSheltersUi>;

export default function AdminAbrigosPendentesPage() {
  const [viewModel, setViewModel] = useState<WebAdminPendingSheltersState | null>(null);
  const uiRef = useRef<AdminPendingSheltersUi | null>(null);

  const getUi = (): AdminPendingSheltersUi => {
    if (uiRef.current) return uiRef.current;
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const adminPendingSheltersClient = createAdminPendingSheltersClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    uiRef.current = createWebAdminPendingSheltersUi({ adminPendingSheltersClient });
    return uiRef.current;
  };

  const load = async () => {
    const result = await getUi().loadPendingShelters();
    setViewModel(result);
  };

  useEffect(() => {
    setViewModel(getUi().getInitialState());
    load();
  }, []);

  if (viewModel === null) {
    return (
      <main>
        <p aria-live="polite">A carregar...</p>
      </main>
    );
  }

  if (viewModel.state === 'idle') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <button onClick={load}>{viewModel.primaryAction}</button>
      </main>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href="/">Voltar ao início</a>
      </main>
    );
  }

  if (viewModel.state === 'empty') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <button onClick={load}>Recarregar</button>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        {viewModel.status === 'unauthenticated' && (
          <a href="/entrar">Entrar na conta</a>
        )}
        <button onClick={load}>Tentar de novo</button>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.total} abrigo(s) por rever</p>
      <ul>
        {viewModel.shelters.map((shelter) => (
          <li key={shelter.id}>
            <a href={shelter.reviewHref}>
              {shelter.name} — {shelter.city}
            </a>
          </li>
        ))}
      </ul>
      <button onClick={load}>Recarregar</button>
    </main>
  );
}
