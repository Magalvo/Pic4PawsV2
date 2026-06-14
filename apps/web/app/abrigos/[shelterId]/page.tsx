'use client';

import { use, useState, useEffect } from 'react';
import { createShelterProfileClient } from '@pic4paws/client';
import {
  createWebShelterProfileUi,
  type WebShelterProfileResultViewModel,
} from '../../../src/shelter-profile';
import { workerUrl } from '../../../src/env';

type Props = { params: Promise<{ shelterId: string }> };

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
      <main>
        <p aria-live="polite">A carregar perfil do abrigo...</p>
      </main>
    );
  }

  if (viewModel.state === 'idle') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href="/abrigos">Ver todos os abrigos</a>
      </main>
    );
  }

  if (viewModel.state === 'not_found') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href="/abrigos">Ver todos os abrigos</a>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href="/abrigos">Ver todos os abrigos</a>
      </main>
    );
  }

  const { shelter } = viewModel;

  return (
    <main>
      <h1>{shelter.name}</h1>
      <p>{shelter.city}{shelter.district ? `, ${shelter.district}` : ''}</p>
      {shelter.description && <p>{shelter.description}</p>}
      {shelter.publicEmail && <p>Email: {shelter.publicEmail}</p>}
      {shelter.publicPhone && <p>Telefone: {shelter.publicPhone}</p>}
      <a href="/abrigos">Ver todos os abrigos</a>
    </main>
  );
}
