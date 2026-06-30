'use client';

import { use, useState, useEffect, useRef } from 'react';
import { createShelterProfileClient, createShelterUpdateClient } from '@pic4paws/client';
import {
  createWebShelterUpdateUi,
  type WebShelterUpdateState,
} from '../../../../src/shelter-update';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { workerUrl } from '../../../../src/env';

type Props = { params: Promise<{ shelterId: string }> };
type ShelterUpdateUi = ReturnType<typeof createWebShelterUpdateUi>;

const inputClass = 'w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50';

const KIND_OPTIONS = [
  { value: 'shelter', label: 'Canil / Gatil' },
  { value: 'sanctuary', label: 'Santuário' },
  { value: 'association', label: 'Associação' },
  { value: 'foster_network', label: 'Rede de acolhimento' },
];

export default function EditarAbrigoPage({ params }: Props) {
  const { shelterId } = use(params);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileFailed, setProfileFailed] = useState(false);
  const [viewModel, setViewModel] = useState<WebShelterUpdateState | null>(null);
  const uiRef = useRef<ShelterUpdateUi | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [kind, setKind] = useState('shelter');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [publicEmail, setPublicEmail] = useState('');
  const [publicPhone, setPublicPhone] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setProfileLoading(true);
    setProfileFailed(false);
    setViewModel(null);

    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };

    const shelterProfileClient = createShelterProfileClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      fetch: globalThis.fetch,
    });

    const shelterUpdateClient = createShelterUpdateClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });

    const ui = createWebShelterUpdateUi({ shelterUpdateClient });
    uiRef.current = ui;

    shelterProfileClient.loadProfile(shelterId).then((result) => {
      if (result.ok) {
        const s = result.shelter;
        setName(s.name);
        setKind(s.kind);
        setCity(s.city);
        setDistrict(s.district ?? '');
        setPublicEmail(s.publicEmail ?? '');
        setPublicPhone(s.publicPhone ?? '');
        setDescription(s.description ?? '');
        setViewModel(ui.getInitialState());
      } else {
        setProfileFailed(true);
      }
      setProfileLoading(false);
    });
  }, [shelterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uiRef.current) return;
    setSubmitting(true);
    const result = await uiRef.current.updateShelter(shelterId, {
      name: name || undefined,
      kind: kind || undefined,
      city: city || undefined,
      district: district || null,
      publicEmail: publicEmail || null,
      publicPhone: publicPhone || null,
      description: description || null,
    });
    setViewModel(result);
    setSubmitting(false);
  };

  if (profileLoading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl animate-pulse">🏠</span>
          <p className="mt-4 text-muted text-sm" aria-live="polite">A carregar dados do abrigo...</p>
        </div>
      </main>
    );
  }

  if (profileFailed) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl">🔍</span>
          <h1 className="mt-4 text-xl font-bold text-ink">Abrigo não encontrado</h1>
          <p className="mt-2 text-sm text-muted">Não foi possível carregar os dados deste abrigo.</p>
          <a href="/abrigos" className="mt-4 inline-block text-primary text-sm font-semibold hover:underline">← Ver abrigos</a>
        </div>
      </main>
    );
  }

  if (viewModel?.state === 'updated') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-surface rounded-card border border-border p-8 shadow-sm text-center">
          <span className="text-5xl">✓</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted mb-6">{viewModel.message}</p>
          <a href={`/abrigos/${viewModel.shelterId}`} className="inline-block px-5 py-2.5 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors">
            Ver abrigo →
          </a>
        </div>
      </main>
    );
  }

  if (viewModel?.state === 'failed') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-surface rounded-card border border-red-200 p-8 shadow-sm text-center">
          <span className="text-5xl">⚠️</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted mb-6">{viewModel.message}</p>
          {viewModel.status === 'unauthenticated' && (
            <a href="/entrar" className="text-primary text-sm font-semibold hover:underline block mb-4">Entrar na conta</a>
          )}
          <button onClick={() => setViewModel(uiRef.current!.getInitialState())} className="px-4 py-2 rounded-control border border-border text-sm font-semibold text-muted hover:text-ink transition-colors">
            Tentar de novo
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <a href={`/abrigos/${shelterId}`} className="text-sm text-muted hover:text-ink transition-colors">← Voltar</a>
        <h1 className="text-2xl font-extrabold text-ink">Editar abrigo</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface rounded-card border border-border p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-ink mb-1.5">Nome do abrigo</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Tipo</label>
            <select value={kind} onChange={(e) => setKind(e.target.value)} disabled={submitting} className={inputClass}>
              {KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Cidade</label>
            <input required value={city} onChange={(e) => setCity(e.target.value)} disabled={submitting} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Distrito <span className="text-muted font-normal">(opcional)</span></label>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} disabled={submitting} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Email público <span className="text-muted font-normal">(opcional)</span></label>
            <input type="email" value={publicEmail} onChange={(e) => setPublicEmail(e.target.value)} disabled={submitting} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Telefone público <span className="text-muted font-normal">(opcional)</span></label>
            <input type="tel" value={publicPhone} onChange={(e) => setPublicPhone(e.target.value)} disabled={submitting} className={inputClass} />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-ink mb-1.5">Descrição <span className="text-muted font-normal">(opcional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <a href={`/abrigos/${shelterId}/verificar`} className="text-sm text-muted hover:text-ink transition-colors">
            Verificação do abrigo →
          </a>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {submitting ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      </form>
    </main>
  );
}
