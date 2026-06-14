'use client';

import { useState, useEffect } from 'react';
import { createPetFeedClient } from '@pic4paws/client';
import { createWebPetFeedUi, type WebPetFeedResultViewModel } from '../../src/pet-feed';
import { workerUrl } from '../../src/env';

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
      <main>
        <p aria-live="polite">A carregar animais...</p>
      </main>
    );
  }

  if (viewModel.state === 'idle') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
      </main>
    );
  }

  if (viewModel.state === 'empty') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.total} animais disponíveis</p>
      <ul>
        {viewModel.pets.map((pet) => (
          <li key={pet.id}>
            <a href={`/animais/${pet.id}`}>
              <strong>{pet.name ?? 'Animal sem nome'}</strong>
              {pet.locationLabel != null && <span> — {pet.locationLabel}</span>}
              {pet.shortDescription != null && <p>{pet.shortDescription}</p>}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
