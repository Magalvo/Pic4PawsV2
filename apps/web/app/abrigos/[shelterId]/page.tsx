'use client';

import { use, useState, useEffect } from 'react';
import { createShelterProfileClient, type ShelterProfileClientShelter } from '@pic4paws/client';
import {
  createWebShelterProfileUi,
  type WebShelterProfileResultViewModel,
} from '../../../src/shelter-profile';
import { workerUrl } from '../../../src/env';

type Props = { params: Promise<{ shelterId: string }> };

const KIND_LABEL: Record<string, string> = {
  shelter: 'Abrigo',
  sanctuary: 'Santuário',
  association: 'Associação',
  foster_network: 'Rede de Acolhimento',
};

const KIND_EMOJI: Record<string, string> = {
  shelter: '🏠',
  sanctuary: '🌿',
  association: '🤝',
  foster_network: '🏡',
};

function ShelterLoaded({ shelter, shelterId }: { shelter: ShelterProfileClientShelter; shelterId: string }) {
  const kindLabel = shelter.kind ? (KIND_LABEL[shelter.kind] ?? 'Abrigo') : 'Abrigo';
  const kindEmoji = shelter.kind ? (KIND_EMOJI[shelter.kind] ?? '🏠') : '🏠';
  const isVerified = shelter.verificationStatus === 'verified';

  return (
    <>
      {/* Hero banner */}
      <div className="w-full bg-gradient-to-br from-teal/10 via-bg to-primary/10 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-10">
          {/* Back link */}
          <a
            href="/abrigos"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors mb-6"
          >
            ← Todos os abrigos
          </a>

          {/* Logo placeholder + name */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-card bg-gradient-to-br from-teal/20 to-primary/20 flex items-center justify-center text-3xl flex-shrink-0">
              {kindEmoji}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-ink tracking-tight leading-tight">
                {shelter.name}
              </h1>
              <p className="text-sm text-muted mt-0.5">
                📍 {shelter.city}{shelter.district ? `, ${shelter.district}` : ''}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-pill bg-teal-light text-teal text-xs font-semibold">
              {kindLabel}
            </span>
            {isVerified && (
              <span className="px-3 py-1 rounded-pill bg-teal-light text-teal text-xs font-semibold">
                ✓ Verificado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Description */}
        {shelter.description && (
          <section>
            <h2 className="text-base font-bold text-ink mb-2">Sobre nós</h2>
            <p className="text-sm text-subtle leading-relaxed">{shelter.description}</p>
          </section>
        )}

        {/* Contact card */}
        {(shelter.publicEmail || shelter.publicPhone) && (
          <section>
            <h2 className="text-base font-bold text-ink mb-3">Contactos</h2>
            <div className="rounded-card border border-border bg-surface p-4 space-y-2">
              {shelter.publicEmail && (
                <a
                  href={`mailto:${shelter.publicEmail}`}
                  className="flex items-center gap-2 text-sm text-ink hover:text-primary transition-colors"
                >
                  <span className="text-muted">✉</span>
                  {shelter.publicEmail}
                </a>
              )}
              {shelter.publicPhone && (
                <a
                  href={`tel:${shelter.publicPhone}`}
                  className="flex items-center gap-2 text-sm text-ink hover:text-primary transition-colors"
                >
                  <span className="text-muted">📞</span>
                  {shelter.publicPhone}
                </a>
              )}
            </div>
          </section>
        )}

        {/* Quick actions */}
        <section>
          <h2 className="text-base font-bold text-ink mb-3">Explorar</h2>
          <div className="grid grid-cols-1 gap-3">
            <a
              href={`/animais`}
              className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-3 hover:border-primary hover:bg-primary/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🐾</span>
                <div>
                  <p className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                    Animais disponíveis
                  </p>
                  <p className="text-xs text-muted">Ver todos os animais para adopção</p>
                </div>
              </div>
              <span className="text-muted group-hover:text-primary transition-colors">→</span>
            </a>

            <a
              href={`/abrigos/${shelterId}/animais`}
              className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-3 hover:border-teal hover:bg-teal/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📋</span>
                <div>
                  <p className="text-sm font-semibold text-ink group-hover:text-teal transition-colors">
                    Gerir residentes
                  </p>
                  <p className="text-xs text-muted">Lista de animais do abrigo</p>
                </div>
              </div>
              <span className="text-muted group-hover:text-teal transition-colors">→</span>
            </a>

            <a
              href={`/abrigos/${shelterId}/financeiro`}
              className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-3 hover:border-teal hover:bg-teal/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💰</span>
                <div>
                  <p className="text-sm font-semibold text-ink group-hover:text-teal transition-colors">
                    Resumo financeiro
                  </p>
                  <p className="text-xs text-muted">Donativos e apadrinhamentos</p>
                </div>
              </div>
              <span className="text-muted group-hover:text-teal transition-colors">→</span>
            </a>
          </div>
        </section>
      </div>
    </>
  );
}

export default function ShelterProfilePage({ params }: Props) {
  const { shelterId } = use(params);
  const [viewModel, setViewModel] = useState<WebShelterProfileResultViewModel | null>(null);

  useEffect(() => {
    setViewModel(null);
    const shelterProfileClient = createShelterProfileClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      fetch: globalThis.fetch,
    });
    const ui = createWebShelterProfileUi({ shelterProfileClient });
    ui.loadProfile(shelterId).then(setViewModel);
  }, [shelterId]);

  if (viewModel === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-16">
        <span className="text-4xl animate-pulse">🏠</span>
        <p className="mt-4 text-muted text-sm" aria-live="polite">A carregar abrigo...</p>
      </div>
    );
  }

  if (viewModel.state === 'idle') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-ink">{viewModel.title}</h1>
        <p className="mt-2 text-muted text-sm">{viewModel.message}</p>
      </main>
    );
  }

  if (viewModel.state === 'not_found') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <span className="text-5xl">🔍</span>
        <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
        <p className="mt-2 text-muted text-sm mb-6">{viewModel.message}</p>
        <a href="/abrigos" className="text-teal font-semibold hover:underline">← Ver todos os abrigos</a>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <span className="text-5xl">⚠️</span>
        <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
        <p className="mt-2 text-muted text-sm mb-6">{viewModel.message}</p>
        <a href="/abrigos" className="text-teal font-semibold hover:underline">← Ver todos os abrigos</a>
      </main>
    );
  }

  return <ShelterLoaded shelter={viewModel.shelter} shelterId={shelterId} />;
}
