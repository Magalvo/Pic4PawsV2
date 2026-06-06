import type {
  PetMediaUploadAttachFlowClient,
  PetMediaUploadAttachFlowFailure,
  PetMediaUploadAttachFlowFileInput,
} from '@pic4paws/client';

export type MobilePetMediaUploadUiState = 'ready' | 'choosing' | 'uploading' | 'uploaded' | 'failed';

export type MobilePetMediaUploadSupportedMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export type MobilePetMediaUploadUiFailurePhase =
  | 'validation'
  | PetMediaUploadAttachFlowFailure['phase'];

export type MobilePetMediaUploadUiStateCopy = {
  state: MobilePetMediaUploadUiState;
  title: string;
  message: string;
};

export type MobilePetMediaUploadUiContent = {
  locale: 'pt-PT';
  title: string;
  description: string;
  status: 'product-flow-ready';
  acceptedMimeTypes: MobilePetMediaUploadSupportedMimeType[];
  states: MobilePetMediaUploadUiStateCopy[];
};

export type MobilePetMediaUploadContext = {
  petId: string;
  petName: string;
  shelterId: string;
  ownerUserId?: string | null;
};

export type MobilePetMediaUploadReadyViewModel = {
  state: 'ready';
  title: string;
  message: string;
  primaryAction: string;
  petId: string;
  petName: string;
  acceptedMimeTypes: MobilePetMediaUploadSupportedMimeType[];
};

export type MobilePetMediaUploadResultViewModel =
  | {
      state: 'uploaded';
      title: string;
      message: string;
      petId: string;
      petName: string;
      media: {
        mediaId: string;
        objectKey: string;
      };
      draftMedia: {
        mediaIds: string[];
        heroMediaId: string | null;
      };
    }
  | {
      state: 'failed';
      title: string;
      message: string;
      petId: string;
      petName: string;
      phase: MobilePetMediaUploadUiFailurePhase;
      reasons: string[];
      canRetry: true;
    };

export type CreateMobilePetMediaUploadUiInput = {
  uploadAttachFlow: Pick<PetMediaUploadAttachFlowClient, 'uploadAndAttachPetMedia'>;
};

export type MobilePetMediaUploadUi = {
  getInitialState: (pet: MobilePetMediaUploadContext) => MobilePetMediaUploadReadyViewModel;
  uploadSelectedImage: (input: {
    pet: MobilePetMediaUploadContext;
    file: PetMediaUploadAttachFlowFileInput;
  }) => Promise<MobilePetMediaUploadResultViewModel>;
};

const acceptedMimeTypes: MobilePetMediaUploadSupportedMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const unsafeReasonMarkers = [
  'signedurl',
  'temporary=',
  'service-role',
  'service_role',
  'r2-secret',
  'r2_marker',
  'r2-marker',
  'server-only-marker',
  'user-token-marker',
  'user-access-token',
  'bearer ',
];

export const mobilePetMediaUploadUiContent: MobilePetMediaUploadUiContent = {
  locale: 'pt-PT',
  title: 'Imagem do animal',
  description:
    'Fluxo mobile para escolher uma imagem pública do animal, enviá-la pelo boundary seguro e associá-la ao rascunho.',
  status: 'product-flow-ready',
  acceptedMimeTypes,
  states: [
    {
      state: 'ready',
      title: 'Adicionar imagem do animal',
      message: 'Escolhe uma imagem JPEG, PNG ou WebP para preparar o perfil antes da publicação.',
    },
    {
      state: 'choosing',
      title: 'Escolher imagem',
      message: 'Seleciona uma imagem do animal no dispositivo.',
    },
    {
      state: 'uploading',
      title: 'A enviar imagem',
      message: 'Estamos a enviar a imagem pelo fluxo seguro.',
    },
    {
      state: 'uploaded',
      title: 'Imagem carregada e associada',
      message: 'A imagem foi carregada e associada ao rascunho.',
    },
    {
      state: 'failed',
      title: 'Não foi possível adicionar a imagem',
      message: 'Confirma o ficheiro e tenta novamente.',
    },
  ],
};

const isSupportedImage = (file: PetMediaUploadAttachFlowFileInput): boolean =>
  acceptedMimeTypes.includes(file.type as MobilePetMediaUploadSupportedMimeType);

const isSafeReason = (reason: string): boolean => {
  const normalizedReason = reason.toLowerCase();

  return !unsafeReasonMarkers.some((marker) => normalizedReason.includes(marker));
};

const sanitizeReasons = (reasons: string[]): string[] => {
  const safeReasons = reasons.filter(isSafeReason);

  return safeReasons.length > 0 ? safeReasons : ['upload_failed'];
};

const createUnsupportedFileResult = (
  pet: MobilePetMediaUploadContext,
): MobilePetMediaUploadResultViewModel => ({
  state: 'failed',
  title: 'Formato não suportado',
  message: 'Usa JPEG, PNG ou WebP para imagens públicas de animais.',
  petId: pet.petId,
  petName: pet.petName,
  phase: 'validation',
  reasons: ['unsupported_mime_type'],
  canRetry: true,
});

const failureCopyByPhase: Record<
  PetMediaUploadAttachFlowFailure['phase'],
  { title: string; message: string }
> = {
  upload_intent: {
    title: 'Não foi possível preparar o carregamento',
    message: 'Confirma as permissões e tenta novamente.',
  },
  binary_upload: {
    title: 'Não foi possível adicionar a imagem',
    message: 'O pedido foi preparado, mas o envio do ficheiro falhou.',
  },
  attach: {
    title: 'Não foi possível associar a imagem',
    message: 'A imagem foi enviada, mas não ficou associada ao rascunho.',
  },
};

export const createMobilePetMediaUploadUi = ({
  uploadAttachFlow,
}: CreateMobilePetMediaUploadUiInput): MobilePetMediaUploadUi => ({
  getInitialState: (pet) => ({
    state: 'ready',
    title: `Adicionar imagem de ${pet.petName}`,
    message: 'Escolhe uma imagem JPEG, PNG ou WebP para preparar o perfil antes da publicação.',
    primaryAction: 'Escolher imagem',
    petId: pet.petId,
    petName: pet.petName,
    acceptedMimeTypes,
  }),
  uploadSelectedImage: async ({ pet, file }) => {
    if (!isSupportedImage(file)) {
      return createUnsupportedFileResult(pet);
    }

    const result = await uploadAttachFlow.uploadAndAttachPetMedia({
      petId: pet.petId,
      shelterId: pet.shelterId,
      ownerUserId: pet.ownerUserId ?? null,
      file,
    });

    if (result.ok) {
      return {
        state: 'uploaded',
        title: 'Imagem carregada e associada',
        message: `A imagem de ${pet.petName} foi carregada e associada ao rascunho.`,
        petId: pet.petId,
        petName: pet.petName,
        media: {
          mediaId: result.mediaId,
          objectKey: result.objectKey,
        },
        draftMedia: {
          mediaIds: result.mediaIds,
          heroMediaId: result.heroMediaId,
        },
      };
    }

    const copy = failureCopyByPhase[result.phase];

    return {
      state: 'failed',
      title: copy.title,
      message: copy.message,
      petId: pet.petId,
      petName: pet.petName,
      phase: result.phase,
      reasons: sanitizeReasons(result.reasons),
      canRetry: true,
    };
  },
});
