'use client';

import { use, useState, useEffect, useRef } from 'react';
import { createSavePaymentConfigClient, createLoadPaymentConfigClient } from '@pic4paws/client';
import {
  createWebShelterPaymentConfigUi,
  type WebShelterPaymentConfigState,
} from '../../../../src/shelter-payment-config';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { workerUrl } from '../../../../src/env';

type Props = { params: Promise<{ shelterId: string }> };
type ShelterPaymentConfigUi = ReturnType<typeof createWebShelterPaymentConfigUi>;

const inputClass = 'w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50';

export default function PagamentoAbrigoPage({ params }: Props) {
  const { shelterId } = use(params);
  const [viewModel, setViewModel] = useState<WebShelterPaymentConfigState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [iban, setIban] = useState('');
  const [mbWayPhone, setMbWayPhone] = useState('');
  const uiRef = useRef<ShelterPaymentConfigUi | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };

    const loadConfigClient = createLoadPaymentConfigClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });

    const saveConfigClient = createSavePaymentConfigClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });

    const ui = createWebShelterPaymentConfigUi({ saveConfigClient, loadConfigClient });
    uiRef.current = ui;

    ui.loadConfig(shelterId).then((result) => {
      if (result.state === 'idle') {
        setIban(result.iban);
        setMbWayPhone(result.mbWayPhone);
      }
      setViewModel(result);
    });
  }, [shelterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uiRef.current || submitting) return;
    setSubmitting(true);
    const result = await uiRef.current.saveConfig(shelterId, {
      iban,
      mbWayPhone: mbWayPhone.trim() || null,
    });
    setViewModel(result);
    setSubmitting(false);
  };

  const reloadConfig = () => {
    uiRef.current?.loadConfig(shelterId).then((result) => {
      if (result.state === 'idle') {
        setIban(result.iban);
        setMbWayPhone(result.mbWayPhone);
      }
      setViewModel(result);
    });
  };

  if (viewModel === null) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl animate-pulse">💳</span>
          <p className="mt-4 text-muted text-sm" aria-live="polite">A carregar configuração de pagamento...</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'saved') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-surface rounded-card border border-border p-8 shadow-sm text-center">
          <span className="text-5xl">✓</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted mb-6">{viewModel.message}</p>
          <a href={`/abrigos/${shelterId}`} className="inline-block px-5 py-2.5 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors">
            Ver abrigo →
          </a>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl">🔒</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted mb-4">{viewModel.message}</p>
          <a href={`/abrigos/${shelterId}`} className="text-primary text-sm font-semibold hover:underline">Voltar ao abrigo</a>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl">⚠️</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted mb-4">{viewModel.message}</p>
          {viewModel.status === 'unauthenticated' && (
            <a href="/entrar" className="block text-primary text-sm font-semibold hover:underline mb-3">Entrar na conta</a>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={reloadConfig} className="px-4 py-2 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors">
              Tentar de novo
            </button>
            <a href={`/abrigos/${shelterId}`} className="px-4 py-2 rounded-control border border-border text-sm font-semibold text-muted hover:text-ink transition-colors">
              Voltar ao abrigo
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <a href={`/abrigos/${shelterId}`} className="text-sm text-muted hover:text-ink transition-colors">← Voltar</a>
        <h1 className="text-2xl font-extrabold text-ink">Configuração de pagamento</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-card border border-border p-6 shadow-sm flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-ink mb-1.5">IBAN</label>
          <input
            required
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder="PT50 0000 0000 0000 0000 0000 0"
            disabled={submitting}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink mb-1.5">
            Telefone MB WAY <span className="text-muted font-normal">(opcional)</span>
          </label>
          <input
            type="tel"
            value={mbWayPhone}
            onChange={(e) => setMbWayPhone(e.target.value)}
            placeholder="+351 912 345 678"
            disabled={submitting}
            className={inputClass}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <a href={`/abrigos/${shelterId}`} className="text-sm text-muted hover:text-ink transition-colors">Cancelar</a>
          <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-60">
            {submitting ? 'A guardar...' : 'Guardar configuração'}
          </button>
        </div>
      </form>
    </main>
  );
}
