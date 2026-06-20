'use client';

import { useState } from 'react';
import { createWebAuthUi, type WebPasswordResetRequestViewModel } from '../../src/auth';
import { createSupabaseBrowserClient } from '../../src/supabase-browser';

function RecuperarPalavraPasForm() {
  const [result, setResult] = useState<WebPasswordResetRequestViewModel>({ state: 'idle' });
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult({ state: 'submitting' });
    const authClient = createSupabaseBrowserClient();
    const ui = createWebAuthUi({ authClient });
    const redirectTo = `${window.location.origin}/recuperar-palavra-passe/confirmar`;
    const next = await ui.requestPasswordReset(email, redirectTo);
    setResult(next);
  };

  if (result.state === 'email_sent') {
    return (
      <main>
        <h1>{result.title}</h1>
        <p>{result.message}</p>
        <a href="/entrar">Voltar ao início de sessão</a>
      </main>
    );
  }

  return (
    <main>
      <h1>Recuperar palavra-passe</h1>
      {result.state === 'failed' && (
        <p role="alert">{result.message}</p>
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={result.state === 'submitting'}
          />
        </label>
        <button type="submit" disabled={result.state === 'submitting'}>
          {result.state === 'submitting' ? 'A enviar...' : 'Enviar link de recuperação'}
        </button>
      </form>
      <a href="/entrar">Voltar ao início de sessão</a>
    </main>
  );
}

export default function RecuperarPalavraPasPage() {
  return <RecuperarPalavraPasForm />;
}
