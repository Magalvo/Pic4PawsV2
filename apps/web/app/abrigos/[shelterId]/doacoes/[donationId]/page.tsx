'use client';

import { use, useRef, useState, useEffect } from 'react';
import {
  createDonationStatusClient,
  createReviewDonationClient,
} from '@pic4paws/client';
import {
  createWebDonationReviewUi,
  type WebDonationReviewState,
} from '../../../../../src/donation-review';
import { createSupabaseBrowserClient } from '../../../../../src/supabase-browser';
import { workerUrl } from '../../../../../src/env';

type Props = { params: Promise<{ shelterId: string; donationId: string }> };

export default function DoacaoReviewPage({ params }: Props) {
  const { shelterId, donationId } = use(params);
  const [viewModel, setViewModel] = useState<WebDonationReviewState | null>(null);
  const uiRef = useRef<ReturnType<typeof createWebDonationReviewUi> | null>(null);

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
    const reviewDonationClient = createReviewDonationClient({
      workerBaseUrl: workerUrl(),
      donationsPath: '/donations',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebDonationReviewUi({ donationStatusClient, reviewDonationClient });
    uiRef.current = ui;
    ui.loadDonation(donationId).then(setViewModel);
  }, [donationId]);

  const handleApprove = async () => {
    if (!uiRef.current) return;
    if (!window.confirm('Tens a certeza que queres aprovar este donativo?')) return;
    setViewModel({ state: 'approving', title: 'A aprovar...' });
    const result = await uiRef.current.approveDonation(donationId);
    setViewModel(result);
  };

  const handleReject = async () => {
    if (!uiRef.current) return;
    if (!window.confirm('Tens a certeza que queres rejeitar este donativo?')) return;
    setViewModel({ state: 'rejecting', title: 'A rejeitar...' });
    const result = await uiRef.current.rejectDonation(donationId);
    setViewModel(result);
  };

  if (viewModel === null) {
    return (
      <main>
        <p aria-live="polite">A carregar donativo...</p>
      </main>
    );
  }

  if (viewModel.state === 'approving' || viewModel.state === 'rejecting') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p aria-live="polite">A processar...</p>
      </main>
    );
  }

  if (viewModel.state === 'approved') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href={`/abrigos/${shelterId}/doacoes`}>Ver donativos do abrigo</a>
      </main>
    );
  }

  if (viewModel.state === 'rejected') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href={`/abrigos/${shelterId}/doacoes`}>Ver donativos do abrigo</a>
      </main>
    );
  }

  if (viewModel.state === 'wrong_state') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href={`/abrigos/${shelterId}/doacoes/${viewModel.donationId}`}>Ver donativo</a>
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
        <a href={`/abrigos/${shelterId}/doacoes`}>Ver donativos do abrigo</a>
      </main>
    );
  }

  const { donation } = viewModel;

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <dl>
        <dt>Valor</dt>
        <dd>{(donation.amountCents / 100).toFixed(2)} {donation.currency}</dd>
        <dt>Método</dt>
        <dd>{donation.paymentMethod}</dd>
        <dt>Data</dt>
        <dd>{new Date(donation.createdAt).toLocaleDateString('pt-PT')}</dd>
      </dl>
      {donation.receiptMediaId ? (
        <section>
          <h2>Comprovativo</h2>
          <p>ID do comprovativo: {donation.receiptMediaId}</p>
        </section>
      ) : (
        <p>Sem comprovativo anexado.</p>
      )}
      <div>
        <button type="button" onClick={handleApprove}>
          Aprovar donativo
        </button>
        <button type="button" onClick={handleReject}>
          Rejeitar donativo
        </button>
      </div>
      <a href={`/abrigos/${shelterId}/doacoes`}>Ver donativos do abrigo</a>
    </main>
  );
}
