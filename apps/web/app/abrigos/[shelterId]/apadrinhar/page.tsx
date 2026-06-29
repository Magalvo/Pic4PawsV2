'use client';

import { useState, useCallback } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { createSponsorshipClient } from '@pic4paws/client';
import type { SponsorshipClientRecurringInterval } from '@pic4paws/client';
import {
  createWebSponsorshipUi,
  type WebSponsorshipResultViewModel,
  type WebSponsorshipIdleState,
} from '../../../../src/sponsorship';
import { workerUrl } from '../../../../src/env';

const IDLE: WebSponsorshipIdleState = {
  state: 'idle',
  title: 'Apadrinhar',
  message: 'Preenche os detalhes para iniciar o apadrinhamento.',
  primaryAction: 'Apadrinhar',
};

const INTERVALS: Array<{ value: SponsorshipClientRecurringInterval; label: string; desc: string }> = [
  { value: 'monthly', label: 'Mensal', desc: '12× por ano' },
  { value: 'quarterly', label: 'Trimestral', desc: '4× por ano' },
  { value: 'annual', label: 'Anual', desc: '1× por ano' },
];

const inputCls = 'w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-50';

export default function ApadrinhamentoPage({ params }: { params: Promise<{ shelterId: string }> }) {
  const { shelterId } = use(params);
  const [viewModel, setViewModel] = useState<WebSponsorshipResultViewModel>(IDLE);
  const [amountEuros, setAmountEuros] = useState('');
  const [interval, setInterval] = useState<SponsorshipClientRecurringInterval>('monthly');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amountEuros.replace(',', '.'));
    if (!parsed || parsed <= 0) return;
    const amountCents = Math.round(parsed * 100);
    setViewModel({ state: 'submitting', title: 'A processar...', message: 'A criar o apadrinhamento.' });
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const sponsorshipClient = createSponsorshipClient({
      workerBaseUrl: workerUrl(),
      sponsorshipsPath: '/sponsorships',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebSponsorshipUi({ sponsorshipClient });
    const result = await ui.submitSponsorship({
      shelterId,
      amountCents,
      paymentMethod: 'card',
      recurringInterval: interval,
      dataProcessingAccepted: true,
    });
    setViewModel(result);
  }, [amountEuros, interval, shelterId]);

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

  if (viewModel.state === 'submitted') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-sm text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤲</span>
          </div>
          <h1 className="text-xl font-extrabold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-6">{viewModel.message}</p>
          <Link
            href={`/abrigos/${shelterId}` as never}
            className="block w-full py-3 rounded-xl bg-teal text-white font-bold text-sm text-center"
          >
            Voltar ao abrigo
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
        <h1 className="text-2xl font-extrabold text-ink mb-1">{viewModel.title}</h1>
        <p className="text-sm text-muted mb-6">{viewModel.message}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Amount */}
          <section className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">Valor mensal (€)</h2>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">€</span>
              <input
                type="number"
                min="1"
                step="0.01"
                className={`${inputCls} pl-7`}
                value={amountEuros}
                onChange={(e) => setAmountEuros(e.target.value)}
                required
                placeholder="10.00"
              />
            </div>
          </section>

          {/* Interval */}
          <section className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">Periodicidade</h2>
            <div className="flex flex-col gap-2">
              {INTERVALS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setInterval(value)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                    interval === value
                      ? 'border-teal bg-teal/5'
                      : 'border-border hover:bg-bg'
                  }`}
                >
                  <span className={`text-sm font-semibold ${interval === value ? 'text-teal' : 'text-ink'}`}>{label}</span>
                  <span className="text-xs text-muted">{desc}</span>
                </button>
              ))}
            </div>
          </section>

          <button
            type="submit"
            disabled={!amountEuros}
            className="w-full py-3.5 rounded-xl bg-teal text-white font-bold text-sm disabled:opacity-40"
          >
            {viewModel.primaryAction}
          </button>
        </form>
      </div>
    </div>
  );
}
