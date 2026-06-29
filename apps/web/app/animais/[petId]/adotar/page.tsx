'use client';

import { use, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
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

const inputCls = 'w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-ink">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
      <span className="text-sm text-ink">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 accent-teal"
      />
    </label>
  );
}

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

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setToggle = (field: keyof FormState) => (value: boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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

  if (viewModel === null) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-muted text-sm" aria-live="polite">A carregar...</p>
      </div>
    );
  }

  if (viewModel.state === 'submitted') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-md text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🐾</span>
          </div>
          <h1 className="text-xl font-extrabold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-6">{viewModel.message}</p>
          <Link
            href={`/animais/${petId}`}
            className="block w-full py-3 rounded-xl bg-teal text-white font-bold text-sm text-center"
          >
            Voltar ao perfil do animal
          </Link>
        </div>
      </div>
    );
  }

  if (viewModel.state === 'pet_not_found') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-md text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h1 className="text-xl font-extrabold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-6">{viewModel.message}</p>
          <Link
            href="/animais"
            className="block w-full py-3 rounded-xl bg-primary text-white font-bold text-sm text-center"
          >
            Ver animais disponíveis
          </Link>
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
            {viewModel.status === 'unauthenticated' && (
              <Link
                href="/entrar"
                className="block w-full py-3 rounded-xl bg-primary text-white font-bold text-sm text-center"
              >
                Entrar na conta
              </Link>
            )}
            <Link
              href={`/animais/${petId}`}
              className="block w-full py-3 rounded-xl border border-border text-ink font-semibold text-sm text-center"
            >
              Voltar ao perfil do animal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canSubmit = !submitting && form.dataProcessingAccepted && form.shelterContactAccepted;

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-extrabold text-ink mb-1">{viewModel.title}</h1>
        <p className="text-sm text-muted mb-6">{viewModel.message}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Personal info */}
          <section className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">Dados pessoais</h2>
            <div className="flex flex-col gap-4">
              <Field label="Nome completo">
                <input
                  type="text"
                  className={inputCls}
                  value={form.applicantFullName}
                  onChange={set('applicantFullName')}
                  required
                  disabled={submitting}
                  autoComplete="name"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className={inputCls}
                  value={form.applicantEmail}
                  onChange={set('applicantEmail')}
                  required
                  disabled={submitting}
                  autoComplete="email"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone">
                  <input
                    type="tel"
                    className={inputCls}
                    value={form.applicantPhoneNumber}
                    onChange={set('applicantPhoneNumber')}
                    required
                    disabled={submitting}
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Cidade">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.applicantCity}
                    onChange={set('applicantCity')}
                    required
                    disabled={submitting}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Housing */}
          <section className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">Habitação e contexto</h2>
            <div className="flex flex-col gap-4">
              <Field label="Tipo de habitação">
                <select
                  className={inputCls}
                  value={form.housingType}
                  onChange={set('housingType')}
                  disabled={submitting}
                >
                  <option value="apartment">Apartamento</option>
                  <option value="house">Casa</option>
                  <option value="farm">Quinta</option>
                  <option value="other">Outro</option>
                </select>
              </Field>
              <div className="divide-y divide-border">
                <Toggle
                  label="Tem espaço exterior"
                  checked={form.hasOutdoorSpace}
                  onChange={setToggle('hasOutdoorSpace')}
                  disabled={submitting}
                />
                <Toggle
                  label="Tem crianças em casa"
                  checked={form.hasChildren}
                  onChange={setToggle('hasChildren')}
                  disabled={submitting}
                />
                <Toggle
                  label="Tem outros animais"
                  checked={form.hasOtherAnimals}
                  onChange={setToggle('hasOtherAnimals')}
                  disabled={submitting}
                />
              </div>
            </div>
          </section>

          {/* Experience */}
          <section className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">Experiência e motivação</h2>
            <div className="flex flex-col gap-4">
              <Field label="Experiência com animais">
                <textarea
                  className={`${inputCls} resize-none min-h-[72px]`}
                  value={form.previousPetExperience}
                  onChange={set('previousPetExperience')}
                  required
                  disabled={submitting}
                  rows={3}
                />
              </Field>
              <Field label="Rotina diária">
                <textarea
                  className={`${inputCls} resize-none min-h-[72px]`}
                  value={form.dailyRoutine}
                  onChange={set('dailyRoutine')}
                  required
                  disabled={submitting}
                  rows={3}
                />
              </Field>
              <Field label="Motivação para adotar">
                <textarea
                  className={`${inputCls} resize-none min-h-[72px]`}
                  value={form.adoptionMotivation}
                  onChange={set('adoptionMotivation')}
                  required
                  disabled={submitting}
                  rows={3}
                />
              </Field>
            </div>
          </section>

          {/* Consent */}
          <section className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">Consentimento</h2>
            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.dataProcessingAccepted}
                  onChange={set('dataProcessingAccepted')}
                  required
                  disabled={submitting}
                  className="mt-0.5 h-4 w-4 accent-teal flex-shrink-0"
                />
                <span className="text-sm text-ink">
                  Aceito o tratamento dos meus dados pessoais para efeitos desta candidatura.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.shelterContactAccepted}
                  onChange={set('shelterContactAccepted')}
                  required
                  disabled={submitting}
                  className="mt-0.5 h-4 w-4 accent-teal flex-shrink-0"
                />
                <span className="text-sm text-ink">
                  Aceito ser contactado pelo abrigo para seguimento da candidatura.
                </span>
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-40"
          >
            {submitting ? 'A enviar...' : 'Candidatar'}
          </button>
        </form>
      </div>
    </div>
  );
}
