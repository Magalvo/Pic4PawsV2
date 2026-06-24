import type {
  DonationStatusClient,
  DonationStatusClientItem,
  DonationStatusClientFailureStatus,
  SubmitReceiptClient,
  SubmitReceiptClientFailureStatus,
  MediaUploadFlowClient,
} from '@pic4paws/client';

// ─── Content ──────────────────────────────────────────────────────────────────

export type MobileDonationReceiptUiContent = {
  locale: 'pt-PT';
  status: 'product-flow-ready';
  title: string;
  description: string;
  states: Array<{ state: string; title: string; message: string }>;
};

export const mobileDonationReceiptUiContent: MobileDonationReceiptUiContent = {
  locale: 'pt-PT',
  status: 'product-flow-ready',
  title: 'Enviar comprovativo',
  description: 'Envia o comprovativo da tua transferência bancária.',
  states: [
    {
      state: 'loading',
      title: 'A carregar...',
      message: 'A obter os detalhes do donativo.',
    },
    {
      state: 'idle',
      title: 'Enviar comprovativo',
      message: 'Seleciona ou fotografa o comprovativo da tua transferência.',
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

// ─── File input type ──────────────────────────────────────────────────────────

export type MobileDonationReceiptFileInput = {
  uri: string;
  type: string;
  name: string;
  size: number;
};

// ─── State types ──────────────────────────────────────────────────────────────

export type MobileDonationReceiptIdleState = {
  state: 'idle';
  title: string;
  donation: DonationStatusClientItem;
};

export type MobileDonationReceiptUploadingState = {
  state: 'uploading';
  title: string;
};

export type MobileDonationReceiptSubmittingState = {
  state: 'submitting';
  title: string;
};

export type MobileDonationReceiptSubmittedState = {
  state: 'submitted';
  title: string;
  message: string;
  donationId: string;
};

export type MobileDonationReceiptWrongStateState = {
  state: 'wrong_state';
  title: string;
  message: string;
  donationId: string;
};

export type MobileDonationReceiptForbiddenState = {
  state: 'forbidden';
  title: string;
  message: string;
};

export type MobileDonationReceiptFailureStatus =
  | DonationStatusClientFailureStatus
  | SubmitReceiptClientFailureStatus
  | 'media_upload_failed';

export type MobileDonationReceiptFailedState = {
  state: 'failed';
  title: string;
  message: string;
  status: MobileDonationReceiptFailureStatus;
  reasons: string[];
  canRetry: true;
};

export type MobileDonationReceiptViewModel =
  | MobileDonationReceiptIdleState
  | MobileDonationReceiptUploadingState
  | MobileDonationReceiptSubmittingState
  | MobileDonationReceiptSubmittedState
  | MobileDonationReceiptWrongStateState
  | MobileDonationReceiptForbiddenState
  | MobileDonationReceiptFailedState;

// ─── Factory ──────────────────────────────────────────────────────────────────

export const createMobileDonationReceiptUi = ({
  donationStatusClient,
  mediaUploadClient,
  submitReceiptClient,
}: {
  donationStatusClient: Pick<DonationStatusClient, 'loadDonationStatus'>;
  mediaUploadClient: Pick<MediaUploadFlowClient, 'uploadMedia'>;
  submitReceiptClient: Pick<SubmitReceiptClient, 'submitReceipt'>;
}) => ({
  loadDonation: async (
    donationId: string,
  ): Promise<
    | MobileDonationReceiptIdleState
    | MobileDonationReceiptWrongStateState
    | MobileDonationReceiptForbiddenState
    | MobileDonationReceiptFailedState
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
    file: MobileDonationReceiptFileInput,
  ): Promise<
    | MobileDonationReceiptSubmittedState
    | MobileDonationReceiptWrongStateState
    | MobileDonationReceiptForbiddenState
    | MobileDonationReceiptFailedState
  > => {
    const formData = new FormData();
    formData.append('file', { uri: file.uri, type: file.type, name: file.name } as unknown as Blob);

    const uploadResult = await mediaUploadClient.uploadMedia({
      request: {
        mediaId: crypto.randomUUID(),
        purpose: 'donation_receipt',
        requestedVisibility: 'private',
        mimeType: file.type,
        byteSize: file.size,
        originalFilename: file.name,
        ownerUserId: null,
        shelterId: null,
      },
      body: formData,
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

    if (!uploadResult.mediaId?.trim()) {
      return {
        state: 'failed',
        title: 'Não foi possível carregar o ficheiro',
        message: 'O comprovativo foi carregado mas não foi identificado. Tenta de novo.',
        status: 'media_upload_failed',
        reasons: ['empty_media_id'],
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
