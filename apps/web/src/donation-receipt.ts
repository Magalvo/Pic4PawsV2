import type {
  DonationStatusClient,
  DonationStatusClientItem,
  DonationStatusClientFailureStatus,
  SubmitReceiptClient,
  SubmitReceiptClientFailureStatus,
  MediaUploadFlowClient,
} from '@pic4paws/client';

// ─── Content ──────────────────────────────────────────────────────────────────

export type WebDonationReceiptUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const webDonationReceiptUiContent: WebDonationReceiptUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Enviar comprovativo',
  description: 'Envia o comprovativo da tua transferência bancária.',
  states: [
    {
      state: 'idle',
      title: 'Enviar comprovativo',
      message: 'Carrega uma fotografia ou captura de ecrã da tua transferência bancária.',
    },
    {
      state: 'uploading',
      title: 'A carregar ficheiro...',
      message: 'O teu comprovativo está a ser carregado.',
    },
    {
      state: 'submitting',
      title: 'A submeter...',
      message: 'A associar o comprovativo ao donativo.',
    },
    {
      state: 'submitted',
      title: 'Comprovativo enviado',
      message: 'O teu comprovativo foi enviado. O abrigo irá confirmar o donativo em breve.',
    },
    {
      state: 'failed',
      title: 'Não foi possível enviar',
      message: 'Ocorreu um erro ao enviar o comprovativo. Tenta de novo.',
    },
    {
      state: 'wrong_state',
      title: 'Comprovativo não permitido',
      message: 'Este donativo não está a aguardar comprovativo.',
    },
    {
      state: 'forbidden',
      title: 'Acesso negado',
      message: 'Não tens permissão para enviar o comprovativo deste donativo.',
    },
  ],
};

// ─── State types ──────────────────────────────────────────────────────────────

export type WebDonationReceiptIdleState = {
  state: 'idle';
  title: string;
  donation: DonationStatusClientItem;
};

export type WebDonationReceiptUploadingState = {
  state: 'uploading';
  title: string;
};

export type WebDonationReceiptSubmittingState = {
  state: 'submitting';
  title: string;
};

export type WebDonationReceiptSubmittedState = {
  state: 'submitted';
  title: string;
  message: string;
  donationId: string;
};

export type WebDonationReceiptWrongStateState = {
  state: 'wrong_state';
  title: string;
  message: string;
  donationId: string;
};

export type WebDonationReceiptForbiddenState = {
  state: 'forbidden';
  title: string;
  message: string;
};

export type WebDonationReceiptFailureStatus =
  | DonationStatusClientFailureStatus
  | SubmitReceiptClientFailureStatus
  | 'media_upload_failed';

export type WebDonationReceiptFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: WebDonationReceiptFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type WebDonationReceiptState =
  | WebDonationReceiptIdleState
  | WebDonationReceiptUploadingState
  | WebDonationReceiptSubmittingState
  | WebDonationReceiptSubmittedState
  | WebDonationReceiptWrongStateState
  | WebDonationReceiptForbiddenState
  | WebDonationReceiptFailedState;

// ─── Factory ──────────────────────────────────────────────────────────────────

export const createWebDonationReceiptUi = ({
  donationStatusClient,
  mediaUploadClient,
  submitReceiptClient,
}: {
  donationStatusClient: Pick<DonationStatusClient, 'loadDonationStatus'>;
  mediaUploadClient: Pick<MediaUploadFlowClient, 'uploadMedia'>;
  submitReceiptClient: Pick<SubmitReceiptClient, 'submitReceipt'>;
}) => ({
  loadDonationStatus: async (
    donationId: string,
  ): Promise<
    | WebDonationReceiptIdleState
    | WebDonationReceiptWrongStateState
    | WebDonationReceiptForbiddenState
    | WebDonationReceiptFailedState
  > => {
    const result = await donationStatusClient.loadDonationStatus(donationId);

    if (!result.ok) {
      if (result.status === 'forbidden') {
        return {
          state: 'forbidden',
          title: 'Acesso negado',
          message: 'Não tens permissão para enviar o comprovativo deste donativo.',
        };
      }

      return {
        state: 'failed',
        title: 'Não foi possível carregar',
        message: 'Ocorreu um erro ao carregar o donativo. Tenta de novo.',
        status: result.status,
        reasons: result.reasons,
        canRetry: true,
      };
    }

    if (result.donation.donationStatus !== 'pending_receipt') {
      return {
        state: 'wrong_state',
        title: 'Comprovativo não permitido',
        message: 'Este donativo não está a aguardar comprovativo.',
        donationId,
      };
    }

    return {
      state: 'idle',
      title: 'Enviar comprovativo',
      donation: result.donation,
    };
  },

  uploadAndSubmit: async (
    donationId: string,
    file: File,
  ): Promise<
    | WebDonationReceiptSubmittedState
    | WebDonationReceiptWrongStateState
    | WebDonationReceiptForbiddenState
    | WebDonationReceiptFailedState
  > => {
    const uploadResult = await mediaUploadClient.uploadMedia({
      request: {
        mediaId: crypto.randomUUID(),
        purpose: 'identity_document',
        requestedVisibility: 'private',
        mimeType: file.type,
        byteSize: file.size,
        originalFilename: file.name,
        ownerUserId: null,
        shelterId: null,
      },
      body: file,
    });

    if (!uploadResult.ok) {
      return {
        state: 'failed',
        title: 'Não foi possível carregar o ficheiro',
        message: 'Ocorreu um erro ao carregar o comprovativo. Tenta de novo.',
        status: 'media_upload_failed',
        reasons: uploadResult.reasons,
        canRetry: true,
      };
    }

    const submitResult = await submitReceiptClient.submitReceipt(donationId, {
      receiptMediaId: uploadResult.mediaId,
    });

    if (!submitResult.ok) {
      if (submitResult.status === 'forbidden') {
        return {
          state: 'forbidden',
          title: 'Acesso negado',
          message: 'Não tens permissão para enviar o comprovativo deste donativo.',
        };
      }

      if (submitResult.status === 'donation_wrong_state') {
        return {
          state: 'wrong_state',
          title: 'Comprovativo não permitido',
          message: 'Este donativo não está a aguardar comprovativo.',
          donationId,
        };
      }

      return {
        state: 'failed',
        title: 'Não foi possível enviar',
        message: 'Ocorreu um erro ao associar o comprovativo. Tenta de novo.',
        status: submitResult.status,
        reasons: submitResult.reasons,
        canRetry: true,
      };
    }

    return {
      state: 'submitted',
      title: 'Comprovativo enviado',
      message: 'O teu comprovativo foi enviado. O abrigo irá confirmar o donativo em breve.',
      donationId,
    };
  },
});
