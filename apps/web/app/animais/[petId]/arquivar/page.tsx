'use client';

import { useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { createPetArchiveClient } from '@pic4paws/client';
import {
  createWebPetArchiveUi,
  type WebPetArchiveIdleState,
  type WebPetArchiveSubmittingState,
  type WebPetArchiveResultViewModel,
} from '../../../../src/pet-archive';
import { workerUrl } from '../../../../src/env';

type ViewModel =
  | WebPetArchiveIdleState
  | WebPetArchiveSubmittingState
  | WebPetArchiveResultViewModel;

const IDLE: WebPetArchiveIdleState = {
  state: 'idle',
  title: 'Arquivar animal',
  message: 'Confirma que queres arquivar este animal.',
  primaryAction: 'Arquivar',
};

export default function ArquivarPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const router = useRouter();
  const [viewModel, setViewModel] = useState<ViewModel>(IDLE);

  const confirmArchive = useCallback(async () => {
    setViewModel({ state: 'submitting', title: 'A processar...', message: 'A arquivar o animal.' });
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const petArchiveClient = createPetArchiveClient({
      workerBaseUrl: workerUrl(),
      petFeedPath: '/pets',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebPetArchiveUi({ petArchiveClient });
    const result = await ui.archivePet(petId);
    setViewModel(result);
  }, [petId]);

  if (viewModel.state === 'submitting') {
    return <p>{viewModel.title}</p>;
  }

  if (viewModel.state === 'archived' || viewModel.state === 'published') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <button type="button" onClick={() => router.back()}>Voltar</button>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <button type="button" onClick={confirmArchive}>Tentar de novo</button>
        <button type="button" onClick={() => router.back()}>Cancelar</button>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <button type="button" onClick={confirmArchive}>{viewModel.primaryAction}</button>
      <button type="button" onClick={() => router.back()}>Cancelar</button>
    </main>
  );
}
