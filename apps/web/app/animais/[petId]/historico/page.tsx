'use client';

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { createPetStatusHistoryClient } from '@pic4paws/client';
import type { ShelterPetStatus } from '@pic4paws/client';
import {
  createWebPetStatusHistoryUi,
  type WebPetStatusHistoryState,
} from '../../../../src/pet-status-history';
import { workerUrl } from '../../../../src/env';

const STATUS_LABELS: Record<ShelterPetStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  adoption_pending: 'Adoção pendente',
  adopted: 'Adotado',
  not_available: 'Indisponível',
  archived: 'Arquivado',
};

export default function HistoricoPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const [viewModel, setViewModel] = useState<WebPetStatusHistoryState | null>(null);

  const load = useCallback(async () => {
    setViewModel(null);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const petStatusHistoryClient = createPetStatusHistoryClient({
      workerBaseUrl: workerUrl(),
      petFeedPath: '/pets',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebPetStatusHistoryUi({ petStatusHistoryClient });
    ui.loadHistory(petId).then(setViewModel);
  }, [petId]);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return <p>A carregar histórico...</p>;
  }

  if (viewModel.state === 'forbidden') {
    return (
      <main>
        <p>Não tens acesso ao histórico deste animal.</p>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <p>Não foi possível carregar o histórico.</p>
        <button type="button" onClick={load}>Tentar de novo</button>
      </main>
    );
  }

  return (
    <main>
      <h1>Histórico de estados</h1>
      {viewModel.events.length === 0 ? (
        <p>Ainda não há alterações de estado registadas.</p>
      ) : (
        <ul>
          {viewModel.events.map((evt) => (
            <li key={evt.id}>
              {STATUS_LABELS[evt.fromStatus as ShelterPetStatus] ?? evt.fromStatus}
              {' → '}
              {STATUS_LABELS[evt.toStatus as ShelterPetStatus] ?? evt.toStatus}
              {' — '}
              {new Date(evt.createdAt).toLocaleDateString('pt-PT')}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
