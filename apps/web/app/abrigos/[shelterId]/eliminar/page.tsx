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
    return (
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl animate-pulse">⏳</span>
          <p className="mt-4 text-muted text-sm">{viewModel.title}</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'deleted') {
    return (
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-surface rounded-card border border-border p-8 shadow-sm text-center">
          <span className="text-5xl">✓</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted mb-6">{viewModel.message}</p>
          <button
            type="button"
            onClick={() => router.replace('/abrigos')}
            className="px-5 py-2.5 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-surface rounded-card border border-red-200 p-8 shadow-sm text-center">
          <span className="text-5xl">⚠️</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted mb-6">{viewModel.message}</p>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-control border border-border text-sm font-semibold text-muted hover:text-ink transition-colors">
            Voltar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="bg-surface rounded-card border border-red-200 p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <h1 className="text-xl font-extrabold text-ink">{viewModel.title}</h1>
            <p className="mt-1 text-sm text-red-600 font-medium">Esta ação é irreversível.</p>
          </div>
        </div>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          O abrigo e todos os seus dados serão desactivados. Os animais publicados
          deixarão de aparecer no feed. Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-control border border-border text-sm font-semibold text-muted hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="flex-1 py-2.5 rounded-control bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
          >
            Confirmar eliminação
          </button>
        </div>
      </div>
    </main>
  );
}
