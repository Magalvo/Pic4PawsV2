'use client';

import { use, useRef, useState, useEffect } from 'react';
import { createDonationClient } from '@pic4paws/client';
import type { DonationClientKind, DonationClientPaymentMethod } from '@pic4paws/client';
import {
  createWebDonationUi,
  type WebDonationResultViewModel,
} from '../../../../src/donation';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { workerUrl } from '../../../../src/env';

type Props = { params: Promise<{ shelterId: string }> };

type DonationUi = ReturnType<typeof createWebDonationUi>;

type FormState = {
  amountEuros: string;
  kind: DonationClientKind;
  paymentMethod: DonationClientPaymentMethod;
  dataProcessingAccepted: boolean;
};

const initialForm: FormState = {
  amountEuros: '',
  kind: 'one_time_donation',
  paymentMethod: 'mb_way',
  dataProcessingAccepted: false,
};

export default function DoarPage({ params }: Props) {
  const { shelterId } = use(params);
  const uiRef = useRef<DonationUi | null>(null);
  const [viewModel, setViewModel] = useState<WebDonationResultViewModel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const donationClient = createDonationClient({
      workerBaseUrl: workerUrl(),
      donationsPath: '/donations',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebDonationUi({ donationClient });
    uiRef.current = ui;
    setViewModel(ui.getInitialState());
  }, [shelterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uiRef.current || !form.dataProcessingAccepted) return;
    const amountCents = Math.round(parseFloat(form.amountEuros) * 100);
    if (!amountCents || amountCents <= 0) return;
    setSubmitting(true);
    const result = await uiRef.current.submitDonation({
      shelterId,
      amountCents,
      kind: form.kind,
      paymentMethod: form.paymentMethod,
      dataProcessingAccepted: true,
    });
    setViewModel(result);
    setSubmitting(false);
  };

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  if (viewModel === null) {
    return (
      <main>
        <p aria-live="polite">A carregar...</p>
      </main>
    );
  }

  if (viewModel.state === 'submitted') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <p>Donativo: {(viewModel.amountCents / 100).toFixed(2)} {viewModel.currency}</p>
        <a href={`/abrigos/${shelterId}`}>Voltar ao abrigo</a>
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
        <a href={`/abrigos/${shelterId}`}>Voltar ao abrigo</a>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <form onSubmit={handleSubmit}>
        <label>
          Valor (€)
          <input
            type="number"
            min="1"
            step="0.01"
            value={form.amountEuros}
            onChange={set('amountEuros')}
            required
            disabled={submitting}
          />
        </label>
        <label>
          Tipo de donativo
          <select value={form.kind} onChange={set('kind')} disabled={submitting}>
            <option value="one_time_donation">Doação única</option>
            <option value="monthly_sponsorship">Apadrinhamento mensal</option>
          </select>
        </label>
        <label>
          Método de pagamento
          <select value={form.paymentMethod} onChange={set('paymentMethod')} disabled={submitting}>
            <option value="mb_way">MB Way</option>
            <option value="multibanco">Multibanco</option>
            <option value="card">Cartão</option>
            <option value="bank_transfer">Transferência bancária</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.dataProcessingAccepted}
            onChange={set('dataProcessingAccepted')}
            required
            disabled={submitting}
          />
          Aceito o tratamento de dados pessoais
        </label>
        <button
          type="submit"
          disabled={submitting || !form.dataProcessingAccepted || !form.amountEuros}
        >
          {submitting ? 'A processar...' : 'Doar'}
        </button>
      </form>
    </main>
  );
}
