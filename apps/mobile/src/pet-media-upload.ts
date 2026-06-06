import type {
  MobileMediaUploadBoundary,
  MobilePetPublicImageUploadInput,
  MobileUploadFileInput,
} from './media-upload';

export type MobilePetMediaUploadUiState = 'ready' | 'choosing' | 'uploading' | 'uploaded' | 'failed';

export type MobilePetMediaUploadSupportedMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

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
      nextAction: string;
    }
  | {
      state: 'failed';
      title: string;
      message: string;
      petId: string;
      petName: string;
      reasons: string[];
      canRetry: true;
    };

export type CreateMobilePetMediaUploadUiInput = {
  uploadBoundary: Pick<MobileMediaUploadBoundary, 'uploadPetPublicImage'>;
  generateMediaId: () => string;
};

export type MobilePetMediaUploadUi = {
  getInitialState: (pet: MobilePetMediaUploadContext) => MobilePetMediaUploadReadyViewModel;
  uploadSelectedImage: (input: {
    pet: MobilePetMediaUploadContext;
    file: MobileUploadFileInput;
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
    'Fluxo mobile para escolher uma imagem pública do animal e enviá-la pelo boundary seguro antes de a associar ao rascunho.',
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
      title: 'Imagem adicionada ao rascunho',
      message: 'A imagem foi carregada e está pronta para ser associada ao perfil.',
    },
    {
      state: 'failed',
      title: 'Não foi possível adicionar a imagem',
      message: 'Confirma o ficheiro e tenta novamente.',
    },
  ],
};

const isSupportedImage = (file: MobileUploadFileInput): boolean =>
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
  reasons: ['unsupported_mime_type'],
  canRetry: true,
});

const buildUploadInput = (
  pet: MobilePetMediaUploadContext,
  file: MobileUploadFileInput,
  mediaId: string,
): MobilePetPublicImageUploadInput => ({
  mediaId,
  shelterId: pet.shelterId,
  ownerUserId: pet.ownerUserId ?? null,
  file,
});

export const createMobilePetMediaUploadUi = ({
  uploadBoundary,
  generateMediaId,
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

    const result = await uploadBoundary.uploadPetPublicImage(
      buildUploadInput(pet, file, generateMediaId()),
    );

    if (result.state === 'uploaded') {
      return {
        state: 'uploaded',
        title: 'Imagem adicionada ao rascunho',
        message: `A imagem de ${pet.petName} foi carregada e está pronta para ser associada ao perfil.`,
        petId: pet.petId,
        petName: pet.petName,
        media: {
          mediaId: result.mediaId,
          objectKey: result.objectKey,
        },
        nextAction: 'Associar imagem ao rascunho',
      };
    }

    return {
      state: 'failed',
      title: 'Não foi possível adicionar a imagem',
      message: result.message,
      petId: pet.petId,
      petName: pet.petName,
      reasons: sanitizeReasons(result.reasons),
      canRetry: true,
    };
  },
});
