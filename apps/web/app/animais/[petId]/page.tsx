'use client';

import { use, useState, useEffect } from 'react';
import { createPetProfileClient, createMediaUrlClient, type PetProfilePet } from '@pic4paws/client';
import { createWebPetProfileUi, type WebPetProfileResultViewModel } from '../../../src/pet-profile';
import { workerUrl } from '../../../src/env';

type Props = {
  params: Promise<{ petId: string }>;
};

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐈', horse: '🐴', donkey: '🫏',
  guinea_pig: '🐹', rabbit: '🐇', bird: '🦜', other: '🐾',
};

const SPECIES_LABEL: Record<string, string> = {
  dog: 'Cão', cat: 'Gato', horse: 'Cavalo', donkey: 'Burro',
  guinea_pig: 'Porquinho-da-índia', rabbit: 'Coelho', bird: 'Ave', other: 'Animal',
};

function MedicalBadge({ label, value }: { label: string; value: boolean | null | undefined }) {
  if (value == null) return null;
  return (
    <div className={[
      'flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-sm font-semibold',
      value
        ? 'bg-teal-light text-teal'
        : 'bg-border/60 text-muted',
    ].join(' ')}>
      <span>{value ? '✓' : '✗'}</span>
      <span>{label}</span>
    </div>
  );
}

function PetProfileLoaded({ pet }: { pet: PetProfilePet }) {
  const emoji = pet.species ? (SPECIES_EMOJI[pet.species] ?? '🐾') : '🐾';
  const speciesLabel = pet.species ? (SPECIES_LABEL[pet.species] ?? 'Animal') : 'Animal';
  const { medical } = pet;
  const hasMedical = medical.vaccinated != null || medical.sterilized != null || medical.microchipped != null;
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pet.heroMediaId) return;
    const client = createMediaUrlClient({ workerBaseUrl: workerUrl(), mediaUrlPath: '/media', fetch: globalThis.fetch });
    client.getMediaUrl(pet.heroMediaId).then((result) => { if (result.ok) setImgUrl(result.url); });
  }, [pet.heroMediaId]);

  return (
    <>
      {/* Hero image area — 4:5 */}
      <div className="w-full relative bg-gradient-to-br from-primary/10 via-bg to-teal/10" style={{ paddingBottom: '125%', maxHeight: '520px' }}>
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {imgUrl
            ? <img src={imgUrl} alt={pet.name ?? 'Foto do animal'} className="w-full h-full object-cover" />
            : <span className="text-8xl">{emoji}</span>
          }
        </div>
        {/* Status overlay */}
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1.5 rounded-pill bg-primary text-white text-sm font-bold">
            Disponível para adopção
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-28">
        {/* Back link */}
        <a href="/animais" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink mt-5 mb-4 transition-colors">
          ← Voltar ao feed
        </a>

        {/* Pet name + meta */}
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">
          {pet.name ?? 'Animal sem nome'}
        </h1>
        <div className="flex items-center gap-2 mt-1 mb-4">
          <span className="text-sm text-muted">{speciesLabel}</span>
          {pet.locationLabel && (
            <>
              <span className="text-muted/40">·</span>
              <span className="text-sm text-muted">📍 {pet.locationLabel}</span>
            </>
          )}
        </div>

        {/* Shelter link */}
        <a
          href={`/abrigos/${pet.shelterId}`}
          className="inline-flex items-center gap-2 text-sm text-subtle font-medium hover:text-ink transition-colors mb-6"
        >
          🏠 Ver abrigo responsável
        </a>

        {/* Description */}
        {pet.shortDescription && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-ink mb-2">Sobre mim</h2>
            <p className="text-sm text-subtle leading-relaxed">{pet.shortDescription}</p>
          </section>
        )}

        {/* Medical badges */}
        {hasMedical && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-ink mb-3">Estado de saúde</h2>
            <div className="flex flex-wrap gap-2">
              <MedicalBadge label="Vacinado" value={medical.vaccinated} />
              <MedicalBadge label="Esterilizado" value={medical.sterilized} />
              <MedicalBadge label="Microchipado" value={medical.microchipped} />
              {medical.specialNeeds && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-sm font-semibold bg-amber-50 text-amber-700">
                  <span>⚠</span>
                  <span>Necessidades especiais</span>
                </div>
              )}
            </div>
            {medical.publicNotes && (
              <p className="mt-3 text-sm text-muted leading-relaxed">{medical.publicNotes}</p>
            )}
          </section>
        )}

        {/* Sponsorship teaser */}
        <section id="apadrinha" className="bg-teal-light rounded-card p-4 mb-6">
          <h2 className="text-base font-bold text-teal mb-1">Apadrinhar este animal</h2>
          <p className="text-sm text-subtle leading-snug">
            Contribui mensalmente para os cuidados deste animal mesmo que não possas adoptá-lo.
          </p>
        </section>
      </div>

      {/* Sticky bottom CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur border-t border-border px-4 py-3 flex gap-3">
        <a
          href="#apadrinha"
          className="flex-1 text-center py-3 rounded-cta bg-teal text-white text-sm font-bold hover:bg-teal-hover transition-colors"
        >
          🤲 Apadrinha
        </a>
        <a
          href={`/adocoes/novo?petId=${pet.id}`}
          className="flex-1 text-center py-3 rounded-cta bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
        >
          🐾 Adoptar
        </a>
      </div>
    </>
  );
}

export default function PetProfilePage({ params }: Props) {
  const { petId } = use(params);
  const [viewModel, setViewModel] = useState<WebPetProfileResultViewModel | null>(null);

  useEffect(() => {
    setViewModel(null);
    const profileClient = createPetProfileClient({
      workerBaseUrl: workerUrl(),
      petFeedPath: '/pets',
      fetch: globalThis.fetch,
    });
    const ui = createWebPetProfileUi({ profileClient });
    ui.loadProfile(petId).then(setViewModel);
  }, [petId]);

  if (viewModel === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-16">
        <span className="text-4xl animate-pulse">🐾</span>
        <p className="mt-4 text-muted text-sm" aria-live="polite">A carregar perfil...</p>
      </div>
    );
  }

  if (viewModel.state === 'not_found') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <span className="text-5xl">🔍</span>
        <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
        <p className="mt-2 text-muted text-sm mb-6">{viewModel.message}</p>
        <a href="/animais" className="text-primary font-semibold hover:underline">← Ver todos os animais</a>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <span className="text-5xl">⚠️</span>
        <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
        <p className="mt-2 text-muted text-sm mb-6">{viewModel.message}</p>
        <a href="/animais" className="text-primary font-semibold hover:underline">← Ver todos os animais</a>
      </main>
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

  return <PetProfileLoaded pet={viewModel.pet} />;
}
