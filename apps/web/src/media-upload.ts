import {
  createMediaUploadFlowClient,
  type CreateMediaUploadFlowClientInput,
} from '@pic4paws/client';

export type WebMediaUploadState =
  | 'idle'
  | 'uploading'
  | 'uploaded'
  | 'intent_failed'
  | 'binary_upload_failed';

export type WebMediaUploadStateCopy = {
  state: WebMediaUploadState;
  title: string;
  message: string;
};

export type WebMediaUploadContent = {
  locale: 'pt-PT';
  title: string;
  description: string;
  status: 'contract-ready';
  states: WebMediaUploadStateCopy[];
};

export type WebUploadFileInput = {
  name: string;
  type: string;
  size: number;
  body: BodyInit;
};

export type WebPetPublicImageUploadInput = {
  mediaId: string;
  shelterId: string;
  ownerUserId?: string | null;
  file: WebUploadFileInput;
};

export type WebMediaUploadResult =
  | {
      state: 'uploaded';
      title: string;
      message: string;
      mediaId: string;
      objectKey: string;
    }
  | {
      state: 'intent_failed' | 'binary_upload_failed';
      title: string;
      message: string;
      reasons: string[];
      mediaId?: string;
      objectKey?: string;
    };

export type WebMediaUploadBoundary = {
  uploadPetPublicImage: (
    input: WebPetPublicImageUploadInput,
  ) => Promise<WebMediaUploadResult>;
};

export const webMediaUploadContent: WebMediaUploadContent = {
  locale: 'pt-PT',
  title: 'Upload seguro de imagens',
  description:
    'Fluxo Web preparado para pedir URLs assinados ao Worker e enviar ficheiros sem expor credenciais no browser.',
  status: 'contract-ready',
  states: [
    {
      state: 'idle',
      title: 'Pronto para escolher imagem',
      message: 'O upload ainda não começou.',
    },
    {
      state: 'uploading',
      title: 'A enviar imagem',
      message: 'Estamos a preparar o pedido e a enviar o ficheiro em segurança.',
    },
    {
      state: 'uploaded',
      title: 'Imagem carregada',
      message: 'A imagem do animal ficou pronta para validação.',
    },
    {
      state: 'intent_failed',
      title: 'Não foi possível preparar o carregamento',
      message: 'Confirma as permissões e tenta novamente.',
    },
    {
      state: 'binary_upload_failed',
      title: 'Falha ao enviar a imagem',
      message: 'O pedido foi preparado, mas o envio do ficheiro falhou.',
    },
  ],
};

const getStateCopy = (state: WebMediaUploadState): WebMediaUploadStateCopy => {
  const copy = webMediaUploadContent.states.find((item) => item.state === state);

  if (!copy) {
    throw new Error(`Missing Web media upload copy for state: ${state}`);
  }

  return copy;
};

export const createWebMediaUploadBoundary = (
  input: CreateMediaUploadFlowClientInput,
): WebMediaUploadBoundary => {
  const flowClient = createMediaUploadFlowClient(input);

  return {
    uploadPetPublicImage: async ({ mediaId, shelterId, ownerUserId = null, file }) => {
      const result = await flowClient.uploadMedia({
        request: {
          mediaId,
          purpose: 'pet_public_image',
          requestedVisibility: 'public',
          mimeType: file.type,
          byteSize: file.size,
          ownerUserId,
          shelterId,
          originalFilename: file.name,
        },
        body: file.body,
      });

      if (result.ok) {
        const copy = getStateCopy('uploaded');

        return {
          state: 'uploaded',
          title: copy.title,
          message: copy.message,
          mediaId: result.mediaId,
          objectKey: result.objectKey,
        };
      }

      if (result.phase === 'intent') {
        const copy = getStateCopy('intent_failed');

        return {
          state: 'intent_failed',
          title: copy.title,
          message: copy.message,
          reasons: result.reasons,
        };
      }

      const copy = getStateCopy('binary_upload_failed');

      return {
        state: 'binary_upload_failed',
        title: copy.title,
        message: copy.message,
        reasons: result.reasons,
        mediaId: result.mediaId,
        objectKey: result.objectKey,
      };
    },
  };
};
