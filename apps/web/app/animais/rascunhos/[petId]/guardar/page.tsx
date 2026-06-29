'use client';

import { useState, useCallback, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../../../../src/supabase-browser';
import {
  createPetDraftClient,
  createMediaUploadFlowClient,
  createPetMediaAttachClient,
  createPetMediaUploadAttachFlowClient,
  createPetDraftSaveFlowClient,
} from '@pic4paws/client';
import type { LoadPetDraftClientDraft, PetDraftSaveFlowFileInput } from '@pic4paws/client';
import {
  createWebPetDraftUi,
  type WebPetDraftLoadViewModel,
} from '../../../../../src/pet-draft';
import {
  createWebPetDraftSaveFlowUi,
  type WebPetDraftSaveFlowReadyViewModel,
  type WebPetDraftSaveFlowResultViewModel,
} from '../../../../../src/pet-draft-save-flow';
import { workerUrl } from '../../../../../src/env';

type MedicalForm = {
  vaccinated: boolean;
  sterilized: boolean;
  microchipped: boolean;
  specialNeeds: boolean;
};

type FormState = {
  name: string;
  species: string;
  locationLabel: string;
  shortDescription: string;
  heroMediaId: string;
  shelterId: string;
  medical: MedicalForm;
  mediaIds: string[];
};

const fromDraft = (draft: LoadPetDraftClientDraft): FormState => ({
  name: draft.name ?? '',
  species: draft.species ?? '',
  locationLabel: draft.locationLabel ?? '',
  shortDescription: draft.shortDescription ?? '',
  heroMediaId: draft.heroMediaId ?? '',
  shelterId: draft.shelterId,
  medical: {
    vaccinated: Boolean(draft.medical.vaccinated),
    sterilized: Boolean(draft.medical.sterilized),
    microchipped: Boolean(draft.medical.microchipped),
    specialNeeds: Boolean(draft.medical.specialNeeds),
  },
  mediaIds: draft.mediaIds,
});

const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Cão', emoji: '🐕' },
  { value: 'cat', label: 'Gato', emoji: '🐈' },
  { value: 'other', label: 'Outro', emoji: '🐾' },
] as const;

const MEDICAL_TOGGLES: { key: keyof MedicalForm; label: string }[] = [
  { key: 'vaccinated', label: 'Vacinado' },
  { key: 'sterilized', label: 'Esterilizado' },
  { key: 'microchipped', label: 'Microchipado' },
  { key: 'specialNeeds', label: 'Necessidades especiais' },
];

const makeSaveFlowClient = (getAccessToken: () => Promise<string | null>) => {
  const draftClient = createPetDraftClient({
    workerBaseUrl: workerUrl(),
    petDraftsPath: '/pets/drafts',
    getAccessToken,
    fetch: globalThis.fetch,
  });
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
  const uploadAttachClient = createPetMediaUploadAttachFlowClient({
    uploadClient,
    attachClient,
    generateMediaId: () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
  });
  return createPetDraftSaveFlowClient({ draftClient, uploadAttachClient });
};

export default function GuardarDraftPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const router = useRouter();
  const [loadViewModel, setLoadViewModel] = useState<WebPetDraftLoadViewModel | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saveFlowReady, setSaveFlowReady] = useState<WebPetDraftSaveFlowReadyViewModel>(() =>
    createWebPetDraftSaveFlowUi({
      saveFlowClient: { savePetDraft: async () => { throw new Error('unreachable'); } },
    }).getInitialState({ petName: null })
  );
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<WebPetDraftSaveFlowResultViewModel | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const draftClient = createPetDraftClient({
      workerBaseUrl: workerUrl(),
      petDraftsPath: '/pets/drafts',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebPetDraftUi({ draftClient });
    ui.loadDraft(petId).then((result) => {
      setLoadViewModel(result);
      if (result.state === 'loaded') {
        setForm(fromDraft(result.draft));
        setSaveFlowReady(
          createWebPetDraftSaveFlowUi({
            saveFlowClient: { savePetDraft: async () => { throw new Error('unreachable'); } },
          }).getInitialState({ petName: result.draft.name ?? null })
        );
      }
    });
  }, [petId]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);

  const setMedical = (key: keyof MedicalForm, value: boolean) =>
    setForm((prev) => prev ? { ...prev, medical: { ...prev.medical, [key]: value } } : prev);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const newFiles: PetDraftSaveFlowFileInput[] = [{
      name: file.name,
      type: file.type,
      size: file.size,
      body: file,
    }];
    const saveFlowUi = createWebPetDraftSaveFlowUi({ saveFlowClient: makeSaveFlowClient(getAccessToken) });
    const result = await saveFlowUi.saveDraft({
      context: { petName: form.name || null },
      draft: {
        operation: 'update',
        petId,
        shelterId: form.shelterId,
        name: form.name || null,
        species: (form.species || null) as 'dog' | 'cat' | 'other' | null,
        locationLabel: form.locationLabel || null,
        shortDescription: form.shortDescription || null,
        existingMediaIds: form.mediaIds,
        heroMediaId: form.heroMediaId || null,
        medical: form.medical,
        newFiles,
      },
    });
    setSaveResult(result);
    setSaving(false);
  }, [petId, form]);

  const handleSave = useCallback(async () => {
    if (!form) return;
    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const saveFlowUi = createWebPetDraftSaveFlowUi({ saveFlowClient: makeSaveFlowClient(getAccessToken) });
    const result = await saveFlowUi.saveDraft({
      context: { petName: form.name || null },
      draft: {
        operation: 'update',
        petId,
        shelterId: form.shelterId,
        name: form.name || null,
        species: (form.species || null) as 'dog' | 'cat' | 'other' | null,
        locationLabel: form.locationLabel || null,
        shortDescription: form.shortDescription || null,
        existingMediaIds: form.mediaIds,
        heroMediaId: form.heroMediaId || null,
        medical: form.medical,
        newFiles: undefined,
      },
    });
    setSaveResult(result);
    setSaving(false);
  }, [petId, form]);

  if (!loadViewModel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 py-16">
        <span className="text-4xl animate-pulse">🐾</span>
        <p className="mt-4 text-muted text-sm">A carregar rascunho...</p>
      </div>
    );
  }

  if (loadViewModel.state === 'not_found' || loadViewModel.state === 'forbidden') {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60dvh] px-4 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <h1 className="text-xl font-bold text-ink mb-2">{loadViewModel.title}</h1>
        <p className="text-muted text-sm mb-6">{loadViewModel.message}</p>
        <button type="button" onClick={() => router.back()} className="text-teal font-semibold hover:underline text-sm">
          ← Voltar
        </button>
      </main>
    );
  }

  if (loadViewModel.state === 'failed' && !form) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60dvh] px-4 text-center">
        <span className="text-5xl mb-4">⚠️</span>
        <h1 className="text-xl font-bold text-ink mb-2">{loadViewModel.title}</h1>
        <p className="text-muted text-sm mb-6">{loadViewModel.message}</p>
        <button type="button" onClick={() => router.back()} className="text-teal font-semibold hover:underline text-sm">
          ← Voltar
        </button>
      </main>
    );
  }

  if (saveResult?.state === 'saved') {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60dvh] px-4 text-center">
        <span className="text-5xl mb-4">✅</span>
        <h1 className="text-xl font-bold text-ink mb-2">{saveResult.title}</h1>
        <p className="text-muted text-sm mb-6">{saveResult.message}</p>
        <button type="button" onClick={() => router.back()} className="text-teal font-semibold hover:underline text-sm">
          ← Voltar
        </button>
      </main>
    );
  }

  if (saveResult?.state === 'failed') {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60dvh] px-4 text-center">
        <span className="text-5xl mb-4">⚠️</span>
        <h1 className="text-xl font-bold text-ink mb-2">{saveResult.title}</h1>
        <p className="text-muted text-sm mb-6">{saveResult.message}</p>
        <div className="flex gap-3 justify-center">
          <button type="button" onClick={handleSave} className="px-5 py-2.5 rounded-cta bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors">
            Tentar de novo
          </button>
          <button type="button" onClick={() => router.back()} className="px-5 py-2.5 rounded-cta border border-border text-muted text-sm font-semibold hover:border-primary/50 transition-colors">
            Cancelar
          </button>
        </div>
      </main>
    );
  }

  if (!form) return null;

  return (
    <>
      <div className="max-w-xl mx-auto px-4 pt-6 pb-28">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors mb-6"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-extrabold text-ink tracking-tight mb-1">{saveFlowReady.title}</h1>
        <p className="text-muted text-sm mb-6">Adiciona uma foto e guarda o rascunho.</p>

        {/* Photo drop-zone */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-ink mb-2">Adicionar foto</p>
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full rounded-card border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 cursor-pointer transition-colors py-10 gap-3 text-center"
          >
            <span className="text-4xl">{saving ? '⏳' : '📸'}</span>
            <div>
              <p className="text-sm font-semibold text-ink">
                {saving ? 'A fazer upload...' : 'Clica para adicionar foto'}
              </p>
              <p className="text-xs text-muted mt-1">JPG, PNG ou WebP</p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={saving}
              className="sr-only"
            />
          </label>
          {form.heroMediaId && (
            <p className="mt-2 text-xs text-muted font-mono truncate">
              Atual: {form.heroMediaId}
            </p>
          )}
        </div>

        {/* Species chips */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-ink mb-2">Espécie</p>
          <div className="flex flex-wrap gap-2">
            {SPECIES_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={saving}
                onClick={() => setField('species', form.species === opt.value ? '' : opt.value)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-semibold border transition-colors disabled:opacity-60',
                  form.species === opt.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-muted border-border hover:border-primary/50',
                ].join(' ')}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="mb-5">
          <label htmlFor="draft-name" className="block text-sm font-semibold text-ink mb-1.5">
            Nome do animal
          </label>
          <input
            id="draft-name"
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            disabled={saving}
            placeholder="Ex: Bolacha"
            className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-ink text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-60"
          />
        </div>

        {/* Location */}
        <div className="mb-5">
          <label htmlFor="draft-location" className="block text-sm font-semibold text-ink mb-1.5">
            Localização
          </label>
          <input
            id="draft-location"
            type="text"
            value={form.locationLabel}
            onChange={(e) => setField('locationLabel', e.target.value)}
            disabled={saving}
            placeholder="Ex: Lisboa, Portugal"
            className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-ink text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-60"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label htmlFor="draft-desc" className="block text-sm font-semibold text-ink mb-1.5">
            Descrição curta
          </label>
          <textarea
            id="draft-desc"
            value={form.shortDescription}
            onChange={(e) => setField('shortDescription', e.target.value)}
            disabled={saving}
            rows={4}
            placeholder="Descreve o animal — personalidade, rotinas, necessidades..."
            className="w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-ink text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-60 resize-none"
          />
        </div>

        {/* Medical toggles */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-ink mb-2">Estado de saúde</p>
          <div className="flex flex-wrap gap-2">
            {MEDICAL_TOGGLES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                disabled={saving}
                onClick={() => setMedical(key, !form.medical[key])}
                className={[
                  'flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-semibold border transition-colors disabled:opacity-60',
                  form.medical[key]
                    ? 'bg-teal text-white border-teal'
                    : 'bg-surface text-muted border-border hover:border-teal/50',
                ].join(' ')}
              >
                {form.medical[key] && <span>✓</span>}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-sm border-t border-border px-4 py-3 flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={saving}
          className="px-5 py-3 rounded-cta border border-border text-muted text-sm font-semibold hover:border-primary/50 transition-colors disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 rounded-cta bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {saving ? 'A guardar...' : 'Guardar sem nova foto'}
        </button>
      </div>
    </>
  );
}
