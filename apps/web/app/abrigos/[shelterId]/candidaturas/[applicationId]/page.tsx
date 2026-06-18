'use client';

import { useState, useCallback } from 'react';
import { use } from 'react';
import { createSupabaseBrowserClient } from '../../../../../src/supabase-browser';
import { createAdoptionStatusClient } from '@pic4paws/client';
import type { AdoptionStatusShelterManageStatus } from '@pic4paws/client';
import { createWebAdoptionStatusUi, type WebAdoptionStatusResultViewModel, type WebAdoptionStatusIdleState } from '../../../../../src/adoption-status';
import { workerUrl } from '../../../../../src/env';

const IDLE: WebAdoptionStatusIdleState = {
  state: 'idle',
  title: 'Estado da candidatura',
  message: 'Seleciona o estado a aplicar à candidatura.',
  primaryAction: 'Atualizar estado',
};

const STATUS_OPTIONS: Array<{ status: AdoptionStatusShelterManageStatus; label: string }> = [
  { status: 'under_review', label: 'Em análise' },
  { status: 'more_info_requested', label: 'Mais informações' },
  { status: 'approved', label: 'Aprovada' },
  { status: 'rejected', label: 'Rejeitada' },
];

export default function EstadoCandidaturaPage({
  params,
}: {
  params: Promise<{ shelterId: string; applicationId: string }>;
}) {
  const { applicationId } = use(params);
  const [viewModel, setViewModel] = useState<WebAdoptionStatusResultViewModel>(IDLE);

  const handleStatus = useCallback(
    async (status: AdoptionStatusShelterManageStatus) => {
      setViewModel({ state: 'submitting', title: 'A processar...', message: 'A atualizar o estado da candidatura.' });
      const supabase = createSupabaseBrowserClient();
      const getAccessToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? null;
      };
      const adoptionStatusClient = createAdoptionStatusClient({
        workerBaseUrl: workerUrl(),
        adoptionsPath: '/adoptions',
        getAccessToken,
        fetch: globalThis.fetch,
      });
      const ui = createWebAdoptionStatusUi({ adoptionStatusClient });
      const result = await ui.manageAdoptionStatus(applicationId, status);
      setViewModel(result);
    },
    [applicationId],
  );

  if (viewModel.state === 'submitting') {
    return <p>{viewModel.title}</p>;
  }

  if (viewModel.state === 'succeeded') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <button
          type="button"
          onClick={() =>
            setViewModel(IDLE)
          }
        >
          Tentar de novo
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {STATUS_OPTIONS.map(({ status, label }) => (
          <li key={status}>
            <button type="button" onClick={() => handleStatus(status)}>
              {label}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
