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

export default function MembrosPage({ params }: { params: Promise<{ shelterId: string }> }) {
  const { shelterId } = use(params);
  const [viewModel, setViewModel] = useState<WebShelterMemberListResultViewModel | null>(null);
  const [addUserId, setAddUserId] = useState('');
  const [actionMsg, setActionMsg] = useState('');

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
      setActionMsg('Membro adicionado com sucesso.');
      load();
    } else {
      setActionMsg(result.message);
    }
  }, [addUserId, shelterId, makeUi, load]);

  const handleRemove = useCallback(async (memberId: string) => {
    const ui = await makeUi();
    const result = await ui.removeShelterMember(shelterId, memberId);
    if (result.state === 'member_removed') {
      setActionMsg('Membro removido.');
      load();
    } else {
      setActionMsg(result.message);
    }
  }, [shelterId, makeUi, load]);

  if (viewModel === null) return <p>A carregar membros...</p>;

  if (viewModel.state === 'forbidden') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
      </main>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <button type="button" onClick={load}>Tentar de novo</button>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      {actionMsg ? <p>{actionMsg}</p> : null}
      <form
        onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
        style={{ display: 'flex', gap: 8, marginBottom: 16 }}
      >
        <input
          value={addUserId}
          onChange={(e) => setAddUserId(e.target.value)}
          placeholder="ID do utilizador"
          autoComplete="off"
        />
        <button type="submit">Adicionar</button>
      </form>
      <ul>
        {viewModel.members.map((member) => (
          <li key={member.memberId}>
            {member.userId} — {ROLE_LABELS[member.role] ?? member.role}
            {' '}({new Date(member.joinedAt).toLocaleDateString('pt-PT')})
            {member.role !== 'shelter_owner' && (
              <button type="button" onClick={() => handleRemove(member.memberId)}>
                Remover
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
