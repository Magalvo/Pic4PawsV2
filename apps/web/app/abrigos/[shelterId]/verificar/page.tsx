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
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-surface rounded-card border border-border p-8 shadow-sm text-center">
          <span className="text-5xl">✓</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted mb-6">{viewModel.message}</p>
          <a href={`/abrigos/${viewModel.shelterId}`} className="inline-block px-5 py-2.5 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors">
            Ver abrigo →
          </a>
        </div>
      </main>
    );
  }

  if (viewModel?.state === 'failed') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-surface rounded-card border border-red-200 p-8 shadow-sm text-center">
          <span className="text-5xl">⚠️</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted mb-6">{viewModel.message}</p>
          {viewModel.status === 'unauthenticated' && (
            <a href="/entrar" className="block text-primary text-sm font-semibold hover:underline mb-4">Entrar na conta</a>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="px-4 py-2 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors">
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
        <h1 className="text-2xl font-extrabold text-ink">Verificação do abrigo</h1>
      </div>

      <div className="flex flex-col gap-4">
        {/* Shelter owner panel */}
        <section className="bg-surface rounded-card border border-border p-5 shadow-sm">
          <h2 className="text-base font-bold text-ink mb-1">Responsável do abrigo</h2>
          <p className="text-sm text-muted mb-4">
            Submete o abrigo para revisão pela equipa Pic4Paws para ficares visível no feed.
          </p>
          <button
            onClick={() => handleAction('pending_review')}
            disabled={submitting !== null}
            aria-busy={submitting === 'pending_review'}
            className="px-5 py-2.5 rounded-control bg-teal text-white text-sm font-bold hover:bg-teal-hover transition-colors disabled:opacity-60"
          >
            {submitting === 'pending_review' ? 'A submeter...' : 'Submeter para revisão'}
          </button>
        </section>

        {/* Admin panel */}
        <section className="bg-surface rounded-card border border-border p-5 shadow-sm">
          <h2 className="text-base font-bold text-ink mb-1">Administração</h2>
          <p className="text-sm text-muted mb-4">Ações reservadas à equipa Pic4Paws.</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAction('verified')}
              disabled={submitting !== null}
              className="px-4 py-2 rounded-control bg-teal text-white text-sm font-bold hover:bg-teal-hover transition-colors disabled:opacity-60"
            >
              {submitting === 'verified' ? 'A verificar...' : 'Verificar abrigo'}
            </button>
            <button
              onClick={() => handleAction('rejected')}
              disabled={submitting !== null}
              className="px-4 py-2 rounded-control border border-amber-300 text-amber-700 text-sm font-bold hover:bg-amber-50 transition-colors disabled:opacity-60"
            >
              {submitting === 'rejected' ? 'A rejeitar...' : 'Rejeitar pedido'}
            </button>
            <button
              onClick={() => handleAction('suspended')}
              disabled={submitting !== null}
              className="px-4 py-2 rounded-control border border-border text-muted text-sm font-bold hover:text-ink transition-colors disabled:opacity-60"
            >
              {submitting === 'suspended' ? 'A suspender...' : 'Suspender abrigo'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
