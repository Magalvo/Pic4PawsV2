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
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-md text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏳</span>
          </div>
          <h1 className="text-lg font-bold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted">{viewModel.message}</p>
        </div>
      </div>
    );
  }

  if (viewModel.state === 'published') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-md text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h1 className="text-xl font-extrabold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-6">{viewModel.message}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full py-3 rounded-xl bg-teal text-white font-bold text-sm"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-md text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-extrabold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-6">{viewModel.message}</p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={confirmPublish}
              className="w-full py-3 rounded-xl bg-teal text-white font-bold text-sm"
            >
              Tentar de novo
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full py-3 rounded-xl border border-border text-ink font-semibold text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-md shadow-sm">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <h1 className="text-xl font-extrabold text-ink mb-2">{viewModel.title}</h1>
        <p className="text-sm text-muted mb-6">{viewModel.message}</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={confirmPublish}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm"
          >
            {viewModel.primaryAction}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full py-3 rounded-xl border border-border text-ink font-semibold text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
