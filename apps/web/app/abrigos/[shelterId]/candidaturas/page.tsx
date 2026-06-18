'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { createAdoptionListClient } from '@pic4paws/client';
import type { AdoptionApplicationStatus } from '@pic4paws/client';
import {
  createWebAdoptionListUi,
  type WebAdoptionListResultViewModel,
} from '../../../../src/adoption-list';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { workerUrl } from '../../../../src/env';

type Props = { params: Promise<{ shelterId: string }> };

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

export default function CandidaturasPage({ params }: Props) {
  const { shelterId } = use(params);
  const [viewModel, setViewModel] = useState<WebAdoptionListResultViewModel | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const adoptionListClient = createAdoptionListClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebAdoptionListUi({ adoptionListClient });
    ui.loadApplications(shelterId).then(setViewModel);
  }, [shelterId]);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <main>
        <p aria-live="polite">A carregar candidaturas...</p>
      </main>
    );
  }

  if (viewModel.state === 'empty') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
      </main>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href="/entrar">Entrar na conta</a>
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
            <strong>{app.applicantFullName}</strong>
            {' — '}
            {STATUS_LABELS[app.status] ?? app.status}
            {' · '}
            {app.applicantCity}
            {' · '}
            {app.applicantEmail}
            {app.submittedAt
              ? ` · ${new Date(app.submittedAt).toLocaleDateString('pt-PT')}`
              : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
