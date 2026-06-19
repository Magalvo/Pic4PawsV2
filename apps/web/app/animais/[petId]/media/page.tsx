'use client';

import { useState, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import {
  createMediaUploadFlowClient,
  createPetMediaAttachClient,
  createPetMediaUploadAttachFlowClient,
} from '@pic4paws/client';
import {
  createWebPetMediaUploadUi,
  type WebPetMediaUploadReadyViewModel,
  type WebPetMediaUploadResultViewModel,
} from '../../../../src/pet-media-upload';
import { workerUrl } from '../../../../src/env';

type ViewModel = WebPetMediaUploadReadyViewModel | WebPetMediaUploadResultViewModel;

export default function MediaPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const searchParams = useSearchParams();
  const petName = searchParams.get('petName') ?? '';
  const shelterId = searchParams.get('shelterId') ?? '';
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [viewModel, setViewModel] = useState<ViewModel>(() =>
    createWebPetMediaUploadUi({
      uploadAttachFlow: {
        uploadAndAttachPetMedia: async () => { throw new Error('unreachable'); },
      },
    }).getInitialState({ petId, petName, shelterId })
  );

  const makeUi = useCallback(() => {
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const uploadClient = createMediaUploadFlowClient({
      workerBaseUrl: workerUrl(),
      mediaUploadPath: '/uploads/media',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const attachClient = createPetMediaAttachClient({
      workerBaseUrl: workerUrl(),
      petDraftsPath: '/pets/drafts',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const uploadAttachFlow = createPetMediaUploadAttachFlowClient({
      uploadClient,
      attachClient,
      generateMediaId: () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    });
    return createWebPetMediaUploadUi({ uploadAttachFlow });
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ui = makeUi();
    const result = await ui.uploadSelectedImage({
      pet: { petId, petName, shelterId },
      file: { name: file.name, type: file.type, size: file.size, body: file },
    });
    setViewModel(result);
    setUploading(false);
  }, [makeUi, petId, petName, shelterId]);

  if (viewModel.state === 'uploaded') {
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
        <label>
          Escolher outro ficheiro
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        <button type="button" onClick={() => router.back()}>Cancelar</button>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <label>
        {uploading ? 'A enviar...' : viewModel.primaryAction}
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
      <button type="button" onClick={() => router.back()} disabled={uploading}>Cancelar</button>
    </main>
  );
}
