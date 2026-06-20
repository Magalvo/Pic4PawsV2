'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createWebAuthUi, type WebPasswordConfirmViewModel } from '../../../src/auth';
import { createSupabaseBrowserClient } from '../../../src/supabase-browser';

function ConfirmarForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '';

  const [confirmState, setConfirmState] = useState<WebPasswordConfirmViewModel | null>(null);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!code) {
      setConfirmState({
        state: 'invalid_link',
        title: 'Link inválido',
        message: 'O link de recuperação é inválido ou já expirou. Pede um novo.',
      });
      return;
    }
    const authClient = createSupabaseBrowserClient();
    const ui = createWebAuthUi({ authClient });
    ui.exchangeResetCode(code).then(setConfirmState);
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const authClient = createSupabaseBrowserClient();
    const ui = createWebAuthUi({ authClient });
    const next = await ui.updatePassword(password);
    setConfirmState(next);
    setSubmitting(false);
  };

  if (!confirmState) {
    return (
      <main>
        <p>A verificar o link...</p>
      </main>
    );
  }

  if (confirmState.state === 'invalid_link') {
    return (
      <main>
        <h1>{confirmState.title}</h1>
        <p role="alert">{confirmState.message}</p>
        <a href="/recuperar-palavra-passe">Pedir novo link</a>
      </main>
    );
  }

  if (confirmState.state === 'updated') {
    return (
      <main>
        <h1>{confirmState.title}</h1>
        <p>{confirmState.message}</p>
        <a href="/entrar">Iniciar sessão</a>
      </main>
    );
  }

  return (
    <main>
      <h1>Nova palavra-passe</h1>
      {confirmState.state === 'failed' && (
        <p role="alert">{confirmState.message}</p>
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Nova palavra-passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={submitting}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'A atualizar...' : 'Atualizar palavra-passe'}
        </button>
      </form>
    </main>
  );
}

export default function ConfirmarPage() {
  return (
    <Suspense>
      <ConfirmarForm />
    </Suspense>
  );
}
