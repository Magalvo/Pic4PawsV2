'use client';

import { useState, useCallback } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '../../../../../src/supabase-browser';
import { createAdoptionStatusClient } from '@pic4paws/client';
import type { AdoptionStatusShelterManageStatus } from '@pic4paws/client';
import {
  createWebAdoptionStatusUi,
  type WebAdoptionStatusResultViewModel,
  type WebAdoptionStatusIdleState,
} from '../../../../../src/adoption-status';
import { workerUrl } from '../../../../../src/env';

const IDLE: WebAdoptionStatusIdleState = {
  state: 'idle',
  title: 'Estado da candidatura',
  message: 'Seleciona o estado a aplicar à candidatura.',
  primaryAction: 'Atualizar estado',
};

const STATUS_OPTIONS: Array<{ status: AdoptionStatusShelterManageStatus; label: string; cls: string }> = [
  {
    status: 'under_review',
    label: '🔍 Em análise',
    cls: 'border border-teal text-teal bg-transparent hover:bg-teal/5',
  },
  {
    status: 'more_info_requested',
    label: '💬 Mais informações',
    cls: 'border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100',
  },
  {
    status: 'approved',
    label: '✅ Aprovada',
    cls: 'bg-teal text-white hover:bg-teal/90',
  },
  {
    status: 'rejected',
    label: '✗ Rejeitada',
    cls: 'border border-border text-muted bg-slate-100 hover:bg-slate-200',
  },
];

export default function EstadoCandidaturaPage({
  params,
}: {
  params: Promise<{ shelterId: string; applicationId: string }>;
}) {
  const { shelterId, applicationId } = use(params);
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
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-sm text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏳</span>
          </div>
          <h1 className="text-lg font-bold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted">{viewModel.message}</p>
        </div>
      </div>
    );
  }

  if (viewModel.state === 'succeeded') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-sm text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h1 className="text-xl font-extrabold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-6">{viewModel.message}</p>
          <Link
            href={`/abrigos/${shelterId}/candidaturas` as never}
            className="block w-full py-3 rounded-xl bg-teal text-white font-bold text-sm text-center"
          >
            Ver todas as candidaturas
          </Link>
        </div>
      </div>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-sm text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-extrabold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-6">{viewModel.message}</p>
          <button
            type="button"
            onClick={() => setViewModel(IDLE)}
            className="w-full py-3 rounded-xl border border-border text-ink font-semibold text-sm"
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-md mx-auto">
        <Link
          href={`/abrigos/${shelterId}/candidaturas` as never}
          className="text-sm text-muted mb-6 inline-block"
        >
          ← Voltar às candidaturas
        </Link>

        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          <h1 className="text-xl font-extrabold text-ink mb-1">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-6">{viewModel.message}</p>

          <ul className="flex flex-col gap-3">
            {STATUS_OPTIONS.map(({ status, label, cls }) => (
              <li key={status}>
                <button
                  type="button"
                  onClick={() => handleStatus(status)}
                  className={`w-full py-3 rounded-xl font-semibold text-sm ${cls}`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
