'use client';

import { useState, useEffect, useRef } from 'react';
import { createShelterRegistrationClient } from '@pic4paws/client';
import {
  createWebShelterRegistrationUi,
  type WebShelterRegistrationState,
} from '../../../src/shelter-register';
import { createSupabaseBrowserClient } from '../../../src/supabase-browser';
import { workerUrl } from '../../../src/env';

type ShelterRegistrationUi = ReturnType<typeof createWebShelterRegistrationUi>;

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
      <main>
        <p aria-live="polite">A carregar...</p>
      </main>
    );
  }

  if (viewModel.state === 'registered') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href={`/abrigos/${viewModel.shelterId}`}>Ver abrigo</a>
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
        <button onClick={() => setViewModel(uiRef.current!.getInitialState())}>
          Tentar de novo
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Nome do abrigo
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Tipo
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="shelter">Canil / Gatil</option>
            <option value="sanctuary">Santuário</option>
            <option value="association">Associação</option>
            <option value="foster_network">Rede de acolhimento</option>
          </select>
        </label>
        <label>
          Cidade
          <input required value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
        <label>
          Distrito
          <input value={district} onChange={(e) => setDistrict(e.target.value)} />
        </label>
        <label>
          Email público
          <input type="email" value={publicEmail} onChange={(e) => setPublicEmail(e.target.value)} />
        </label>
        <label>
          Telefone público
          <input type="tel" value={publicPhone} onChange={(e) => setPublicPhone(e.target.value)} />
        </label>
        <label>
          Descrição
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'A registar...' : 'Registar abrigo'}
        </button>
      </form>
    </main>
  );
}
