'use client';

import { use, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
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
  mbWayPhone: string;
  dataProcessingAccepted: boolean;
};

const initialForm: FormState = {
  amountEuros: '',
  kind: 'one_time_donation',
  paymentMethod: 'mb_way',
  mbWayPhone: '',
  dataProcessingAccepted: false,
};

const inputCls = 'w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-50';

const KIND_OPTIONS: Array<{ value: DonationClientKind; label: string; desc: string }> = [
  { value: 'one_time_donation', label: 'Doação única', desc: 'Um donativo pontual' },
  { value: 'monthly_sponsorship', label: 'Mensal', desc: 'Apoio recorrente' },
];

const PAYMENT_OPTIONS: Array<{ value: DonationClientPaymentMethod; label: string }> = [
  { value: 'mb_way', label: 'MB Way' },
  { value: 'multibanco', label: 'Multibanco' },
  { value: 'card', label: 'Cartão' },
  { value: 'bank_transfer', label: 'Transferência' },
];

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

  const setField =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

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
      mbWayPhone: form.paymentMethod === 'mb_way' ? form.mbWayPhone || null : null,
      dataProcessingAccepted: true,
    });
    setViewModel(result);
    setSubmitting(false);
  };

  if (viewModel === null) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-muted text-sm" aria-live="polite">A carregar...</p>
      </div>
    );
  }

  if (viewModel.state === 'submitted') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-md text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🐾</span>
          </div>
          <h1 className="text-xl font-extrabold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-2">{viewModel.message}</p>
          <p className="text-lg font-bold text-teal mb-6">
            {(viewModel.amountCents / 100).toFixed(2)} {viewModel.currency}
          </p>
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

  if (viewModel.state === 'submitted_automated') {
    const ref = viewModel.reference;
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-md shadow-sm">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">
              {ref.method === 'multibanco' ? '🏧' : ref.method === 'mb_way' ? '📱' : '🏦'}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-ink mb-2 text-center">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-6 text-center">{viewModel.message}</p>

          <div className="bg-bg rounded-xl border border-border p-4 flex flex-col gap-2 mb-6">
            {ref.method === 'multibanco' && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Entidade</span>
                  <span className="font-bold text-ink">{ref.entity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Referência</span>
                  <span className="font-bold text-ink font-mono">{ref.reference}</span>
                </div>
                {ref.expiresAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Válido até</span>
                    <span className="font-semibold text-ink">{new Date(ref.expiresAt).toLocaleDateString('pt-PT')}</span>
                  </div>
                )}
              </>
            )}
            {ref.method === 'mb_way' && (
              <p className="text-sm text-ink text-center">
                Aceita o pagamento na app MB Way no número <span className="font-bold">{ref.phone}</span>
              </p>
            )}
            {ref.method === 'bank_transfer' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">IBAN</span>
                <span className="font-bold text-ink font-mono text-right break-all">{ref.iban}</span>
              </div>
            )}
          </div>

          <Link
            href={`/abrigos/${shelterId}` as never}
            className="block w-full py-3 rounded-xl border border-border text-ink font-semibold text-sm text-center"
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
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-md text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-extrabold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-6">{viewModel.message}</p>
          <div className="flex flex-col gap-3">
            {viewModel.status === 'unauthenticated' && (
              <Link href="/entrar" className="block w-full py-3 rounded-xl bg-primary text-white font-bold text-sm text-center">
                Entrar na conta
              </Link>
            )}
            <Link
              href={`/abrigos/${shelterId}` as never}
              className="block w-full py-3 rounded-xl border border-border text-ink font-semibold text-sm text-center"
            >
              Voltar ao abrigo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canSubmit = !submitting && form.dataProcessingAccepted && !!form.amountEuros;

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold text-ink mb-1">{viewModel.title}</h1>
        <p className="text-sm text-muted mb-6">{viewModel.message}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Amount */}
          <section className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">Valor</h2>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">€</span>
              <input
                type="number"
                min="1"
                step="0.01"
                className={`${inputCls} pl-7`}
                value={form.amountEuros}
                onChange={setField('amountEuros')}
                required
                disabled={submitting}
                placeholder="10.00"
              />
            </div>
          </section>

          {/* Kind */}
          <section className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">Tipo de donativo</h2>
            <div className="grid grid-cols-2 gap-3">
              {KIND_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, kind: value }))}
                  disabled={submitting}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-colors ${
                    form.kind === value
                      ? 'border-teal bg-teal/5'
                      : 'border-border hover:bg-bg'
                  }`}
                >
                  <span className={`text-sm font-bold ${form.kind === value ? 'text-teal' : 'text-ink'}`}>{label}</span>
                  <span className="text-xs text-muted mt-0.5">{desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Payment method */}
          <section className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">Método de pagamento</h2>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, paymentMethod: value }))}
                  disabled={submitting}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-colors ${
                    form.paymentMethod === value
                      ? 'border-teal bg-teal/5 text-teal'
                      : 'border-border text-ink hover:bg-bg'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {form.paymentMethod === 'mb_way' && (
              <div className="mt-4 flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink">Telemóvel MB Way</label>
                <input
                  type="tel"
                  className={inputCls}
                  value={form.mbWayPhone}
                  onChange={setField('mbWayPhone')}
                  placeholder="+351910000000"
                  required
                  disabled={submitting}
                />
              </div>
            )}
          </section>

          {/* Consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.dataProcessingAccepted}
              onChange={setField('dataProcessingAccepted')}
              required
              disabled={submitting}
              className="mt-0.5 h-4 w-4 accent-teal flex-shrink-0"
            />
            <span className="text-sm text-ink">
              Aceito o tratamento dos meus dados pessoais para efeitos deste donativo.
            </span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-40"
          >
            {submitting ? 'A processar...' : 'Doar'}
          </button>
        </form>
      </div>
    </div>
  );
}
