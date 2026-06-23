'use client';

import { use, useRef, useState, useEffect } from 'react';
import {
  createDonationStatusClient,
  createSubmitReceiptClient,
  createMediaUploadFlowClient,
} from '@pic4paws/client';
import {
  createWebDonationReceiptUi,
  type WebDonationReceiptState,
} from '../../../../src/donation-receipt';
import { createSupabaseBrowserClient } from '../../../../src/supabase-browser';
import { workerUrl } from '../../../../src/env';

type Props = { params: Promise<{ donationId: string }> };

export default function ComprovativoPage({ params }: Props) {
  const { donationId } = use(params);
  const [viewModel, setViewModel] = useState<WebDonationReceiptState | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uiRef = useRef<ReturnType<typeof createWebDonationReceiptUi> | null>(null);

  useEffect(() => {
    setViewModel(null);
    const supabase = createSupabaseBrowserClient();
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const donationStatusClient = createDonationStatusClient({
      workerBaseUrl: workerUrl(),
      donationsPath: '/donations',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const mediaUploadClient = createMediaUploadFlowClient({
      workerBaseUrl: workerUrl(),
      mediaUploadPath: '/media',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const submitReceiptClient = createSubmitReceiptClient({
      workerBaseUrl: workerUrl(),
      donationsPath: '/donations',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createWebDonationReceiptUi({ donationStatusClient, mediaUploadClient, submitReceiptClient });
    uiRef.current = ui;
    ui.loadDonationStatus(donationId).then(setViewModel);
  }, [donationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uiRef.current) return;
    setViewModel({ state: 'uploading', title: 'A carregar ficheiro...' });
    const result = await uiRef.current.uploadAndSubmit(donationId, selectedFile);
    setViewModel(result);
  };

  if (viewModel === null) {
    return (
      <main>
        <p aria-live="polite">A carregar donativo...</p>
      </main>
    );
  }

  if (viewModel.state === 'uploading' || viewModel.state === 'submitting') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p aria-live="polite">A processar...</p>
      </main>
    );
  }

  if (viewModel.state === 'submitted') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href={`/doacoes/${viewModel.donationId}`}>Ver estado do donativo</a>
      </main>
    );
  }

  if (viewModel.state === 'wrong_state') {
    return (
      <main>
        <h1>{viewModel.title}</h1>
        <p>{viewModel.message}</p>
        <a href={`/doacoes/${viewModel.donationId}`}>Ver estado do donativo</a>
      </main>
    );
  }

  if (viewModel.state === 'forbidden') {
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
        <p>{viewModel.message}</p>
        {viewModel.status === 'unauthenticated' && (
          <a href="/entrar">Entrar na conta</a>
        )}
        <a href={`/doacoes/${donationId}`}>Ver estado do donativo</a>
      </main>
    );
  }

  return (
    <main>
      <h1>{viewModel.title}</h1>
      <p>
        Donativo de{' '}
        <strong>
          {(viewModel.donation.amountCents / 100).toFixed(2)} {viewModel.donation.currency}
        </strong>{' '}
        por transferência bancária.
      </p>
      <p>Carrega uma fotografia ou captura de ecrã do comprovativo da tua transferência.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="receipt-file">
          Comprovativo
          <input
            id="receipt-file"
            type="file"
            accept="image/*"
            required
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button type="submit" disabled={!selectedFile}>
          Enviar comprovativo
        </button>
      </form>
      <a href={`/doacoes/${donationId}`}>Voltar ao donativo</a>
    </main>
  );
}
