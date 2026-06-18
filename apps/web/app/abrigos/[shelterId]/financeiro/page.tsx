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
    return <p>A carregar resumo financeiro...</p>;
  }

  if (viewModel.state === 'forbidden') {
    return (
      <main>
        <p>{viewModel.message}</p>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <p>Não foi possível carregar os dados financeiros.</p>
        <button type="button" onClick={load}>Tentar de novo</button>
      </main>
    );
  }

  const { summary } = viewModel;

  return (
    <main>
      <h1>Resumo financeiro</h1>
      <section>
        <h2>Doações</h2>
        <dl>
          <dt>Total recebido</dt>
          <dd>{(summary.donations.paidTotalCents / 100).toFixed(2)} {summary.currency}</dd>
          <dt>Número de doações</dt>
          <dd>{summary.donations.count}</dd>
        </dl>
      </section>
      <section>
        <h2>Apadrinhamentos</h2>
        <dl>
          <dt>Ativos</dt>
          <dd>{summary.sponsorships.activeCount}</dd>
          <dt>Total ativo</dt>
          <dd>{(summary.sponsorships.activeTotalCents / 100).toFixed(2)} {summary.currency}</dd>
        </dl>
      </section>
    </main>
  );
}
