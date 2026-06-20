'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createWebAuthUi, type WebAuthSignInResultViewModel } from '../../src/auth';
import { createSupabaseBrowserClient } from '../../src/supabase-browser';
import { validateNextPath } from '../../src/nav';

function EntrarForm() {
  const searchParams = useSearchParams();
  const returnTo = validateNextPath(searchParams.get('next')) ?? '/animais';

  const [result, setResult] = useState<WebAuthSignInResultViewModel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    const authClient = createSupabaseBrowserClient();
    const ui = createWebAuthUi({ authClient });
    const next = await ui.signIn(email, password);
    setResult(next);
    setSubmitting(false);
    if (next.state === 'signed_in') {
      window.location.href = returnTo;
    }
  };

  if (result?.state === 'signed_in') {
    return (
      <main>
        <h1>{result.title}</h1>
        <p>{result.message}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Entrar</h1>
      {result?.state === 'failed' && (
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
            disabled={submitting}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'A entrar...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}

export default function EntrarPage() {
  return (
    <Suspense>
      <EntrarForm />
    </Suspense>
  );
}
