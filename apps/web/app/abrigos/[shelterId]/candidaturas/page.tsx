'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  more_info_requested: 'Info. solicitada',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  withdrawn: 'Retirada',
  expired: 'Expirada',
};

const STATUS_BADGE: Record<AdoptionApplicationStatus, string> = {
  draft: 'bg-slate-100 text-muted',
  submitted: 'bg-amber-50 text-amber-700',
  under_review: 'bg-teal/10 text-teal',
  more_info_requested: 'bg-primary/10 text-primary',
  approved: 'bg-teal/10 text-teal',
  rejected: 'bg-slate-100 text-muted',
  withdrawn: 'bg-slate-100 text-muted',
  expired: 'bg-slate-100 text-muted',
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
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-muted text-sm" aria-live="polite">A carregar candidaturas...</p>
      </div>
    );
  }

  if (viewModel.state === 'empty') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-sm text-center shadow-sm">
          <span className="text-4xl mb-4 block">📭</span>
          <h1 className="text-lg font-bold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted">{viewModel.message}</p>
        </div>
      </div>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-sm text-center shadow-sm">
          <span className="text-4xl mb-4 block">🔒</span>
          <h1 className="text-lg font-bold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-4">{viewModel.message}</p>
          <Link href="/entrar" className="block w-full py-3 rounded-xl bg-primary text-white font-bold text-sm text-center">
            Entrar na conta
          </Link>
        </div>
      </div>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-sm text-center shadow-sm">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h1 className="text-lg font-bold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-6">{viewModel.message}</p>
          <div className="flex flex-col gap-3">
            {viewModel.status === 'unauthenticated' && (
              <Link href="/entrar" className="block w-full py-3 rounded-xl bg-primary text-white font-bold text-sm text-center">
                Entrar na conta
              </Link>
            )}
            <button
              type="button"
              onClick={load}
              className="w-full py-3 rounded-xl border border-border text-ink font-semibold text-sm"
            >
              Tentar de novo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-extrabold text-ink mb-1">{viewModel.title}</h1>
        <p className="text-sm text-muted mb-6">{viewModel.message}</p>

        <ul className="flex flex-col gap-3">
          {viewModel.applications.map((app) => {
            const badgeCls = STATUS_BADGE[app.status] ?? 'bg-slate-100 text-muted';
            const label = STATUS_LABELS[app.status] ?? app.status;
            const date = app.submittedAt
              ? new Date(app.submittedAt).toLocaleDateString('pt-PT')
              : null;

            return (
              <li key={app.applicationId} className="bg-surface rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink text-sm truncate">{app.applicantFullName}</p>
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {app.applicantCity}{date ? ` · ${date}` : ''}
                    </p>
                    <p className="text-xs text-muted truncate">{app.applicantEmail}</p>
                  </div>
                  <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeCls}`}>
                    {label}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <Link
                    href={`/abrigos/${shelterId}/candidaturas/${app.applicationId}` as never}
                    className="text-xs font-semibold text-teal"
                  >
                    Ver candidatura →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
