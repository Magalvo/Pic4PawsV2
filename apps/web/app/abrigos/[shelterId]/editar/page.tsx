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
      <main>
        <p aria-live="polite">A carregar dados do abrigo...</p>
      </main>
    );
  }

  if (profileFailed) {
    return (
      <main>
        <h1>Abrigo não encontrado</h1>
        <p>Não foi possível carregar os dados deste abrigo.</p>
        <a href="/abrigos">Ver abrigos</a>
      </main>
    );
  }

  if (viewModel === null) {
    return (
      <main>
        <p aria-live="polite">A carregar...</p>
      </main>
    );
  }

  if (viewModel.state === 'updated') {
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
          {submitting ? 'A guardar...' : 'Guardar alterações'}
        </button>
      </form>
      <a href={`/abrigos/${shelterId}/verificar`}>Verificar abrigo</a>
    </main>
  );
}
