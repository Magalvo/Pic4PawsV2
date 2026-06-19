'use client';

import { useState, useCallback, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../../../../src/supabase-browser';
import { createPetDraftClient } from '@pic4paws/client';
import type { LoadPetDraftClientDraft } from '@pic4paws/client';
import {
  createWebPetDraftUi,
  type WebPetDraftLoadViewModel,
  type WebPetDraftResultViewModel,
} from '../../../../../src/pet-draft';
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
});

const makeDraftClient = (getAccessToken: () => Promise<string | null>) =>
  createPetDraftClient({
    workerBaseUrl: workerUrl(),
    petDraftsPath: '/pets/drafts',
    getAccessToken,
    fetch: globalThis.fetch,
  });

export default function EditarDraftPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const router = useRouter();
  const [loadViewModel, setLoadViewModel] = useState<WebPetDraftLoadViewModel | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<WebPetDraftResultViewModel | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const ui = createWebPetDraftUi({ draftClient: makeDraftClient(getAccessToken) });
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

  const handleSave = useCallback(async () => {
    if (!form) return;
    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const ui = createWebPetDraftUi({ draftClient: makeDraftClient(getAccessToken) });
    const result = await ui.updateDraft({
      draft: {
        petId,
        shelterId: form.shelterId,
        name: form.name || null,
        species: (form.species || null) as 'dog' | 'cat' | 'other' | null,
        locationLabel: form.locationLabel || null,
        shortDescription: form.shortDescription || null,
        mediaIds: [],
        heroMediaId: form.heroMediaId || null,
        medical: form.medical,
      },
    });
    setSaveResult(result);
    setSaving(false);
  }, [petId, form]);

  if (!loadViewModel) {
    return <p>A carregar rascunho...</p>;
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
      <h1>Editar rascunho</h1>

      <label>Nome do animal
        <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} disabled={saving} />
      </label>

      <label>Espécie
        <select value={form.species} onChange={(e) => setField('species', e.target.value)} disabled={saving}>
          <option value="">Selecionar</option>
          <option value="dog">Cão</option>
          <option value="cat">Gato</option>
          <option value="other">Outro</option>
        </select>
      </label>

      <label>Localização
        <input type="text" value={form.locationLabel} onChange={(e) => setField('locationLabel', e.target.value)} disabled={saving} />
      </label>

      <label>Descrição curta
        <textarea value={form.shortDescription} onChange={(e) => setField('shortDescription', e.target.value)} disabled={saving} rows={3} />
      </label>

      <label>ID da imagem principal
        <input type="text" value={form.heroMediaId} onChange={(e) => setField('heroMediaId', e.target.value)} disabled={saving} />
      </label>

      <label><input type="checkbox" checked={form.medical.vaccinated} onChange={(e) => setMedical('vaccinated', e.target.checked)} disabled={saving} /> Vacinado</label>
      <label><input type="checkbox" checked={form.medical.sterilized} onChange={(e) => setMedical('sterilized', e.target.checked)} disabled={saving} /> Esterilizado</label>
      <label><input type="checkbox" checked={form.medical.microchipped} onChange={(e) => setMedical('microchipped', e.target.checked)} disabled={saving} /> Microchip</label>
      <label><input type="checkbox" checked={form.medical.specialNeeds} onChange={(e) => setMedical('specialNeeds', e.target.checked)} disabled={saving} /> Necessidades especiais</label>

      <button type="button" onClick={handleSave} disabled={saving}>
        {saving ? 'A guardar...' : 'Guardar rascunho'}
      </button>
      <button type="button" onClick={() => router.back()} disabled={saving}>Cancelar</button>
    </main>
  );
}
