'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createShelterRegistrationClient } from '@pic4paws/client';
import {
  createWebShelterRegistrationUi,
  type WebShelterRegistrationState,
} from '../../../src/shelter-register';
import { createSupabaseBrowserClient } from '../../../src/supabase-browser';
import { workerUrl } from '../../../src/env';

type ShelterRegistrationUi = ReturnType<typeof createWebShelterRegistrationUi>;

const inputCls = 'w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-50';

export default function RegistarAbrigoPage() {
  const [viewModel, setViewModel] = useState<WebShelterRegistrationState | null>(null);
  const uiRef = useRef<ShelterRegistrationUi | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('shelter');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [publicEmail, setPublicEmail] = useState('');
  const [publicPhone, setPublicPhone] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const shelterRegistrationClient = createShelterRegistrationClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebShelterRegistrationUi({ shelterRegistrationClient });
    uiRef.current = ui;
    setViewModel(ui.getInitialState());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uiRef.current) return;
    setSubmitting(true);
    const result = await uiRef.current.registerShelter({
      name,
      kind,
      city,
      district: district || null,
      publicEmail: publicEmail || null,
      publicPhone: publicPhone || null,
      description: description || null,
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

  if (viewModel.state === 'registered') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-md text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏠</span>
          </div>
          <h1 className="text-xl font-extrabold text-ink mb-2">{viewModel.title}</h1>
          <p className="text-sm text-muted mb-6">{viewModel.message}</p>
          <Link
            href={`/abrigos/${viewModel.shelterId}` as never}
            className="block w-full py-3 rounded-xl bg-teal text-white font-bold text-sm text-center"
          >
            Ver abrigo
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
              <Link href="/entrar" className="block w-full py-3 rounded-xl bg-primary text-white font-bold text-sm text-center">
                Entrar na conta
              </Link>
            )}
            <button
              type="button"
              onClick={() => setViewModel(uiRef.current!.getInitialState())}
              className="w-full py-3 rounded-xl border border-border text-ink font-semibold text-sm"
            >
              Tentar de novo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-ink mb-1">{viewModel.title}</h1>
          <p className="text-sm text-muted">Preenche os dados do teu abrigo para começares a publicar animais.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Basic info */}
          <section className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">Informações básicas</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink">Nome do abrigo</label>
                <input
                  className={inputCls}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  placeholder="Ex: Associação Amigos dos Animais"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink">Tipo</label>
                <select
                  className={inputCls}
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  disabled={submitting}
                >
                  <option value="shelter">Canil / Gatil</option>
                  <option value="sanctuary">Santuário</option>
                  <option value="association">Associação</option>
                  <option value="foster_network">Rede de acolhimento</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink">Cidade</label>
                  <input
                    className={inputCls}
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={submitting}
                    placeholder="Lisboa"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink">Distrito <span className="text-muted font-normal">(opcional)</span></label>
                  <input
                    className={inputCls}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    disabled={submitting}
                    placeholder="Lisboa"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Contact & description */}
          <section className="bg-surface rounded-2xl border border-border p-5">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">Contacto público <span className="normal-case font-normal">(opcional)</span></h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink">Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={publicEmail}
                    onChange={(e) => setPublicEmail(e.target.value)}
                    disabled={submitting}
                    placeholder="geral@abrigo.pt"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink">Telefone</label>
                  <input
                    type="tel"
                    className={inputCls}
                    value={publicPhone}
                    onChange={(e) => setPublicPhone(e.target.value)}
                    disabled={submitting}
                    placeholder="+351910000000"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink">Descrição</label>
                <textarea
                  className={`${inputCls} resize-none min-h-[80px]`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                  rows={3}
                  placeholder="Breve apresentação do abrigo..."
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-teal text-white font-bold text-sm disabled:opacity-40"
          >
            {submitting ? 'A registar...' : 'Registar abrigo'}
          </button>
        </form>
      </div>
    </div>
  );
}
