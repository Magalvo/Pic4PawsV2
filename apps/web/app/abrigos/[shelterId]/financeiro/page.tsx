'use client';

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { createFinancialsClient } from '@pic4paws/client';
import { createWebFinancialsDashboardUi, type WebFinancialsDashboardState } from '../../../../src/financials';
import { workerUrl } from '../../../../src/env';

export default function FinanceiroPage({ params }: { params: Promise<{ shelterId: string }> }) {
  const { shelterId } = use(params);
  const [viewModel, setViewModel] = useState<WebFinancialsDashboardState | null>(null);

  const load = useCallback(async () => {
    setViewModel(null);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const financialsClient = createFinancialsClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebFinancialsDashboardUi({ financialsClient });
    ui.loadFinancials(shelterId).then(setViewModel);
  }, [shelterId]);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl animate-pulse">📊</span>
          <p className="mt-4 text-muted text-sm" aria-live="polite">A carregar resumo financeiro...</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl">🔒</span>
          <h1 className="mt-4 text-xl font-bold text-ink">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted">{viewModel.message}</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl">⚠️</span>
          <p className="mt-4 text-sm text-muted">Não foi possível carregar os dados financeiros.</p>
          <button onClick={load} className="mt-4 px-4 py-2 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors">
            Tentar de novo
          </button>
        </div>
      </main>
    );
  }

  const { summary } = viewModel;
  const donations = summary.donations;
  const sponsorships = summary.sponsorships;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink mb-6">Resumo financeiro</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Donations card */}
        <div className="bg-surface rounded-card border border-border p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Donativos</p>
          <p className="text-3xl font-extrabold text-ink">
            {(donations.paidTotalCents / 100).toFixed(2)}
            <span className="text-base font-semibold text-muted ml-1">{summary.currency}</span>
          </p>
          <p className="mt-1 text-sm text-muted">Total recebido</p>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm font-semibold text-ink">{donations.count}</p>
            <p className="text-xs text-muted">Número de doações</p>
          </div>
        </div>

        {/* Sponsorships card */}
        <div className="bg-surface rounded-card border border-teal/30 p-5 shadow-sm">
          <p className="text-xs font-semibold text-teal uppercase tracking-wide mb-3">Apadrinhamentos</p>
          <p className="text-3xl font-extrabold text-ink">
            {sponsorships.activeCount}
            <span className="text-base font-semibold text-muted ml-1">ativos</span>
          </p>
          <p className="mt-1 text-sm text-muted">Padrinhos activos</p>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm font-semibold text-ink">
              {(sponsorships.activeTotalCents / 100).toFixed(2)} {summary.currency}
            </p>
            <p className="text-xs text-muted">Valor mensal activo</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <a href={`/abrigos/${shelterId}/doacoes`} className="px-4 py-2 rounded-control border border-border text-sm font-semibold text-muted hover:text-ink transition-colors">
          Ver donativos →
        </a>
        <a href={`/abrigos/${shelterId}/patrocinios`} className="px-4 py-2 rounded-control border border-border text-sm font-semibold text-muted hover:text-ink transition-colors">
          Ver apadrinhamentos →
        </a>
      </div>
    </main>
  );
}
