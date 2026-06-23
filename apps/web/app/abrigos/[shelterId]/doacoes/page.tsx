'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { createDonationListClient } from '@pic4paws/client';
import type { DonationClientKind, DonationClientPaymentMethod, DonationClientStatus } from '@pic4paws/client';
import {
  createWebDonationListUi,
  type WebDonationListResultViewModel,
} from '../../../../src/donation-list';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { workerUrl } from '../../../../src/env';

type Props = { params: Promise<{ shelterId: string }> };

const KIND_LABELS: Record<DonationClientKind, string> = {
  one_time_donation: 'Doação única',
  monthly_sponsorship: 'Patrocínio mensal',
};

const STATUS_LABELS: Record<DonationClientStatus, string> = {
  created: 'Criado',
  pending_payment: 'Aguarda pagamento',
  pending_receipt: 'Aguarda comprovativo',
  pending_review: 'Em revisão',
  paid: 'Pago',
  failed: 'Falhado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  partially_refunded: 'Parcialmente reembolsado',
};

const PAYMENT_LABELS: Record<DonationClientPaymentMethod, string> = {
  mb_way: 'MB Way',
  multibanco: 'Multibanco',
  card: 'Cartão',
  bank_transfer: 'Transferência bancária',
  unknown: 'Outro',
};

export default function DoacoesAbrigoPage({ params }: Props) {
  const { shelterId } = use(params);
  const [viewModel, setViewModel] = useState<WebDonationListResultViewModel | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const donationListClient = createDonationListClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebDonationListUi({ donationListClient });
    ui.loadDonations(shelterId).then(setViewModel);
  }, [shelterId]);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <main>
        <p aria-live="polite">A carregar donativos...</p>
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
        {viewModel.donations.map((don) => (
          <li key={don.donationId}>
            <strong>{(don.amountCents / 100).toFixed(2)} {don.currency}</strong>
            {' — '}
            {STATUS_LABELS[don.status] ?? don.status}
            {' · '}
            {KIND_LABELS[don.kind] ?? don.kind}
            {' · '}
            {PAYMENT_LABELS[don.paymentMethod] ?? don.paymentMethod}
            {!don.anonymous && don.donorDisplayName ? ` · ${don.donorDisplayName}` : null}
            {` · ${new Date(don.createdAt).toLocaleDateString('pt-PT')}`}
          </li>
        ))}
      </ul>
    </main>
  );
}
