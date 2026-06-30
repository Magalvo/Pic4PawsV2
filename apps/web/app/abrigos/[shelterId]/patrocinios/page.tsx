'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { createSponsorshipListClient } from '@pic4paws/client';
import type { SponsorshipClientStatus, SponsorshipClientRecurringInterval } from '@pic4paws/client';
import {
  createWebSponsorshipListUi,
  type WebSponsorshipListResultViewModel,
} from '../../../../src/sponsorship-list';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { workerUrl } from '../../../../src/env';

type Props = { params: Promise<{ shelterId: string }> };

const STATUS_LABELS: Record<SponsorshipClientStatus, string> = {
  active: 'Ativo',
  cancelled: 'Cancelado',
  paused: 'Em pausa',
};

const STATUS_CLASS: Record<SponsorshipClientStatus, string> = {
  active: 'bg-teal-light text-teal',
  cancelled: 'bg-border/60 text-muted',
  paused: 'bg-amber-50 text-amber-700',
};

const INTERVAL_LABELS: Record<SponsorshipClientRecurringInterval, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  annual: 'Anual',
};

export default function ApadrinhamentosAbrigoPage({ params }: Props) {
  const { shelterId } = use(params);
  const [viewModel, setViewModel] = useState<WebSponsorshipListResultViewModel | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const sponsorshipListClient = createSponsorshipListClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebSponsorshipListUi({ sponsorshipListClient });
    ui.loadSponsorships(shelterId).then(setViewModel);
  }, [shelterId]);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl animate-pulse">🤲</span>
          <p className="mt-4 text-muted text-sm" aria-live="polite">A carregar apadrinhamentos...</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'empty') {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl">📭</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted">{viewModel.message}</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl">🔒</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted">{viewModel.message}</p>
          <a href="/entrar" className="mt-4 inline-block text-primary text-sm font-semibold hover:underline">Entrar na conta</a>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl">⚠️</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted">{viewModel.message}</p>
          <button onClick={load} className="mt-4 px-4 py-2 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors">
            Tentar de novo
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Apadrinhamentos</h1>
        <span className="text-sm text-muted">{viewModel.sponsorships.length} registos</span>
      </div>

      <div className="flex flex-col gap-3">
        {viewModel.sponsorships.map((sp) => (
          <div key={sp.sponsorshipId} className="bg-surface rounded-card border border-border p-4 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-base font-bold text-ink">
                {(sp.amountCents / 100).toFixed(2)} {sp.currency}
              </span>
              <span className="text-xs text-muted font-medium">
                / {INTERVAL_LABELS[sp.recurringInterval]}
              </span>
              <span className={`px-2.5 py-0.5 rounded-pill text-xs font-semibold ${STATUS_CLASS[sp.status] ?? 'bg-border/60 text-muted'}`}>
                {STATUS_LABELS[sp.status] ?? sp.status}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted">
              {sp.petId && (
                <>
                  <a href={`/animais/${sp.petId}`} className="text-primary hover:underline">Ver animal</a>
                  <span>·</span>
                </>
              )}
              <span>{new Date(sp.createdAt).toLocaleDateString('pt-PT')}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
