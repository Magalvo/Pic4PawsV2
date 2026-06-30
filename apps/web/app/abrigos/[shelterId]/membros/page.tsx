'use client';

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { createShelterMemberClient } from '@pic4paws/client';
import type { ShelterMemberClientRole } from '@pic4paws/client';
import { createWebShelterMemberUi, type WebShelterMemberListResultViewModel } from '../../../../src/shelter-member';
import { workerUrl } from '../../../../src/env';

const ROLE_LABELS: Record<ShelterMemberClientRole, string> = {
  shelter_owner: 'Proprietário',
  shelter_member: 'Membro',
};

const ROLE_CLASS: Record<ShelterMemberClientRole, string> = {
  shelter_owner: 'bg-primary/10 text-primary',
  shelter_member: 'bg-border/60 text-muted',
};

const inputClass = 'w-full px-3.5 py-2.5 rounded-control border border-border bg-surface text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';

export default function MembrosPage({ params }: { params: Promise<{ shelterId: string }> }) {
  const { shelterId } = use(params);
  const [viewModel, setViewModel] = useState<WebShelterMemberListResultViewModel | null>(null);
  const [addUserId, setAddUserId] = useState('');
  const [actionMsg, setActionMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const makeUi = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    const shelterMemberClient = createShelterMemberClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken: async () => session?.access_token ?? null,
      fetch: globalThis.fetch,
    });
    return createWebShelterMemberUi({ shelterMemberClient });
  }, []);

  const load = useCallback(async () => {
    setViewModel(null);
    const ui = await makeUi();
    ui.loadShelterMembers(shelterId).then(setViewModel);
  }, [shelterId, makeUi]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = useCallback(async () => {
    if (!addUserId.trim()) return;
    const ui = await makeUi();
    const result = await ui.addShelterMember(shelterId, { userId: addUserId.trim(), role: 'shelter_member' });
    if (result.state === 'member_added') {
      setAddUserId('');
      setActionMsg({ text: 'Membro adicionado com sucesso.', ok: true });
      load();
    } else {
      setActionMsg({ text: result.message, ok: false });
    }
  }, [addUserId, shelterId, makeUi, load]);

  const handleRemove = useCallback(async (memberId: string) => {
    const ui = await makeUi();
    const result = await ui.removeShelterMember(shelterId, memberId);
    if (result.state === 'member_removed') {
      setActionMsg({ text: 'Membro removido.', ok: true });
      load();
    } else {
      setActionMsg({ text: result.message, ok: false });
    }
  }, [shelterId, makeUi, load]);

  if (viewModel === null) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl animate-pulse">👥</span>
          <p className="mt-4 text-muted text-sm" aria-live="polite">A carregar membros...</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl">🔒</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted">{viewModel.message}</p>
        </div>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <span className="text-4xl">⚠️</span>
          <h1 className="mt-4 text-xl font-bold text-ink">{viewModel.title}</h1>
          <p className="mt-2 text-sm text-muted">{viewModel.message}</p>
          <button onClick={load} className="mt-4 px-4 py-2 rounded-control bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors">
            Tentar de novo
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink mb-6">Membros da equipa</h1>

      {/* Add member form */}
      <div className="bg-surface rounded-card border border-border p-4 shadow-sm mb-6">
        <p className="text-sm font-semibold text-ink mb-3">Adicionar membro</p>
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="flex gap-2">
          <input
            value={addUserId}
            onChange={(e) => setAddUserId(e.target.value)}
            placeholder="ID do utilizador"
            autoComplete="off"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={!addUserId.trim()}
            className="shrink-0 px-4 py-2 rounded-control bg-teal text-white text-sm font-bold hover:bg-teal-hover transition-colors disabled:opacity-50"
          >
            Adicionar
          </button>
        </form>
        {actionMsg && (
          <p className={`mt-2 text-xs font-medium ${actionMsg.ok ? 'text-teal' : 'text-red-600'}`}>
            {actionMsg.text}
          </p>
        )}
      </div>

      {/* Member list */}
      <div className="flex flex-col gap-2">
        {viewModel.members.map((member) => (
          <div key={member.memberId} className="bg-surface rounded-card border border-border p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{member.userId}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-pill text-xs font-semibold ${ROLE_CLASS[member.role] ?? 'bg-border/60 text-muted'}`}>
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
                <span className="text-xs text-muted">desde {new Date(member.joinedAt).toLocaleDateString('pt-PT')}</span>
              </div>
            </div>
            {member.role !== 'shelter_owner' && (
              <button
                type="button"
                onClick={() => handleRemove(member.memberId)}
                className="shrink-0 px-3 py-1.5 rounded-control border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                Remover
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
