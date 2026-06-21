'use client';

import { useState, useEffect } from 'react';
import { createShelterSearchClient } from '@pic4paws/client';
import {
  createWebShelterSearchUi,
  type WebShelterSearchResultViewModel,
} from '../../src/shelter-search';
import { workerUrl } from '../../src/env';

export default function AbrigosPage() {
  const [viewModel, setViewModel] = useState<WebShelterSearchResultViewModel | null>(null);

  useEffect(() => {
    const shelterSearchClient = createShelterSearchClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      fetch: globalThis.fetch,
    });
    const ui = createWebShelterSearchUi({ shelterSearchClient });
    ui.searchShelters({}).then(setViewModel);
  }, []);

  if (viewModel === null) {
    return (
      <main>
        <p aria-live="polite">A carregar abrigos...</p>
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
      <p>{viewModel.total} abrigos verificados</p>
      <ul>
        {viewModel.shelters.map((shelter) => (
          <li key={shelter.id}>
            <a href={`/abrigos/${shelter.id}`}>
              <strong>{shelter.name}</strong>
              <span> — {shelter.city}</span>
            </a>
          </li>
        ))}
      </ul>
      <a href="/admin/abrigos-pendentes">Fila de revisão</a>
    </main>
  );
}
