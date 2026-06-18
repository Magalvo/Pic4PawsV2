'use client';

import { useState, useCallback } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { createShelterDeletionClient } from '@pic4paws/client';
import { createWebShelterDeletionUi, type WebShelterDeletionState } from '../../../../src/shelter-delete';
import { workerUrl } from '../../../../src/env';

const IDLE: WebShelterDeletionState = {
  state: 'idle',
  title: 'Eliminar abrigo',
};

export default function EliminarPage({ params }: { params: Promise<{ shelterId: string }> }) {
  const { shelterId } = use(params);
  const router = useRouter();
  const [viewModel, setViewModel] = useState<WebShelterDeletionState>(IDLE);

  const confirmDelete = useCallback(async () => {
    setViewModel({ state: 'submitting', title: 'A eliminar...' });
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const shelterDeletionClient = createShelterDeletionClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebShelterDeletionUi({ shelterDeletionClient });
    const result = await ui.deleteShelter(shelterId);
    setViewModel(result);
  }, [shelterId]);

  if (viewModel.state === 'submitting') {
    return <p>{viewModel.title}</p>;
  }

  if (viewModel.state === 'deleted') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <button type="button" onClick={() => router.replace('/abrigos')}>
          Voltar ao início
        </button>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <button type="button" onClick={() => router.back()}>Voltar</button>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p style={{ color: 'red' }}>
        Esta ação é irreversível. O abrigo e todos os seus dados serão desativados.
      </p>
      <button type="button" onClick={confirmDelete}>Confirmar eliminação</button>
      <button type="button" onClick={() => router.back()}>Cancelar</button>
    </main>
  );
}
