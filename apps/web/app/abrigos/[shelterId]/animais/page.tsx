'use client';

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { createShelterPetListClient } from '@pic4paws/client';
import type { ShelterPetStatus } from '@pic4paws/client';
import { createWebShelterPetListUi, type WebShelterPetListResultViewModel } from '../../../../src/shelter-pet-list';
import { workerUrl } from '../../../../src/env';

const STATUS_LABELS: Record<ShelterPetStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  adoption_pending: 'Adoção pendente',
  adopted: 'Adotado',
  not_available: 'Indisponível',
  archived: 'Arquivado',
};

export default function AnimaisPage({ params }: { params: Promise<{ shelterId: string }> }) {
  const { shelterId } = use(params);
  const [viewModel, setViewModel] = useState<WebShelterPetListResultViewModel | null>(null);

  const load = useCallback(async () => {
    setViewModel(null);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const shelterPetListClient = createShelterPetListClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebShelterPetListUi({ shelterPetListClient });
    ui.loadShelterPets(shelterId).then(setViewModel);
  }, [shelterId]);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null) return <p>A carregar animais...</p>;

  if (viewModel.state === 'forbidden') {
    return (
      <main>
        <p>{viewModel.message}</p>
        <Link href="/entrar">Entrar na conta</Link>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <button type="button" onClick={load}>Tentar de novo</button>
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

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <ul>
        {viewModel.pets.map((pet) => (
          <li key={pet.petId}>
            <Link href={`/animais/${pet.petId}`}>
              {pet.name ?? pet.petId} — {STATUS_LABELS[pet.status] ?? pet.status}
              {pet.species ? ` — ${pet.species}` : ''}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
