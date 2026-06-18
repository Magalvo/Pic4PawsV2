'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSponsorshipDonorListClient } from '@pic4paws/client';
import type { SponsorshipClientStatus, SponsorshipClientRecurringInterval } from '@pic4paws/client';
import {
  createWebSponsorshipDonorListUi,
  type WebSponsorshipDonorListResultViewModel,
} from '../../src/sponsorship-donor-list';
import { createSupabaseBrowserClient } from '../../src/supabase-browser';
import { workerUrl } from '../../src/env';

const STATUS_LABELS: Record<SponsorshipClientStatus, string> = {
  active: 'Ativo',
  cancelled: 'Cancelado',
  paused: 'Em pausa',
};

const INTERVAL_LABELS: Record<SponsorshipClientRecurringInterval, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  annual: 'Anual',
};

export default function MeusApadrinhamentosPage() {
  const [viewModel, setViewModel] =
    useState<WebSponsorshipDonorListResultViewModel | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const sponsorshipDonorListClient = createSponsorshipDonorListClient({
      workerBaseUrl: workerUrl(),
      sponsorshipsPath: '/sponsorships',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebSponsorshipDonorListUi({ sponsorshipDonorListClient });
    ui.loadDonorSponsorships().then(setViewModel);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <main>
        <p aria-live="polite">A carregar apadrinhamentos...</p>
      </main>
    );
  }

  if (viewModel.state === 'empty') {
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
        {viewModel.status === 'unauthenticated' && <a href="/entrar">Entrar na conta</a>}
        <button onClick={load}>Tentar de novo</button>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <ul>
        {viewModel.sponsorships.map((sp) => (
          <li key={sp.sponsorshipId}>
            <a href={`/patrocinios/${sp.sponsorshipId}`}>
              {(sp.amountCents / 100).toFixed(2)} {sp.currency} · {INTERVAL_LABELS[sp.recurringInterval]}
            </a>
            {' — '}
            {STATUS_LABELS[sp.status] ?? sp.status}
            {sp.petId ? ` · Animal: ${sp.petId}` : null}
            {' · '}
            {new Date(sp.createdAt).toLocaleDateString('pt-PT')}
          </li>
        ))}
      </ul>
    </main>
  );
}
