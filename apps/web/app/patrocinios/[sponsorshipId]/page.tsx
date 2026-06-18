'use client';

import { use, useState, useCallback } from 'react';
import { createSponsorshipManageClient } from '@pic4paws/client';
import type { SponsorshipClientStatus } from '@pic4paws/client';
import {
  createWebSponsorshipManageUi,
  type WebSponsorshipManageResultViewModel,
} from '../../../src/sponsorship-manage';
import { createSupabaseBrowserClient } from '../../../src/supabase-browser';
import { workerUrl } from '../../../src/env';

type Props = { params: Promise<{ sponsorshipId: string }> };

const STATUS_LABELS: Record<SponsorshipClientStatus, string> = {
  active: 'Ativo',
  cancelled: 'Cancelado',
  paused: 'Em pausa',
};

const IDLE: WebSponsorshipManageResultViewModel = {
  state: 'idle',
  title: 'Gerir apadrinhamento',
  message: 'Seleciona a ação a aplicar ao apadrinhamento.',
  primaryAction: 'Gerir apadrinhamento',
};

export default function GerirApadrinhamentoPage({ params }: Props) {
  const { sponsorshipId } = use(params);
  const [viewModel, setViewModel] =
    useState<WebSponsorshipManageResultViewModel>(IDLE);

  const manage = useCallback(
    (newStatus: SponsorshipClientStatus) => {
      setViewModel({ state: 'submitting', title: 'A processar...', message: 'A atualizar o estado do apadrinhamento.' });
      const supabase = createSupabaseBrowserClient();
      const getAccessToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? null;
      };
      const sponsorshipManageClient = createSponsorshipManageClient({
        workerBaseUrl: workerUrl(),
        sponsorshipsPath: '/sponsorships',
        getAccessToken,
        fetch: globalThis.fetch,
      });
      const ui = createWebSponsorshipManageUi({ sponsorshipManageClient });
      ui.manageSponsorship(sponsorshipId, newStatus).then(setViewModel);
    },
    [sponsorshipId],
  );

  if (viewModel.state === 'submitting') {
    return (
      <main>
        <p aria-live="polite">{viewModel.message}</p>
      </main>
    );
  }

  if (viewModel.state === 'succeeded') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <p>Novo estado: {STATUS_LABELS[viewModel.newStatus] ?? viewModel.newStatus}</p>
        <a href="/patrocinios">Os meus apadrinhamentos</a>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href="/patrocinios">Os meus apadrinhamentos</a>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <button onClick={() => manage('paused')}>Pausar</button>
      <button onClick={() => manage('cancelled')}>Cancelar</button>
      <a href="/patrocinios">Voltar</a>
    </main>
  );
}
