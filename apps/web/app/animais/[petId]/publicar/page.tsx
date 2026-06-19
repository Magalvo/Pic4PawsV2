'use client';

import { useState, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { createPetPublishClient } from '@pic4paws/client';
import {
  createWebPetPublishUi,
  type WebPetPublishReadyViewModel,
  type WebPetPublishResultViewModel,
} from '../../../../src/pet-publish';
import { workerUrl } from '../../../../src/env';

type ViewModel =
  | WebPetPublishReadyViewModel
  | { state: 'publishing'; title: string; message: string }
  | WebPetPublishResultViewModel;

export default function PublicarPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const searchParams = useSearchParams();
  const petName = searchParams.get('petName') ?? '';
  const router = useRouter();
  const [viewModel, setViewModel] = useState<ViewModel>({
    state: 'ready',
    title: petName ? `Publicar perfil de ${petName}` : 'Publicar perfil',
    message: 'Confirma que o rascunho está completo antes de publicar o perfil.',
    primaryAction: 'Publicar perfil',
    petId,
    petName,
  });

  const confirmPublish = useCallback(async () => {
    setViewModel({
      state: 'publishing',
      title: 'A publicar perfil',
      message: 'Estamos a confirmar o rascunho e a publicar o perfil.',
    });
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const publishClient = createPetPublishClient({
      workerBaseUrl: workerUrl(),
      petDraftsPath: '/pets/drafts',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebPetPublishUi({ publishClient });
    const result = await ui.publishPetDraft({ pet: { petId, petName } });
    setViewModel(result);
  }, [petId, petName]);

  if (viewModel.state === 'publishing') {
    return <p>{viewModel.title}</p>;
  }

  if (viewModel.state === 'published') {
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
        <button type="button" onClick={confirmPublish}>Tentar de novo</button>
        <button type="button" onClick={() => router.back()}>Cancelar</button>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <button type="button" onClick={confirmPublish}>{viewModel.primaryAction}</button>
      <button type="button" onClick={() => router.back()}>Cancelar</button>
    </main>
  );
}
