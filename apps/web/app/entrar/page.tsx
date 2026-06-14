'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createWebAuthUi, type WebAuthSignInResultViewModel } from '../../src/auth';
import { supabaseUrl, supabaseAnonKey } from '../../src/env';

export default function EntrarPage() {
  const [result, setResult] = useState<WebAuthSignInResultViewModel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    const authClient = createClient(supabaseUrl(), supabaseAnonKey(), {
      auth: { persistSession: false },
    });
    const ui = createWebAuthUi({ authClient });
    const next = await ui.signIn(email, password);
    setResult(next);
    setSubmitting(false);
  };

  if (result?.state === 'signed_in') {
    return (
      <main>
        <h1>{result.title}</h1>
        <p>{result.message}</p>
        <a href="/animais">Ver animais</a>
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
