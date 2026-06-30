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

const STATUS_CLASS: Record<DonationClientStatus, string> = {
  paid: 'bg-teal-light text-teal',
  pending_payment: 'bg-amber-50 text-amber-700',
  pending_receipt: 'bg-amber-50 text-amber-700',
  pending_review: 'bg-amber-50 text-amber-700',
  created: 'bg-border/60 text-muted',
  failed: 'bg-red-50 text-red-600',
  cancelled: 'bg-border/60 text-muted',
  refunded: 'bg-border/60 text-muted',
  partially_refunded: 'bg-border/60 text-muted',
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
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl animate-pulse">💰</span>
          <p className="mt-4 text-muted text-sm" aria-live="polite">A carregar donativos...</p>
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
          {viewModel.status === 'unauthenticated' && (
            <a href="/entrar" className="mt-3 inline-block text-primary text-sm font-semibold hover:underline">Entrar na conta</a>
          )}
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
        <h1 className="text-2xl font-extrabold text-ink">Donativos recebidos</h1>
        <span className="text-sm text-muted">{viewModel.donations.length} registos</span>
      </div>

      <div className="flex flex-col gap-3">
        {viewModel.donations.map((don) => (
          <div key={don.donationId} className="bg-surface rounded-card border border-border p-4 shadow-sm flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-base font-bold text-ink">
                  {(don.amountCents / 100).toFixed(2)} {don.currency}
                </span>
                <span className={`px-2.5 py-0.5 rounded-pill text-xs font-semibold ${STATUS_CLASS[don.status] ?? 'bg-border/60 text-muted'}`}>
                  {STATUS_LABELS[don.status] ?? don.status}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted">
                <span>{KIND_LABELS[don.kind] ?? don.kind}</span>
                <span>·</span>
                <span>{PAYMENT_LABELS[don.paymentMethod] ?? don.paymentMethod}</span>
                {!don.anonymous && don.donorDisplayName && (
                  <>
                    <span>·</span>
                    <span>{don.donorDisplayName}</span>
                  </>
                )}
                <span>·</span>
                <span>{new Date(don.createdAt).toLocaleDateString('pt-PT')}</span>
              </div>
            </div>
            <a
              href={`/abrigos/${shelterId}/doacoes/${don.donationId}`}
              className="shrink-0 px-3 py-1.5 rounded-control border border-border text-xs font-semibold text-muted hover:text-ink transition-colors"
            >
              Ver
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
