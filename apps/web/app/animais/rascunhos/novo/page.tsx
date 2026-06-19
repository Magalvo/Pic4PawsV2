'use client';

import { Suspense, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { createPetDraftClient } from '@pic4paws/client';
import {
  createWebPetDraftUi,
  type WebPetDraftResultViewModel,
} from '../../../../src/pet-draft';
import { workerUrl } from '../../../../src/env';

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
  medical: MedicalForm;
};

const emptyForm: FormState = {
  name: '',
  species: '',
  locationLabel: '',
  shortDescription: '',
  heroMediaId: '',
  medical: { vaccinated: false, sterilized: false, microchipped: false, specialNeeds: false },
};

function NovoDraftContent() {
  const searchParams = useSearchParams();
  const shelterId = searchParams.get('shelterId') ?? '';
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<WebPetDraftResultViewModel | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setMedical = (key: keyof MedicalForm, value: boolean) =>
    setForm((prev) => ({ ...prev, medical: { ...prev.medical, [key]: value } }));

  const handleSave = useCallback(async () => {
    setSaving(true);
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
    const result = await ui.createDraft({
      draft: {
        petId: '',
        shelterId,
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
  }, [shelterId, form]);

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

  return (
    <main>
      <h1>Novo rascunho</h1>

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

export default function NovoDraftPage() {
  return (
    <Suspense fallback={<p>A carregar...</p>}>
      <NovoDraftContent />
    </Suspense>
  );
}
