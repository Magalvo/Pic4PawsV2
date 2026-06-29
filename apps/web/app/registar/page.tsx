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

const inputClass =
  'w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50';

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
      <main className="min-h-dvh bg-bg flex items-center justify-center px-4">
        <span className="text-4xl animate-pulse">🐾</span>
      </main>
    );
  }

  if (viewModel.state === 'registered') {
    return (
      <main className="min-h-dvh bg-bg flex items-center justify-center px-4 py-12">
        <div className="bg-surface rounded-card border border-border p-8 shadow-sm w-full max-w-sm text-center">
          <span className="text-5xl">🎉</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-muted text-sm mb-6">{viewModel.message}</p>
          <a
            href="/entrar"
            className="block w-full py-2.5 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
          >
            Entrar na conta
          </a>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main className="min-h-dvh bg-bg flex items-center justify-center px-4 py-12">
        <div className="bg-surface rounded-card border border-border p-8 shadow-sm w-full max-w-sm text-center">
          <span className="text-5xl">⚠️</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-muted text-sm mb-6" role="alert">{viewModel.message}</p>
          {viewModel.status === 'email_already_registered' && (
            <div className="flex gap-3 mb-4">
              <a href="/entrar" className="flex-1 text-center py-2 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors">
                Entrar na conta
              </a>
              <a href="/recuperar-palavra-passe" className="flex-1 text-center py-2 rounded-control border border-border text-sm font-semibold text-muted hover:text-ink transition-colors">
                Recuperar
              </a>
            </div>
          )}
          <button
            onClick={() => setViewModel(uiRef.current!.getInitialState())}
            className="text-sm text-primary font-semibold hover:underline"
          >
            Tentar de novo
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-bg flex items-center justify-center px-4 py-12">
      <div className="bg-surface rounded-card border border-border p-8 shadow-sm w-full max-w-sm">
        <h1 className="text-2xl font-extrabold text-ink mb-1">Criar conta</h1>
        <p className="text-sm text-muted mb-6">
          Junta-te à comunidade Pic4Paws.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="o@teu.email"
              required
              disabled={submitting}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Nome a apresentar</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="O teu nome"
              required
              disabled={submitting}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Palavra-passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              disabled={submitting}
              className={inputClass}
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={gdprAccepted}
              onChange={(e) => setGdprAccepted(e.target.checked)}
              required
              disabled={submitting}
              className="mt-0.5 shrink-0 accent-primary"
            />
            <span className="text-xs text-muted leading-relaxed">
              Aceito os{' '}
              <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Termos de Utilização
              </a>{' '}
              e a{' '}
              <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Política de Privacidade
              </a>
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !gdprAccepted}
            className="w-full py-2.5 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-60 mt-1"
          >
            {submitting ? 'A criar conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-5 text-sm text-center text-muted">
          Já tens conta?{' '}
          <a href="/entrar" className="text-primary font-semibold hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </main>
  );
}
