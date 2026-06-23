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
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

  if (viewModel === null) {
    return (
      <main>
        <p aria-live="polite">A carregar configuração de pagamento...</p>
      </main>
    );
  }

  if (viewModel.state === 'saved') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href={`/abrigos/${shelterId}`}>Ver abrigo</a>
      </main>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href={`/abrigos/${shelterId}`}>Voltar ao abrigo</a>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        {viewModel.status === 'unauthenticated' && <a href="/entrar">Entrar na conta</a>}
        <button
          onClick={() =>
            uiRef.current?.loadConfig(shelterId).then((result) => {
              if (result.state === 'idle') {
                setIban(result.iban);
                setMbWayPhone(result.mbWayPhone);
              }
              setViewModel(result);
            })
          }
        >
          Tentar de novo
        </button>
        <a href={`/abrigos/${shelterId}`}>Voltar ao abrigo</a>
      </main>
    );
  }

  return (
    <main>
      <h1>Configuração de pagamento</h1>

      <form onSubmit={handleSubmit}>
        <label>
          IBAN
          <input
            required
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder="PT50 0000 0000 0000 0000 0000 0"
          />
        </label>

        <label>
          Telefone MB WAY (opcional)
          <input
            type="tel"
            value={mbWayPhone}
            onChange={(e) => setMbWayPhone(e.target.value)}
            placeholder="+351 912 345 678"
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'A guardar...' : 'Guardar configuração'}
        </button>
      </form>

      <a href={`/abrigos/${shelterId}`}>Voltar ao abrigo</a>
    </main>
  );
}
