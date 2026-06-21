'use client';

import { use, useState, useRef } from 'react';
import { createShelterVerificationClient } from '@pic4paws/client';
import {
  createWebShelterVerifyUi,
  type WebShelterVerifyState,
} from '../../../../src/shelter-verify';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { workerUrl } from '../../../../src/env';
import type { ShelterVerificationTargetStatus } from '@pic4paws/client';

type Props = { params: Promise<{ shelterId: string }> };
type ShelterVerifyUi = ReturnType<typeof createWebShelterVerifyUi>;

export default function VerificarAbrigoPage({ params }: Props) {
  const { shelterId } = use(params);
  const [viewModel, setViewModel] = useState<WebShelterVerifyState | null>(null);
  const [submitting, setSubmitting] = useState<ShelterVerificationTargetStatus | null>(null);
  const uiRef = useRef<ShelterVerifyUi | null>(null);

  const getUi = (): ShelterVerifyUi => {
    if (uiRef.current) return uiRef.current;
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const shelterVerificationClient = createShelterVerificationClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    uiRef.current = createWebShelterVerifyUi({ shelterVerificationClient });
    return uiRef.current;
  };

  const handleAction = async (targetStatus: ShelterVerificationTargetStatus) => {
    if (submitting) return;
    setSubmitting(targetStatus);
    const result = await getUi().updateVerificationStatus(shelterId, targetStatus);
    setViewModel(result);
    setSubmitting(null);
  };

  const reset = () => setViewModel(getUi().getInitialState());

  if (viewModel?.state === 'updated') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href={`/abrigos/${viewModel.shelterId}`}>Ver abrigo</a>
      </main>
    );
  }

  if (viewModel?.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        {viewModel.status === 'unauthenticated' && (
          <a href="/entrar">Entrar na conta</a>
        )}
        <button onClick={reset}>Tentar de novo</button>
        <a href={`/abrigos/${shelterId}`}>Voltar ao abrigo</a>
      </main>
    );
  }

  return (
    <main>
      <h1>Verificação do abrigo</h1>

      <section>
        <h2>Responsável do abrigo</h2>
        <p>Submete o abrigo para revisão pela equipa Pic4Paws.</p>
        <button
          onClick={() => handleAction('pending_review')}
          disabled={submitting !== null}
          aria-busy={submitting === 'pending_review'}
        >
          {submitting === 'pending_review' ? 'A submeter...' : 'Submeter para revisão'}
        </button>
      </section>

      <section>
        <h2>Administração</h2>
        <p>Ações reservadas à equipa Pic4Paws.</p>
        <button
          onClick={() => handleAction('verified')}
          disabled={submitting !== null}
          aria-busy={submitting === 'verified'}
        >
          {submitting === 'verified' ? 'A verificar...' : 'Verificar abrigo'}
        </button>
        <button
          onClick={() => handleAction('rejected')}
          disabled={submitting !== null}
          aria-busy={submitting === 'rejected'}
        >
          {submitting === 'rejected' ? 'A rejeitar...' : 'Rejeitar pedido'}
        </button>
        <button
          onClick={() => handleAction('suspended')}
          disabled={submitting !== null}
          aria-busy={submitting === 'suspended'}
        >
          {submitting === 'suspended' ? 'A suspender...' : 'Suspender abrigo'}
        </button>
      </section>

      <a href={`/abrigos/${shelterId}`}>Voltar ao abrigo</a>
    </main>
  );
}
