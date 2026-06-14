'use client';

import { use, useState, useEffect } from 'react';
import { createDonationStatusClient } from '@pic4paws/client';
import {
  createWebDonationStatusUi,
  type WebDonationStatusResultViewModel,
} from '../../../src/donation-status';
import { createSupabaseBrowserClient } from '../../../src/supabase-browser';
import { workerUrl } from '../../../src/env';

type Props = { params: Promise<{ donationId: string }> };

export default function DoacaoPage({ params }: Props) {
  const { donationId } = use(params);
  const [viewModel, setViewModel] = useState<WebDonationStatusResultViewModel | null>(null);

  useEffect(() => {
    setViewModel(null);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const donationStatusClient = createDonationStatusClient({
      workerBaseUrl: workerUrl(),
      donationsPath: '/donations',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebDonationStatusUi({ donationStatusClient });
    ui.loadDonationStatus(donationId).then(setViewModel);
  }, [donationId]);

  if (viewModel === null || viewModel.state === 'loading') {
    return (
      <main>
        <p aria-live="polite">A carregar donativo...</p>
      </main>
    );
  }

  if (viewModel.state === 'idle') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
      </main>
    );
  }

  if (viewModel.state === 'not_found') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href="/animais">Ver animais</a>
      </main>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href="/entrar">Entrar na conta</a>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        {viewModel.status === 'unauthenticated' && (
          <a href="/entrar">Entrar na conta</a>
        )}
      </main>
    );
  }

  const { donation } = viewModel;

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <dl>
        <dt>Valor</dt>
        <dd>{(donation.amountCents / 100).toFixed(2)} {donation.currency}</dd>
        <dt>Estado</dt>
        <dd>{donation.donationStatus}</dd>
        <dt>Método de pagamento</dt>
        <dd>{donation.paymentMethod}</dd>
        <dt>Data</dt>
        <dd>{new Date(donation.createdAt).toLocaleDateString('pt-PT')}</dd>
      </dl>
      <a href={`/abrigos/${donation.shelterId}`}>Ver abrigo</a>
    </main>
  );
}
