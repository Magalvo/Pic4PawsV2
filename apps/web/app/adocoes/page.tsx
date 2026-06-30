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

const STATUS_CLASS: Record<AdoptionApplicationStatus, string> = {
  approved: 'bg-teal-light text-teal',
  submitted: 'bg-amber-50 text-amber-700',
  under_review: 'bg-amber-50 text-amber-700',
  more_info_requested: 'bg-amber-50 text-amber-700',
  draft: 'bg-border/60 text-muted',
  rejected: 'bg-red-50 text-red-600',
  withdrawn: 'bg-border/60 text-muted',
  expired: 'bg-border/60 text-muted',
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
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl animate-pulse">🐾</span>
          <p className="mt-4 text-muted text-sm" aria-live="polite">A carregar os meus pedidos...</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'empty') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold text-ink mb-2">{viewModel.title}</h1>
        <p className="text-sm text-muted mb-6">{viewModel.message}</p>
        <a
          href="/animais"
          className="inline-block px-5 py-2.5 rounded-cta bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
        >
          Ver animais disponíveis →
        </a>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl">⚠️</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted mb-4">{viewModel.message}</p>
          {viewModel.status === 'unauthenticated' && (
            <a href="/entrar" className="block text-primary text-sm font-semibold hover:underline mb-3">Entrar na conta</a>
          )}
          <button onClick={load} className="px-4 py-2 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors">
            Tentar de novo
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-ink">{viewModel.title}</h1>
        <span className="text-sm text-muted">{viewModel.applications.length} pedido{viewModel.applications.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex flex-col gap-2">
        {viewModel.applications.map((app) => (
          <a
            key={app.applicationId}
            href={`/adocoes/${app.applicationId}`}
            className="bg-surface rounded-card border border-border p-4 shadow-sm flex items-center justify-between gap-4 hover:border-primary/40 transition-colors group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-2xl">🐾</span>
              <div>
                <p className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                  Candidatura de adoção
                </p>
                {app.submittedAt && (
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(app.submittedAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2.5 py-0.5 rounded-pill text-xs font-semibold ${STATUS_CLASS[app.status] ?? 'bg-border/60 text-muted'}`}>
                {STATUS_LABELS[app.status] ?? app.status}
              </span>
              <span className="text-muted text-xs">→</span>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
