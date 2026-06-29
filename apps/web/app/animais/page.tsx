'use client';

import { useState, useEffect } from 'react';
import { createPetFeedClient, createMediaUrlClient, type PetFeedPet } from '@pic4paws/client';
import { createWebPetFeedUi, type WebPetFeedResultViewModel } from '../../src/pet-feed';
import { workerUrl } from '../../src/env';

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐈', horse: '🐴', donkey: '🫏',
  guinea_pig: '🐹', rabbit: '🐇', bird: '🦜', other: '🐾',
};

const SPECIES_LABEL: Record<string, string> = {
  dog: 'Cão', cat: 'Gato', horse: 'Cavalo', donkey: 'Burro',
  guinea_pig: 'Porquinho-da-índia', rabbit: 'Coelho', bird: 'Ave', other: 'Animal',
};

function PetCard({ pet }: { pet: PetFeedPet }) {
  const emoji = pet.species ? (SPECIES_EMOJI[pet.species] ?? '🐾') : '🐾';
  const speciesLabel = pet.species ? (SPECIES_LABEL[pet.species] ?? 'Animal') : 'Animal';
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pet.heroMediaId) return;
    const client = createMediaUrlClient({ workerBaseUrl: workerUrl(), mediaUrlPath: '/media', fetch: globalThis.fetch });
    client.getMediaUrl(pet.heroMediaId).then((result) => { if (result.ok) setImgUrl(result.url); });
  }, [pet.heroMediaId]);

  return (
    <article className="bg-surface rounded-card overflow-hidden shadow-sm border border-border flex flex-col">
      {/* 4:5 photo area */}
      <a href={`/animais/${pet.id}`} className="block relative" style={{ paddingBottom: '125%' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-bg to-teal/10 flex items-center justify-center overflow-hidden">
          {imgUrl
            ? <img src={imgUrl} alt={pet.name ?? 'Foto do animal'} className="w-full h-full object-cover" />
            : <span className="text-6xl">{emoji}</span>
          }
        </div>
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-pill bg-primary text-white text-xs font-bold">
          Disponível
        </span>
      </a>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs text-muted">{speciesLabel}</span>
          {pet.locationLabel && (
            <>
              <span className="text-muted/50">·</span>
              <span className="text-xs text-muted truncate">{pet.locationLabel}</span>
            </>
          )}
        </div>

        <h2 className="text-base font-bold text-ink mb-1">
          <a href={`/animais/${pet.id}`} className="hover:text-primary transition-colors">
            {pet.name ?? 'Animal sem nome'}
          </a>
        </h2>

        {pet.shortDescription && (
          <p className="text-sm text-muted leading-snug mb-4 line-clamp-2 flex-1">
            {pet.shortDescription}
          </p>
        )}

        <div className="flex gap-2 mt-auto pt-2">
          <a
            href={`/animais/${pet.id}`}
            className="flex-1 text-center py-2 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
          >
            Adoptar
          </a>
          <a
            href={`/animais/${pet.id}#apadrinha`}
            className="flex-1 text-center py-2 rounded-control bg-teal text-white text-sm font-bold hover:bg-teal-hover transition-colors"
          >
            Apadrinha
          </a>
        </div>
      </div>
    </article>
  );
}

export default function AnimaisPage() {
  const [viewModel, setViewModel] = useState<WebPetFeedResultViewModel | null>(null);

  useEffect(() => {
    const feedClient = createPetFeedClient({
      workerBaseUrl: workerUrl(),
      petFeedPath: '/pets',
      fetch: globalThis.fetch,
    });
    const ui = createWebPetFeedUi({ feedClient });
    ui.loadFeed({ query: {} }).then(setViewModel);
  }, []);

  if (viewModel === null) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-24">
          <span className="text-5xl animate-pulse">🐾</span>
          <p className="mt-4 text-muted text-sm" aria-live="polite">A carregar animais...</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'empty') {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-24">
          <span className="text-5xl">🔍</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-muted text-sm">{viewModel.message}</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-24">
          <span className="text-5xl">⚠️</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-muted text-sm">{viewModel.message}</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'idle') {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-24">
          <span className="text-5xl">🐾</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-muted text-sm">{viewModel.message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Animais disponíveis</h1>
        <span className="text-sm text-muted">{viewModel.total} animais</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {viewModel.pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </main>
  );
}
