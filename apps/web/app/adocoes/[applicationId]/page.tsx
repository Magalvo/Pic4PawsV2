'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { createAdoptionViewClient } from '@pic4paws/client';
import type { AdoptionApplicationStatus } from '@pic4paws/client';
import {
  createWebAdoptionViewUi,
  type WebAdoptionViewResultViewModel,
} from '../../../src/adoption-view';
import { createSupabaseBrowserClient } from '../../../src/supabase-browser';
import { workerUrl } from '../../../src/env';

type Props = { params: Promise<{ applicationId: string }> };

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

export default function CandidaturaPage({ params }: Props) {
  const { applicationId } = use(params);
  const [viewModel, setViewModel] = useState<WebAdoptionViewResultViewModel | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const adoptionViewClient = createAdoptionViewClient({
      workerBaseUrl: workerUrl(),
      adoptionsPath: '/adoptions',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebAdoptionViewUi({ adoptionViewClient });
    ui.loadAdoptionView(applicationId).then(setViewModel);
  }, [applicationId]);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <main>
        <p aria-live="polite">A carregar candidatura...</p>
      </main>
    );
  }

  if (viewModel.state === 'not_found') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href="/adocoes">Os meus pedidos</a>
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

  const { application } = viewModel;

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <dl>
        <dt>Estado</dt>
        <dd>{STATUS_LABELS[application.applicationStatus] ?? application.applicationStatus}</dd>
        {application.petId ? (
          <>
            <dt>Animal</dt>
            <dd><a href={`/animais/${application.petId}`}>Ver perfil do animal</a></dd>
          </>
        ) : null}
        <dt>Abrigo</dt>
        <dd><a href={`/abrigos/${application.shelterId}`}>Ver abrigo</a></dd>
      </dl>
      <a href="/adocoes">Os meus pedidos</a>
    </main>
  );
}
