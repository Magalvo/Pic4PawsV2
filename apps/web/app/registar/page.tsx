'use client';

import { useState, useEffect, useRef } from 'react';
import { createUserRegistrationClient } from '@pic4paws/client';
import {
  createWebUserRegistrationUi,
  type WebUserRegistrationState,
} from '../../src/user-register';
import { workerUrl } from '../../src/env';

const GDPR_CONSENT_VERSION = 'v1';

type UserRegistrationUi = ReturnType<typeof createWebUserRegistrationUi>;

export default function RegistarPage() {
  const [viewModel, setViewModel] = useState<WebUserRegistrationState | null>(null);
  const uiRef = useRef<UserRegistrationUi | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userRegistrationClient = createUserRegistrationClient({
      workerBaseUrl: workerUrl(),
      usersPath: '/users',
      fetch: globalThis.fetch,
    });
    const ui = createWebUserRegistrationUi({ userRegistrationClient });
    uiRef.current = ui;
    setViewModel(ui.getInitialState());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uiRef.current) return;
    setSubmitting(true);
    const result = await uiRef.current.registerUser({
      email,
      password,
      displayName,
      gdprConsentVersion: GDPR_CONSENT_VERSION,
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
        <a href="/entrar">Entrar na conta</a>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p role="alert">{viewModel.message}</p>
        {viewModel.status === 'email_already_registered' && (
          <>
            <a href="/entrar">Entrar na conta</a>
            {' · '}
            <a href="/recuperar-palavra-passe">Recuperar palavra-passe</a>
          </>
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
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
          />
        </label>
        <label>
          Palavra-passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={submitting}
          />
        </label>
        <label>
          Nome a apresentar
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={submitting}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={gdprAccepted}
            onChange={(e) => setGdprAccepted(e.target.checked)}
            required
            disabled={submitting}
          />
          Aceito os{' '}
          <a href="/termos" target="_blank" rel="noopener noreferrer">
            Termos de Utilização
          </a>{' '}
          e a{' '}
          <a href="/privacidade" target="_blank" rel="noopener noreferrer">
            Política de Privacidade
          </a>
        </label>
        <button type="submit" disabled={submitting || !gdprAccepted}>
          {submitting ? 'A criar conta...' : 'Criar conta'}
        </button>
      </form>
      <p>
        Já tens conta? <a href="/entrar">Entra aqui</a>
      </p>
    </main>
  );
}
