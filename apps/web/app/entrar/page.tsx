'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createWebAuthUi, type WebAuthSignInResultViewModel } from '../../src/auth';
import { createSupabaseBrowserClient } from '../../src/supabase-browser';
import { validateNextPath } from '../../src/nav';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50';

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
      <div className="text-center py-16">
        <span className="text-4xl">✓</span>
        <h1 className="mt-4 text-xl font-bold text-ink">{result.title}</h1>
        <p className="mt-2 text-muted text-sm">{result.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-card border border-border p-8 shadow-sm w-full max-w-sm">
      <h1 className="text-2xl font-extrabold text-ink mb-1">Entrar</h1>
      <p className="text-sm text-muted mb-6">
        Bem-vindo de volta ao Pic4Paws.
      </p>

      {result?.state === 'failed' && (
        <div className="mb-4 px-4 py-3 rounded-control bg-red-50 border border-red-200 text-sm text-red-700" role="alert">
          {result.message}
        </div>
      )}

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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-ink">Palavra-passe</label>
            <a href="/recuperar-palavra-passe" className="text-xs text-primary hover:underline">
              Esqueceste?
            </a>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={submitting}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors disabled:opacity-60 mt-2"
        >
          {submitting ? 'A entrar...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-5 text-sm text-center text-muted">
        Ainda não tens conta?{' '}
        <a href="/registar" className="text-primary font-semibold hover:underline">
          Criar conta
        </a>
      </p>
    </div>
  );
}

export default function EntrarPage() {
  return (
    <main className="min-h-dvh bg-bg flex items-center justify-center px-4 py-12">
      <Suspense>
        <EntrarForm />
      </Suspense>
    </main>
  );
}
