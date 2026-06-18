'use client';

import { useState, useEffect, useCallback } from 'react';
import { createAdoptionDonorListClient } from '@pic4paws/client';
import type { AdoptionApplicationStatus } from '@pic4paws/client';
import {
  createWebAdoptionDonorListUi,
  type WebAdoptionDonorListResultViewModel,
} from '../../src/adoption-donor-list';
import { createSupabaseBrowserClient } from '../../src/supabase-browser';
import { workerUrl } from '../../src/env';

const STATUS_LABELS: Record<AdoptionApplicationStatus, string> = {
  draft: 'Rascunho',
  submitted: 'Submetida',
  under_review: 'Em análise',
  more_info_requested: 'Informação solicitada',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  withdrawn: 'Retirada',
  expired: 'Expirada',
};

export default function MinhasCandidaturasPage() {
  const [viewModel, setViewModel] = useState<WebAdoptionDonorListResultViewModel | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const adoptionDonorListClient = createAdoptionDonorListClient({
      workerBaseUrl: workerUrl(),
      adoptionsPath: '/adoptions',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebAdoptionDonorListUi({ adoptionDonorListClient });
    ui.loadDonorAdoptions().then(setViewModel);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <main>
        <p aria-live="polite">A carregar os meus pedidos...</p>
      </main>
    );
  }

  if (viewModel.state === 'empty') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href="/animais">Ver animais disponíveis</a>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        {viewModel.status === 'unauthenticated' && <a href="/entrar">Entrar na conta</a>}
        <button onClick={load}>Tentar de novo</button>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <ul>
        {viewModel.applications.map((app) => (
          <li key={app.applicationId}>
            <a href={`/adocoes/${app.applicationId}`}>
              Animal: {app.petId}
            </a>
            {' — '}
            {STATUS_LABELS[app.status] ?? app.status}
            {app.submittedAt
              ? ` · ${new Date(app.submittedAt).toLocaleDateString('pt-PT')}`
              : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
