'use client';

import { use, useRef, useState, useEffect } from 'react';
import { createAdoptionApplicationClient } from '@pic4paws/client';
import type { HousingType } from '@pic4paws/client';
import {
  createWebAdoptionUi,
  type WebAdoptionResultViewModel,
} from '../../../../src/adoption';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { workerUrl } from '../../../../src/env';

type Props = { params: Promise<{ petId: string }> };

type AdoptionUi = ReturnType<typeof createWebAdoptionUi>;

type FormState = {
  applicantFullName: string;
  applicantEmail: string;
  applicantPhoneNumber: string;
  applicantCity: string;
  housingType: HousingType;
  hasOutdoorSpace: boolean;
  hasChildren: boolean;
  hasOtherAnimals: boolean;
  previousPetExperience: string;
  dailyRoutine: string;
  adoptionMotivation: string;
  dataProcessingAccepted: boolean;
  shelterContactAccepted: boolean;
};

const initialForm: FormState = {
  applicantFullName: '',
  applicantEmail: '',
  applicantPhoneNumber: '',
  applicantCity: '',
  housingType: 'apartment',
  hasOutdoorSpace: false,
  hasChildren: false,
  hasOtherAnimals: false,
  previousPetExperience: '',
  dailyRoutine: '',
  adoptionMotivation: '',
  dataProcessingAccepted: false,
  shelterContactAccepted: false,
};

export default function AdotarPage({ params }: Props) {
  const { petId } = use(params);
  const uiRef = useRef<AdoptionUi | null>(null);
  const [viewModel, setViewModel] = useState<WebAdoptionResultViewModel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const adoptionApplicationClient = createAdoptionApplicationClient({
      workerBaseUrl: workerUrl(),
      adoptionsPath: '/adoptions',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebAdoptionUi({ adoptionApplicationClient });
    uiRef.current = ui;
    setViewModel(ui.getInitialState());
  }, [petId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uiRef.current || !form.dataProcessingAccepted || !form.shelterContactAccepted) return;
    setSubmitting(true);
    const result = await uiRef.current.submitApplication({
      petId,
      applicantFullName: form.applicantFullName,
      applicantEmail: form.applicantEmail,
      applicantPhoneNumber: form.applicantPhoneNumber,
      applicantCity: form.applicantCity,
      housingType: form.housingType,
      hasOutdoorSpace: form.hasOutdoorSpace,
      hasChildren: form.hasChildren,
      hasOtherAnimals: form.hasOtherAnimals,
      previousPetExperience: form.previousPetExperience,
      dailyRoutine: form.dailyRoutine,
      adoptionMotivation: form.adoptionMotivation,
      dataProcessingAccepted: true,
      shelterContactAccepted: true,
      consentVersion: 'v1.0',
      consentAcceptedAt: new Date().toISOString(),
    });
    setViewModel(result);
    setSubmitting(false);
  };

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (viewModel === null) {
    return (
      <main>
        <p aria-live="polite">A carregar...</p>
      </main>
    );
  }

  if (viewModel.state === 'submitted') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href={`/animais/${petId}`}>Voltar ao perfil do animal</a>
      </main>
    );
  }

  if (viewModel.state === 'pet_not_found') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href="/animais">Ver animais disponíveis</a>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        {viewModel.status === 'unauthenticated' && (
          <a href="/entrar">Entrar na conta</a>
        )}
        <a href={`/animais/${petId}`}>Voltar ao perfil do animal</a>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <form onSubmit={handleSubmit}>
        <label>
          Nome completo
          <input type="text" value={form.applicantFullName} onChange={set('applicantFullName')} required disabled={submitting} />
        </label>
        <label>
          Email
          <input type="email" value={form.applicantEmail} onChange={set('applicantEmail')} required disabled={submitting} />
        </label>
        <label>
          Telefone
          <input type="tel" value={form.applicantPhoneNumber} onChange={set('applicantPhoneNumber')} required disabled={submitting} />
        </label>
        <label>
          Cidade
          <input type="text" value={form.applicantCity} onChange={set('applicantCity')} required disabled={submitting} />
        </label>
        <label>
          Tipo de habitação
          <select value={form.housingType} onChange={set('housingType')} disabled={submitting}>
            <option value="apartment">Apartamento</option>
            <option value="house">Casa</option>
            <option value="farm">Quinta</option>
            <option value="other">Outro</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={form.hasOutdoorSpace} onChange={set('hasOutdoorSpace')} disabled={submitting} />
          Tem espaço exterior
        </label>
        <label>
          <input type="checkbox" checked={form.hasChildren} onChange={set('hasChildren')} disabled={submitting} />
          Tem crianças em casa
        </label>
        <label>
          <input type="checkbox" checked={form.hasOtherAnimals} onChange={set('hasOtherAnimals')} disabled={submitting} />
          Tem outros animais
        </label>
        <label>
          Experiência com animais
          <textarea value={form.previousPetExperience} onChange={set('previousPetExperience')} required disabled={submitting} />
        </label>
        <label>
          Rotina diária
          <textarea value={form.dailyRoutine} onChange={set('dailyRoutine')} required disabled={submitting} />
        </label>
        <label>
          Motivação para adotar
          <textarea value={form.adoptionMotivation} onChange={set('adoptionMotivation')} required disabled={submitting} />
        </label>
        <label>
          <input type="checkbox" checked={form.dataProcessingAccepted} onChange={set('dataProcessingAccepted')} required disabled={submitting} />
          Aceito o tratamento de dados pessoais
        </label>
        <label>
          <input type="checkbox" checked={form.shelterContactAccepted} onChange={set('shelterContactAccepted')} required disabled={submitting} />
          Aceito ser contactado pelo abrigo
        </label>
        <button type="submit" disabled={submitting || !form.dataProcessingAccepted || !form.shelterContactAccepted}>
          {submitting ? 'A enviar...' : 'Candidatar'}
        </button>
      </form>
    </main>
  );
}
