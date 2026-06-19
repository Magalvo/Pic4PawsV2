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
    return <main><p>A carregar rascunho...</p></main>;
  }

  if (loadViewModel.state === 'not_found' || loadViewModel.state === 'forbidden') {
    return (
      <main>
        <h1>{loadViewModel.title}</h1>
        <p>{loadViewModel.message}</p>
        <button type="button" onClick={() => router.back()}>Voltar</button>
      </main>
    );
  }

  if (loadViewModel.state === 'failed' && !form) {
    return (
      <main>
        <h1>{loadViewModel.title}</h1>
        <p>{loadViewModel.message}</p>
        <button type="button" onClick={() => router.back()}>Voltar</button>
      </main>
    );
  }

  if (saveResult?.state === 'saved') {
    return (
      <main>
        <h1>{saveResult.title}</h1>
        <p>{saveResult.message}</p>
        <button type="button" onClick={() => router.back()}>Voltar</button>
      </main>
    );
  }

  if (saveResult?.state === 'failed') {
    return (
      <main>
        <h1>{saveResult.title}</h1>
        <p>{saveResult.message}</p>
        <button type="button" onClick={handleSave}>Tentar de novo</button>
        <button type="button" onClick={() => router.back()}>Cancelar</button>
      </main>
    );
  }

  if (!form) return null;

  return (
    <main>
      <h1>Guardar rascunho com imagem</h1>

      <label>
        Nome do animal
        <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} disabled={saving} />
      </label>

      <label>
        Espécie (dog / cat / other)
        <input type="text" value={form.species} onChange={(e) => setField('species', e.target.value)} disabled={saving} />
      </label>

      <label>
        Localização
        <input type="text" value={form.locationLabel} onChange={(e) => setField('locationLabel', e.target.value)} disabled={saving} />
      </label>

      <label>
        Descrição curta
        <textarea value={form.shortDescription} onChange={(e) => setField('shortDescription', e.target.value)} disabled={saving} />
      </label>

      <label>
        ID da imagem principal
        <input type="text" value={form.heroMediaId} onChange={(e) => setField('heroMediaId', e.target.value)} disabled={saving} />
      </label>

      <label>
        <input type="checkbox" checked={form.medical.vaccinated} onChange={(e) => setMedical('vaccinated', e.target.checked)} disabled={saving} />
        Vacinado
      </label>
      <label>
        <input type="checkbox" checked={form.medical.sterilized} onChange={(e) => setMedical('sterilized', e.target.checked)} disabled={saving} />
        Esterilizado
      </label>
      <label>
        <input type="checkbox" checked={form.medical.microchipped} onChange={(e) => setMedical('microchipped', e.target.checked)} disabled={saving} />
        Microchip
      </label>
      <label>
        <input type="checkbox" checked={form.medical.specialNeeds} onChange={(e) => setMedical('specialNeeds', e.target.checked)} disabled={saving} />
        Necessidades especiais
      </label>

      <label>
        Nova imagem (opcional)
        <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileChange} disabled={saving} />
      </label>

      <button type="button" onClick={handleSave} disabled={saving}>
        {saving ? 'A guardar...' : 'Guardar sem nova imagem'}
      </button>
      <button type="button" onClick={() => router.back()} disabled={saving}>Cancelar</button>
    </main>
  );
}
