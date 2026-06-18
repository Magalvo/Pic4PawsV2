'use client';

import { useState, useCallback } from 'react';
import { use } from 'react';
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

const INTERVALS: Array<{ value: SponsorshipClientRecurringInterval; label: string }> = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'annual', label: 'Anual' },
];

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
    return <p>{viewModel.title}</p>;
  }

  if (viewModel.state === 'submitted') {
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
        <button type="button" onClick={() => setViewModel(IDLE)}>Tentar de novo</button>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
        <label>
          Valor (€)
          <input
            type="number"
            min="1"
            step="0.01"
            value={amountEuros}
            onChange={(e) => setAmountEuros(e.target.value)}
            required
          />
        </label>
        <fieldset style={{ border: 'none', padding: 0 }}>
          <legend>Periodicidade</legend>
          {INTERVALS.map(({ value, label }) => (
            <label key={value} style={{ display: 'block' }}>
              <input
                type="radio"
                name="interval"
                value={value}
                checked={interval === value}
                onChange={() => setInterval(value)}
              />
              {' '}{label}
            </label>
          ))}
        </fieldset>
        <button type="submit">{viewModel.primaryAction}</button>
      </form>
    </main>
  );
}
