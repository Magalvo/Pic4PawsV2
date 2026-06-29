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

const STATUS_BADGE: Record<ShelterPetStatus, string> = {
  draft: 'bg-amber-50 text-amber-700',
  published: 'bg-teal/10 text-teal',
  adoption_pending: 'bg-primary/10 text-primary',
  adopted: 'bg-slate-100 text-muted',
  not_available: 'bg-slate-100 text-muted',
  archived: 'bg-slate-100 text-muted',
};

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐈', horse: '🐴', donkey: '🫏',
  guinea_pig: '🐹', rabbit: '🐇', bird: '🦜', other: '🐾',
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

  if (viewModel === null) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-muted text-sm">A carregar animais...</p>
      </div>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-sm text-center shadow-sm">
          <span className="text-4xl mb-4 block">🔒</span>
          <p className="text-sm text-muted mb-4">{viewModel.message}</p>
          <Link href="/entrar" className="block w-full py-3 rounded-xl bg-primary text-white font-bold text-sm text-center">
            Entrar na conta
          </Link>
        </div>
      </div>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-sm text-center shadow-sm">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h1 className="text-lg font-bold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-6">{viewModel.message}</p>
          <button
            type="button"
            onClick={load}
            className="w-full py-3 rounded-xl bg-teal text-white font-bold text-sm"
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  if (viewModel.state === 'empty') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-sm text-center shadow-sm">
          <span className="text-4xl mb-4 block">🐾</span>
          <h1 className="text-lg font-bold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted">{viewModel.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-extrabold text-ink mb-6">{viewModel.title}</h1>

        <ul className="flex flex-col gap-3">
          {viewModel.pets.map((pet) => {
            const emoji = pet.species ? (SPECIES_EMOJI[pet.species] ?? '🐾') : '🐾';
            const badgeCls = STATUS_BADGE[pet.status] ?? 'bg-slate-100 text-muted';
            const label = STATUS_LABELS[pet.status] ?? pet.status;

            return (
              <li key={pet.petId} className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center text-2xl flex-shrink-0">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink text-sm truncate">{pet.name ?? pet.petId}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${badgeCls}`}>
                    {label}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {pet.status === 'draft' && (
                    <>
                      <Link
                        href={`/animais/${pet.petId}/editar` as never}
                        className="px-3 py-1.5 rounded-lg border border-border text-ink text-xs font-semibold hover:bg-bg"
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/animais/${pet.petId}/publicar?petName=${encodeURIComponent(pet.name ?? '')}` as never}
                        className="px-3 py-1.5 rounded-lg bg-teal text-white text-xs font-semibold"
                      >
                        Publicar
                      </Link>
                    </>
                  )}
                  {pet.status !== 'draft' && (
                    <Link
                      href={`/animais/${pet.petId}` as never}
                      className="px-3 py-1.5 rounded-lg border border-border text-ink text-xs font-semibold hover:bg-bg"
                    >
                      Ver perfil
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
