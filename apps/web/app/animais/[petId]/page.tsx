'use client';

import { use, useState, useEffect } from 'react';
import { createPetProfileClient } from '@pic4paws/client';
import { createWebPetProfileUi, type WebPetProfileResultViewModel } from '../../../src/pet-profile';
import { workerUrl } from '../../../src/env';

type Props = {
  params: Promise<{ petId: string }>;
};

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
      <main>
        <p aria-live="polite">A carregar perfil...</p>
      </main>
    );
  }

  if (viewModel.state === 'not_found') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href="/animais">Ver todos os animais</a>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href="/animais">Ver todos os animais</a>
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

  const { pet } = viewModel;

  return (
    <main>
      <a href="/animais">← Voltar ao feed</a>
      <h1>{pet.name ?? 'Animal sem nome'}</h1>
      {pet.locationLabel != null && <p>{pet.locationLabel}</p>}
      {pet.shortDescription != null && <p>{pet.shortDescription}</p>}
      <a href={`/abrigos/${pet.shelterId}`}>Ver abrigo</a>
    </main>
  );
}
