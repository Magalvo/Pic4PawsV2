import { appConfig, parseEnvironmentConfig, type EnvironmentRecord } from '@pic4paws/config';
import type { WorkerRequestDependencies } from './dependencies';
import { createR2UploadSignerWorkerDependencies } from './r2-signer';
import { createSupabaseSdkWorkerDependencies } from './supabase-sdk';
import { createIfthenpayWebhookVerifier } from './ifthenpay-verifier';
import { handle as handleWebhooks } from './routes/webhooks';
import { handle as handleMedia } from './routes/media';
import { handle as handlePets } from './routes/pets';
import { handle as handleShelters } from './routes/shelters';
import { handle as handleAdoptions } from './routes/adoptions';
import { handle as handleDonations } from './routes/donations';
import { handle as handleSponsorships } from './routes/sponsorships';
import { handle as handleNotifications } from './routes/notifications';
import { jsonResponse } from './routes/shared';
export {
  createSupabaseAuthAdapter,
  SupabaseAuthAdapterError,
} from './auth-supabase';
export type {
  SupabaseAuthClientLike,
  SupabaseAuthGetUserResult,
  SupabaseAuthQueryResult,
  SupabaseAuthTableQueryLike,
  SupabaseAuthUserLike,
} from './auth-supabase';
export {
  createWorkerSupabaseDependencies,
  resolveWorkerRequestDependencies,
  WorkerSupabaseWiringError,
} from './dependencies';
export type {
  CreateWorkerSupabaseDependenciesInput,
  ResolveWorkerRequestDependenciesInput,
  WorkerRequestDependencies,
  WorkerSupabaseClientFactory,
  WorkerSupabaseClientFactoryInput,
  WorkerSupabaseClientLike,
  WorkerSupabaseTableQueryLike,
} from './dependencies';
export {
  createSupabasePetRepositories,
  SupabasePetRepositoryError,
} from './pet-supabase';
export type {
  SupabaseClientLike,
  SupabaseQueryResult,
  SupabaseTableQueryLike,
} from './pet-supabase';
export {
  createSupabaseSdkClientFactory,
  createSupabaseSdkWorkerDependencies,
  SupabaseSdkClientFactoryError,
} from './supabase-sdk';
export type {
  CreateSupabaseSdkClientFactoryInput,
  SupabaseSdkClientOptions,
  SupabaseSdkCreateClient,
} from './supabase-sdk';

export {
  canPersistMediaUploadIntentForActor,
  createWorkerMediaUploadIntent,
  persistWorkerMediaUploadIntent,
} from './media-upload';
export type {
  MediaAssetRepository,
  MediaUploadSigner,
  MediaUploadSignerInput,
  PersistWorkerMediaUploadIntentInput,
  PersistWorkerMediaUploadIntentResult,
} from './media-upload';
export { handleWorkerPetDraftRequest, matchWorkerPetDraftRoute } from './pet-drafts';
export type {
  PetDraftRepository,
  PetDraftLoadRecord,
  PetMediaAttachRepository,
  PetPublishRepository,
  WorkerPetDraftAuthenticator,
} from './pet-drafts';
export { handleWorkerPetDraftLoadRequest } from './pet-draft-load';
export type { HandleWorkerPetDraftLoadRequestInput } from './pet-draft-load';
export { handleWorkerPetFeedRequest } from './pet-feed';
export type {
  PetFeedQuery,
  PetFeedRepository,
  PetFeedResult,
  PublishedPetSummary,
} from './pet-feed';
export { handleWorkerPetProfileRequest, matchWorkerPetProfileId } from './pet-profile';
export type {
  PetProfileQuery,
  PetProfileRepository,
  PublishedPetProfile,
} from './pet-profile';
export {
  handleWorkerShelterProfileRequest,
  matchWorkerShelterProfileId,
} from './shelter-profile';
export type {
  PublicShelterProfile,
  ShelterKind,
  ShelterProfileQuery,
  ShelterProfileRepository,
  ShelterVerificationStatus,
} from './shelter-profile';
export {
  createSupabaseShelterRepositories,
  SupabaseShelterRepositoryError,
} from './shelter-supabase';
export type {
  CreateSupabaseShelterRepositoriesInput,
  CreateSupabaseShelterRepositoriesResult,
} from './shelter-supabase';
export { handleWorkerShelterSearchRequest } from './shelter-search';
export type {
  PublicShelterSummary,
  ShelterSearchQuery,
  ShelterSearchRepository,
  ShelterSearchResult,
} from './shelter-search';
export {
  createSupabaseShelterSearchRepositories,
  SupabaseShelterSearchRepositoryError,
} from './shelter-search-supabase';
export type {
  CreateSupabaseShelterSearchRepositoriesInput,
  CreateSupabaseShelterSearchRepositoriesResult,
} from './shelter-search-supabase';
export { handleWorkerAdoptionRequest, validateAdoptionPayload } from './adoption';
export type {
  AdoptionApplicationPetContext,
  AdoptionApplicationRepository,
  CreateAdoptionApplicationInput,
  CreateAdoptionApplicationResult,
  HousingType,
} from './adoption';
export {
  createSupabaseAdoptionRepositories,
  SupabaseAdoptionRepositoryError,
} from './adoption-supabase';
export type {
  CreateSupabaseAdoptionRepositoriesInput,
  CreateSupabaseAdoptionRepositoriesResult,
} from './adoption-supabase';
export {
  handleWorkerAdoptionListRequest,
  matchWorkerAdoptionListShelterId,
} from './adoption-list';
export type {
  AdoptionApplicationStatus,
  AdoptionListRepository,
  AdoptionListSummary,
  HandleWorkerAdoptionListRequestInput,
  ListAdoptionApplicationsQuery,
  ListAdoptionApplicationsResult,
} from './adoption-list';
export {
  createSupabaseAdoptionListRepositories,
  SupabaseAdoptionListRepositoryError,
} from './adoption-list-supabase';
export type {
  CreateSupabaseAdoptionListRepositoriesInput,
  CreateSupabaseAdoptionListRepositoriesResult,
} from './adoption-list-supabase';
export {
  handleWorkerAdoptionStatusRequest,
  matchWorkerAdoptionStatusId,
  validateAdoptionStatusPayload,
} from './adoption-status';
export type {
  AdoptionStatusRecord,
  AdoptionStatusRepository,
  HandleWorkerAdoptionStatusRequestInput,
  UpdateAdoptionStatusInput,
} from './adoption-status';
export {
  createSupabaseAdoptionStatusRepositories,
  SupabaseAdoptionStatusRepositoryError,
} from './adoption-status-supabase';
export type {
  CreateSupabaseAdoptionStatusRepositoriesInput,
  CreateSupabaseAdoptionStatusRepositoriesResult,
} from './adoption-status-supabase';
export { handleWorkerAdoptionViewRequest } from './adoption-view';
export type {
  AdoptionViewRecord,
  AdoptionViewRepository,
  HandleWorkerAdoptionViewRequestInput,
} from './adoption-view';
export {
  createSupabaseAdoptionViewRepositories,
  SupabaseAdoptionViewRepositoryError,
} from './adoption-view-supabase';
export type {
  CreateSupabaseAdoptionViewRepositoriesInput,
  CreateSupabaseAdoptionViewRepositoriesResult,
} from './adoption-view-supabase';
export {
  handleWorkerShelterMemberRequest,
  handleWorkerShelterMemberRemoveRequest,
  matchWorkerShelterMemberShelterId,
  matchWorkerShelterMemberRemoveIds,
  validateAddShelterMemberPayload,
} from './shelter-member';
export type {
  AddShelterMemberInput,
  AddShelterMemberResult,
  HandleWorkerShelterMemberRemoveRequestInput,
  HandleWorkerShelterMemberRequestInput,
  ListShelterMembersQuery,
  ListShelterMembersResult,
  RemoveShelterMemberInput,
  ShelterMemberRepository,
  ShelterMemberRole,
  ShelterMemberSummary,
} from './shelter-member';
export {
  createSupabaseShelterMemberRepositories,
  SupabaseShelterMemberRepositoryError,
} from './shelter-member-supabase';
export type {
  CreateSupabaseShelterMemberRepositoriesInput,
  CreateSupabaseShelterMemberRepositoriesResult,
} from './shelter-member-supabase';
export {
  handleWorkerPetArchiveRequest,
  handleWorkerPetStatusHistoryRequest,
  matchWorkerPetArchiveId,
  matchWorkerPetStatusHistoryId,
  validatePetArchivePayload,
} from './pet-archive';
export type {
  HandleWorkerPetArchiveRequestInput,
  HandleWorkerPetStatusHistoryRequestInput,
  PetArchiveRecord,
  PetArchiveRepository,
  PetLifecycleEvent,
  PetLifecycleEventInput,
} from './pet-archive';
export {
  createSupabasePetArchiveRepositories,
  SupabasePetArchiveRepositoryError,
} from './pet-archive-supabase';
export type {
  CreateSupabasePetArchiveRepositoriesInput,
  CreateSupabasePetArchiveRepositoriesResult,
} from './pet-archive-supabase';
export {
  handleWorkerNotificationListRequest,
  handleWorkerNotificationReadRequest,
  matchWorkerNotificationsPath,
  matchWorkerNotificationReadId,
} from './notification';
export type {
  HandleWorkerNotificationListRequestInput,
  HandleWorkerNotificationReadRequestInput,
  ListNotificationsQuery,
  ListNotificationsResult,
  NotificationRecord,
  NotificationRepository,
  NotificationType,
} from './notification';
export {
  createSupabaseNotificationRepositories,
  SupabaseNotificationRepositoryError,
} from './notification-supabase';
export type {
  CreateSupabaseNotificationRepositoriesInput,
  CreateSupabaseNotificationRepositoriesResult,
} from './notification-supabase';
export {
  handleWorkerNotificationPreferencesRequest,
  matchWorkerNotificationPreferencesPath,
} from './notification-preferences';
export type {
  NotificationPreference,
  GetNotificationPreferencesResult,
  NotificationPreferencesRepository,
  HandleWorkerNotificationPreferencesRequestInput,
} from './notification-preferences';
export { createSupabaseNotificationPreferencesRepositories } from './notification-preferences-supabase';
export {
  handleWorkerFinancialsRequest,
  matchWorkerFinancialsShelterId,
} from './financials';
export type {
  FinancialsDonationBreakdown,
  FinancialsRepository,
  FinancialsSummary,
  GetFinancialsResult,
  HandleWorkerFinancialsRequestInput,
} from './financials';
export {
  createSupabaseFinancialsRepositories,
  SupabaseFinancialsRepositoryError,
} from './financials-supabase';
export type {
  CreateSupabaseFinancialsRepositoriesInput,
  CreateSupabaseFinancialsRepositoriesResult,
} from './financials-supabase';
export {
  handleWorkerShelterPetListRequest,
  matchWorkerShelterPetsShelterId,
} from './shelter-pet-list';
export type {
  HandleWorkerShelterPetListRequestInput,
  ListShelterPetsQuery,
  ListShelterPetsResult,
  ShelterPetListRepository,
  ShelterPetStatus,
  ShelterPetSummary,
} from './shelter-pet-list';
export {
  createSupabaseShelterPetListRepositories,
  SupabaseShelterPetListRepositoryError,
} from './shelter-pet-list-supabase';
export type {
  CreateSupabaseShelterPetListRepositoriesInput,
  CreateSupabaseShelterPetListRepositoriesResult,
} from './shelter-pet-list-supabase';
export {
  handleWorkerShelterRegistrationRequest,
  validateShelterRegistrationPayload,
  KNOWN_SHELTER_KINDS,
} from './shelter-register';
export type {
  ShelterRegistrationInput,
  ShelterRegistrationRepository,
  HandleWorkerShelterRegistrationRequestInput,
} from './shelter-register';
export {
  createSupabaseShelterRegistrationRepositories,
  SupabaseShelterRegistrationRepositoryError,
} from './shelter-register-supabase';
export type {
  CreateSupabaseShelterRegistrationRepositoriesInput,
  CreateSupabaseShelterRegistrationRepositoriesResult,
} from './shelter-register-supabase';
export {
  handleWorkerShelterUpdateRequest,
  validateShelterUpdatePayload,
} from './shelter-update';
export type {
  ShelterUpdateInput,
  ShelterUpdateRepository,
  HandleWorkerShelterUpdateRequestInput,
} from './shelter-update';
export {
  createSupabaseShelterUpdateRepositories,
  SupabaseShelterUpdateRepositoryError,
} from './shelter-update-supabase';
export type {
  CreateSupabaseShelterUpdateRepositoriesInput,
  CreateSupabaseShelterUpdateRepositoriesResult,
} from './shelter-update-supabase';
export { handleWorkerShelterDeleteRequest } from './shelter-delete';
export type {
  ShelterDeletionRepository,
  HandleWorkerShelterDeleteRequestInput,
} from './shelter-delete';
export {
  createSupabaseShelterDeletionRepositories,
  SupabaseShelterDeletionRepositoryError,
} from './shelter-delete-supabase';
export type {
  CreateSupabaseShelterDeletionRepositoriesInput,
  CreateSupabaseShelterDeletionRepositoriesResult,
} from './shelter-delete-supabase';
export {
  createR2UploadSigner,
  createR2UploadSignerWorkerDependencies,
  R2UploadSignerFactoryError,
} from './r2-signer';
export { handleWorkerDonationRequest, validateDonationPayload } from './donation';
export type {
  CreateDonationInput,
  CreateDonationResult,
  DonationKind,
  DonationPaymentMethod,
  DonationProvider,
  DonationRepository,
  HandleWorkerDonationRequestInput,
} from './donation';
export {
  createSupabaseDonationRepositories,
  SupabaseDonationRepositoryError,
} from './donation-supabase';
export type {
  CreateSupabaseDonationRepositoriesInput,
  CreateSupabaseDonationRepositoriesResult,
} from './donation-supabase';
export {
  handleWorkerDonationListRequest,
  matchWorkerDonationListShelterId,
} from './donation-list';
export type {
  DonationListRepository,
  DonationListSummary,
  DonationStatus,
  HandleWorkerDonationListRequestInput,
  ListDonationsQuery,
  ListDonationsResult,
} from './donation-list';
export {
  createSupabaseDonationListRepositories,
  SupabaseDonationListRepositoryError,
} from './donation-list-supabase';
export type {
  CreateSupabaseDonationListRepositoriesInput,
  CreateSupabaseDonationListRepositoriesResult,
} from './donation-list-supabase';
export {
  handleWorkerPaymentWebhookRequest,
  PROVIDER_SIGNATURE_HEADERS,
} from './payment-webhook';
export type {
  DonationWebhookStatus,
  HandleWorkerPaymentWebhookRequestInput,
  ParsedWebhookEvent,
  PaymentWebhookRepository,
  PaymentWebhookVerifier,
  PaymentWebhookProcessingResult,
  ProcessVerifiedWebhookEventInput,
  RecordWebhookEventInput,
  UpdateDonationStatusInput,
} from './payment-webhook';
export {
  createSupabasePaymentWebhookRepositories,
  SupabasePaymentWebhookRepositoryError,
} from './payment-webhook-supabase';
export type {
  CreateSupabasePaymentWebhookRepositoriesInput,
  CreateSupabasePaymentWebhookRepositoriesResult,
} from './payment-webhook-supabase';
export {
  handleWorkerDonationStatusRequest,
  matchWorkerDonationStatusId,
} from './donation-status';
export type {
  DonationStatusRecord,
  DonationStatusRepository,
  HandleWorkerDonationStatusRequestInput,
} from './donation-status';
export {
  createSupabaseDonationStatusRepositories,
  SupabaseDonationStatusRepositoryError,
} from './donation-status-supabase';
export type {
  CreateSupabaseDonationStatusRepositoriesInput,
  CreateSupabaseDonationStatusRepositoriesResult,
} from './donation-status-supabase';
export { handleWorkerSponsorshipRequest, validateSponsorshipPayload } from './sponsorship';
export type {
  CreateSponsorshipInput,
  CreateSponsorshipResult,
  HandleWorkerSponsorshipRequestInput,
  SponsorshipRecurringInterval,
  SponsorshipRepository,
} from './sponsorship';
export {
  createSupabaseSponsorshipRepositories,
  SupabaseSponsorshipRepositoryError,
} from './sponsorship-supabase';
export type {
  CreateSupabaseSponsorshipRepositoriesInput,
  CreateSupabaseSponsorshipRepositoriesResult,
} from './sponsorship-supabase';
export {
  handleWorkerSponsorshipListRequest,
  matchWorkerSponsorshipListShelterId,
} from './sponsorship-list';
export type {
  HandleWorkerSponsorshipListRequestInput,
  ListSponsorshipsQuery,
  ListSponsorshipsResult,
  SponsorshipListRepository,
  SponsorshipListSummary,
  SponsorshipStatus,
} from './sponsorship-list';
export {
  createSupabaseSponsorshipListRepositories,
  SupabaseSponsorshipListRepositoryError,
} from './sponsorship-list-supabase';
export type {
  CreateSupabaseSponsorshipListRepositoriesInput,
  CreateSupabaseSponsorshipListRepositoriesResult,
} from './sponsorship-list-supabase';
export {
  handleWorkerSponsorshipManageRequest,
  matchWorkerSponsorshipManageId,
  validateSponsorshipManagePayload,
} from './sponsorship-manage';
export type {
  GetSponsorshipForManageResult,
  HandleWorkerSponsorshipManageRequestInput,
  SponsorshipManageRepository,
  UpdateSponsorshipStatusInput,
} from './sponsorship-manage';
export {
  createSupabaseSponsorshipManageRepositories,
  SupabaseSponsorshipManageRepositoryError,
} from './sponsorship-manage-supabase';
export type {
  CreateSupabaseSponsorshipManageRepositoriesInput,
  CreateSupabaseSponsorshipManageRepositoriesResult,
} from './sponsorship-manage-supabase';
export { handleWorkerSponsorshipDonorListRequest } from './sponsorship-donor-list';
export type {
  HandleWorkerSponsorshipDonorListRequestInput,
  ListDonorSponsorshipsQuery,
  ListDonorSponsorshipsResult,
  SponsorshipDonorListRepository,
} from './sponsorship-donor-list';
export {
  createSupabaseSponsorshipDonorListRepositories,
  SupabaseSponsorshipDonorListRepositoryError,
} from './sponsorship-donor-list-supabase';
export type {
  CreateSupabaseSponsorshipDonorListRepositoriesInput,
  CreateSupabaseSponsorshipDonorListRepositoriesResult,
} from './sponsorship-donor-list-supabase';
export type {
  CreateR2UploadSignerInput,
  R2UploadPresigner,
  R2UploadPresignerInput,
  R2UploadPresignerResult,
} from './r2-signer';

export type WorkerEnv = EnvironmentRecord;

const ROUTE_HANDLERS = [
  handleWebhooks,
  handleMedia,
  handlePets,
  handleShelters,
  handleAdoptions,
  handleDonations,
  handleSponsorships,
  handleNotifications,
] as const;

const _dispatchWorkerRequest = async (
  request: Request,
  env: WorkerEnv,
  dependencies: WorkerRequestDependencies,
): Promise<Response> => {
  const parsedConfig = parseEnvironmentConfig(env);

  if (!parsedConfig.ok) {
    return jsonResponse(
      {
        status: 'configuration_error',
        errors: parsedConfig.errors,
      },
      { status: 500 },
    );
  }

  const config = parsedConfig.config;
  const url = new URL(request.url);

  if (url.pathname === '/health') {
    return jsonResponse({
      status: 'ok',
      service: appConfig.serviceName,
      environment: config.app.environment,
    });
  }

  for (const handle of ROUTE_HANDLERS) {
    const response = await handle(request, config, dependencies);
    if (response !== null) return response;
  }

  return jsonResponse({ message: 'Not found' }, { status: 404 });
};

export const handleWorkerRequest = async (
  request: Request,
  env: WorkerEnv,
  dependencies: WorkerRequestDependencies = {},
): Promise<Response> => {
  try {
    return await _dispatchWorkerRequest(request, env, dependencies);
  } catch {
    return jsonResponse({ status: 'internal_server_error' }, { status: 500 });
  }
};

export default {
  fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const parsedConfig = parseEnvironmentConfig(env);
    const dependencies = createSupabaseSdkWorkerDependencies();

    if (parsedConfig.ok) {
      const providerDeps: Partial<WorkerRequestDependencies> = {};
      if (parsedConfig.config.payments.primaryProvider === 'ifthenpay') {
        providerDeps.paymentWebhookVerifier = createIfthenpayWebhookVerifier();
      }
      return handleWorkerRequest(request, env, {
        ...dependencies,
        ...createR2UploadSignerWorkerDependencies({ config: parsedConfig.config }),
        ...providerDeps,
      });
    }

    return handleWorkerRequest(request, env, dependencies);
  },
};
