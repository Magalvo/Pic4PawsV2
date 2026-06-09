import { appConfig, parseEnvironmentConfig, type EnvironmentRecord } from '@pic4paws/config';
import {
  resolveWorkerRequestDependencies,
  WorkerSupabaseWiringError,
  type WorkerRequestDependencies,
} from './dependencies';
import {
  canPersistMediaUploadIntentForActor,
  createWorkerMediaUploadIntent,
  persistWorkerMediaUploadIntent,
} from './media-upload';
import { handleWorkerPetFeedRequest } from './pet-feed';
import { handleWorkerPetProfileRequest, matchWorkerPetProfileId } from './pet-profile';
import {
  handleWorkerShelterProfileRequest,
  matchWorkerShelterProfileId,
} from './shelter-profile';
import { handleWorkerAdoptionRequest } from './adoption';
import {
  handleWorkerAdoptionListRequest,
  matchWorkerAdoptionListShelterId,
} from './adoption-list';
import {
  handleWorkerAdoptionStatusRequest,
  matchWorkerAdoptionStatusId,
} from './adoption-status';
import { handleWorkerAdoptionViewRequest } from './adoption-view';
import {
  handleWorkerShelterMemberRequest,
  handleWorkerShelterMemberRemoveRequest,
  matchWorkerShelterMemberShelterId,
  matchWorkerShelterMemberRemoveIds,
} from './shelter-member';
import { handleWorkerDonationRequest } from './donation';
import { handleWorkerSponsorshipRequest } from './sponsorship';
import {
  handleWorkerSponsorshipListRequest,
  matchWorkerSponsorshipListShelterId,
} from './sponsorship-list';
import {
  handleWorkerSponsorshipManageRequest,
  matchWorkerSponsorshipManageId,
} from './sponsorship-manage';
import { handleWorkerSponsorshipDonorListRequest } from './sponsorship-donor-list';
import {
  handleWorkerDonationListRequest,
  matchWorkerDonationListShelterId,
} from './donation-list';
import { handleWorkerPaymentWebhookRequest } from './payment-webhook';
import {
  handleWorkerDonationStatusRequest,
  matchWorkerDonationStatusId,
} from './donation-status';
import {
  handleWorkerPetDraftRequest,
  matchWorkerPetDraftRoute,
} from './pet-drafts';
import {
  handleWorkerPetArchiveRequest,
  matchWorkerPetArchiveId,
} from './pet-archive';
import {
  handleWorkerNotificationListRequest,
  handleWorkerNotificationReadRequest,
  matchWorkerNotificationsPath,
  matchWorkerNotificationReadId,
} from './notification';
import { createR2UploadSignerWorkerDependencies } from './r2-signer';
import { createSupabaseSdkWorkerDependencies } from './supabase-sdk';
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
  PetMediaAttachRepository,
  PetPublishRepository,
  WorkerPetDraftAuthenticator,
} from './pet-drafts';
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
  matchWorkerPetArchiveId,
  validatePetArchivePayload,
} from './pet-archive';
export type {
  HandleWorkerPetArchiveRequestInput,
  PetArchiveRecord,
  PetArchiveRepository,
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

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const parseJsonBody = async (request: Request): Promise<unknown | null> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const parseAuthorizationBearer = (request: Request): string | null => {
  const authorizationHeader = request.headers.get('Authorization');

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  const bearerToken = authorizationHeader.slice('Bearer '.length).trim();

  return bearerToken.length > 0 ? bearerToken : null;
};

const authenticateWorkerActor = async (
  request: Request,
  dependencies: WorkerRequestDependencies,
) => {
  const bearerToken = parseAuthorizationBearer(request);

  if (!bearerToken) {
    return {
      ok: false as const,
      response: jsonResponse({ status: 'unauthenticated' }, { status: 401 }),
    };
  }

  if (!dependencies.petDraftAuthenticator) {
    return {
      ok: false as const,
      response: jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 }),
    };
  }

  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await dependencies.petDraftAuthenticator({
    request,
    authorizationHeader,
    bearerToken,
  });

  if (!actor) {
    return {
      ok: false as const,
      response: jsonResponse({ status: 'unauthenticated' }, { status: 401 }),
    };
  }

  return { ok: true as const, actor };
};

export const handleWorkerRequest = async (
  request: Request,
  env: WorkerEnv,
  dependencies: WorkerRequestDependencies = {},
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
  const petDraftRoute = matchWorkerPetDraftRoute(url.pathname, config);

  if (url.pathname === '/health') {
    return jsonResponse({
      status: 'ok',
      service: appConfig.serviceName,
      environment: config.app.environment,
    });
  }

  if (url.pathname === config.workers.paymentWebhookPath) {
    if (request.method !== 'POST') {
      return jsonResponse(
        {
          status: 'method_not_allowed',
          allowedMethods: ['POST'],
        },
        {
          status: 405,
          headers: { Allow: 'POST' },
        },
      );
    }

    const rawBody = await request.text();
    const provider = config.payments.primaryProvider;
    const webhookSecretMap: Record<string, string | null> = {
      eupago: config.payments.eupagoWebhookSecret,
      ifthenpay: config.payments.ifthenpayWebhookSecret,
      stripe: config.payments.stripeWebhookSecret,
    };
    const webhookSecret = webhookSecretMap[provider] ?? '';

    return handleWorkerPaymentWebhookRequest({
      request,
      rawBody,
      provider,
      webhookSecret,
      paymentWebhookVerifier: dependencies.paymentWebhookVerifier,
      paymentWebhookRepository: dependencies.paymentWebhookRepository,
      notificationRepository: dependencies.notificationRepository,
      now: dependencies.now?.() ?? new Date().toISOString(),
    });
  }

  if (url.pathname === config.workers.mediaUploadPath) {
    if (request.method !== 'POST') {
      return jsonResponse(
        {
          status: 'method_not_allowed',
          allowedMethods: ['POST'],
        },
        {
          status: 405,
          headers: { Allow: 'POST' },
        },
      );
    }

    const payload = await parseJsonBody(request);

    if (payload === null) {
      return jsonResponse({ status: 'invalid_json' }, { status: 400 });
    }

    const authenticated = dependencies.mediaAssetRepository
      ? await authenticateWorkerActor(request, dependencies)
      : null;

    if (authenticated && !authenticated.ok) {
      return authenticated.response;
    }

    const uploadIntent = createWorkerMediaUploadIntent({
      payload,
      config,
      now: dependencies.now?.() ?? new Date().toISOString(),
      signer: dependencies.mediaUploadSigner,
    });
    const resolvedUploadIntent = await uploadIntent;

    if (!resolvedUploadIntent.ok) {
      return jsonResponse(
        {
          status: resolvedUploadIntent.status,
          reasons: resolvedUploadIntent.reasons,
        },
        { status: resolvedUploadIntent.status === 'upload_signer_failed' ? 502 : 400 },
      );
    }

    if (dependencies.mediaAssetRepository && authenticated?.ok) {
      if (!canPersistMediaUploadIntentForActor(authenticated.actor, resolvedUploadIntent.intent)) {
        return jsonResponse(
          {
            status: 'actor_not_authorized',
            reasons: ['actor_not_authorized'],
          },
          { status: 403 },
        );
      }

      const persistedMedia = await persistWorkerMediaUploadIntent({
        intent: resolvedUploadIntent.intent,
        actor: authenticated.actor,
        repository: dependencies.mediaAssetRepository,
      });

      if (!persistedMedia.ok) {
        return jsonResponse(
          {
            status: persistedMedia.status,
            reasons: persistedMedia.reasons,
          },
          { status: persistedMedia.status === 'media_asset_persistence_failed' ? 502 : 400 },
        );
      }

      return jsonResponse(
        {
          ...resolvedUploadIntent.intent,
          mediaAssetId: persistedMedia.mediaAssetId,
          mediaAssetPersisted: true,
        },
        { status: 201 },
      );
    }

    return jsonResponse(resolvedUploadIntent.intent, {
      status: resolvedUploadIntent.intent.status === 'upload_ready' ? 200 : 501,
    });
  }

  if (url.pathname === config.workers.petFeedPath) {
    return handleWorkerPetFeedRequest({
      request,
      petFeedRepository: dependencies.petFeedRepository,
    });
  }

  if (petDraftRoute.matched) {
    const payload = await parseJsonBody(request);

    if (payload === null) {
      return jsonResponse({ status: 'invalid_json' }, { status: 400 });
    }

    let resolvedDependencies: WorkerRequestDependencies;

    try {
      resolvedDependencies = resolveWorkerRequestDependencies({ config, dependencies });
    } catch (error) {
      if (error instanceof WorkerSupabaseWiringError) {
        return jsonResponse({ status: 'dependency_configuration_error' }, { status: 500 });
      }

      throw error;
    }

    return handleWorkerPetDraftRequest({
      request,
      config,
      payload,
      route: petDraftRoute,
      dependencies: {
        petDraftAuthenticator: resolvedDependencies.petDraftAuthenticator,
        petDraftRepository: resolvedDependencies.petDraftRepository,
        petMediaAttachRepository: resolvedDependencies.petMediaAttachRepository,
        petPublishRepository: resolvedDependencies.petPublishRepository,
        now: resolvedDependencies.now,
      },
    });
  }

  const archivePetId = matchWorkerPetArchiveId(url.pathname, config.workers.petFeedPath);

  if (archivePetId !== null) {
    const archivePayload = await parseJsonBody(request);
    return handleWorkerPetArchiveRequest({
      request,
      petId: archivePetId,
      payload: archivePayload,
      petArchiveRepository: dependencies.petArchiveRepository,
      authenticator: dependencies.petDraftAuthenticator,
      now: dependencies.now?.() ?? new Date().toISOString(),
    });
  }

  const profilePetId = matchWorkerPetProfileId(url.pathname, config.workers.petFeedPath);

  if (profilePetId !== null) {
    return handleWorkerPetProfileRequest({
      request,
      petId: profilePetId,
      petProfileRepository: dependencies.petProfileRepository,
    });
  }

  const memberRemoveIds = matchWorkerShelterMemberRemoveIds(
    url.pathname,
    config.workers.shelterPath,
  );

  if (memberRemoveIds !== null) {
    return handleWorkerShelterMemberRemoveRequest({
      request,
      shelterId: memberRemoveIds.shelterId,
      memberId: memberRemoveIds.memberId,
      shelterMemberRepository: dependencies.shelterMemberRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const memberShelterId = matchWorkerShelterMemberShelterId(
    url.pathname,
    config.workers.shelterPath,
  );

  if (memberShelterId !== null) {
    return handleWorkerShelterMemberRequest({
      request,
      shelterId: memberShelterId,
      shelterMemberRepository: dependencies.shelterMemberRepository,
      authenticator: dependencies.petDraftAuthenticator,
      now: dependencies.now?.() ?? new Date().toISOString(),
    });
  }

  const shelterProfileId = matchWorkerShelterProfileId(
    url.pathname,
    config.workers.shelterPath,
  );

  if (shelterProfileId !== null) {
    return handleWorkerShelterProfileRequest({
      request,
      shelterId: shelterProfileId,
      shelterProfileRepository: dependencies.shelterProfileRepository,
    });
  }

  const adoptionListShelterId = matchWorkerAdoptionListShelterId(
    url.pathname,
    config.workers.shelterPath,
  );

  if (adoptionListShelterId !== null) {
    return handleWorkerAdoptionListRequest({
      request,
      shelterId: adoptionListShelterId,
      adoptionListRepository: dependencies.adoptionListRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const donationListShelterId = matchWorkerDonationListShelterId(
    url.pathname,
    config.workers.shelterPath,
  );

  if (donationListShelterId !== null) {
    return handleWorkerDonationListRequest({
      request,
      shelterId: donationListShelterId,
      donationListRepository: dependencies.donationListRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const adoptionApplicationId = matchWorkerAdoptionStatusId(
    url.pathname,
    config.workers.adoptionsPath,
  );

  if (adoptionApplicationId !== null) {
    if (request.method === 'PATCH') {
      const payload = await parseJsonBody(request);
      return handleWorkerAdoptionStatusRequest({
        request,
        applicationId: adoptionApplicationId,
        payload,
        adoptionStatusRepository: dependencies.adoptionStatusRepository,
        authenticator: dependencies.petDraftAuthenticator,
        notificationRepository: dependencies.notificationRepository,
      });
    }
    if (request.method === 'GET') {
      return handleWorkerAdoptionViewRequest({
        request,
        applicationId: adoptionApplicationId,
        adoptionViewRepository: dependencies.adoptionViewRepository,
        authenticator: dependencies.petDraftAuthenticator,
      });
    }
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['GET', 'PATCH'] },
      { status: 405, headers: { Allow: 'GET, PATCH' } },
    );
  }

  if (url.pathname === config.workers.adoptionsPath) {
    const payload = await parseJsonBody(request);

    if (payload === null && request.method === 'POST') {
      return jsonResponse({ status: 'invalid_json' }, { status: 400 });
    }

    return handleWorkerAdoptionRequest({
      request,
      payload,
      adoptionRepository: dependencies.adoptionRepository,
      authenticator: dependencies.petDraftAuthenticator,
      notificationRepository: dependencies.notificationRepository,
      now: dependencies.now?.() ?? new Date().toISOString(),
    });
  }

  const donationStatusId = matchWorkerDonationStatusId(
    url.pathname,
    config.workers.donationsPath,
  );

  if (donationStatusId !== null) {
    return handleWorkerDonationStatusRequest({
      request,
      donationId: donationStatusId,
      donationStatusRepository: dependencies.donationStatusRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  if (url.pathname === config.workers.donationsPath) {
    const payload = await parseJsonBody(request);

    if (payload === null && request.method === 'POST') {
      return jsonResponse({ status: 'invalid_json' }, { status: 400 });
    }

    return handleWorkerDonationRequest({
      request,
      payload,
      donationRepository: dependencies.donationRepository,
      authenticator: dependencies.petDraftAuthenticator,
      provider: config.payments.primaryProvider,
      now: dependencies.now?.() ?? new Date().toISOString(),
    });
  }

  const sponsorshipListShelterId = matchWorkerSponsorshipListShelterId(
    url.pathname,
    config.workers.shelterPath,
  );

  if (sponsorshipListShelterId !== null) {
    return handleWorkerSponsorshipListRequest({
      request,
      shelterId: sponsorshipListShelterId,
      sponsorshipListRepository: dependencies.sponsorshipListRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const sponsorshipManageId = matchWorkerSponsorshipManageId(
    url.pathname,
    config.workers.sponsorshipsPath,
  );

  if (sponsorshipManageId !== null) {
    const payload = await parseJsonBody(request);
    return handleWorkerSponsorshipManageRequest({
      request,
      sponsorshipId: sponsorshipManageId,
      payload,
      sponsorshipManageRepository: dependencies.sponsorshipManageRepository,
      authenticator: dependencies.petDraftAuthenticator,
      notificationRepository: dependencies.notificationRepository,
    });
  }

  if (url.pathname === config.workers.sponsorshipsPath && request.method === 'GET') {
    return handleWorkerSponsorshipDonorListRequest({
      request,
      sponsorshipDonorListRepository: dependencies.sponsorshipDonorListRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  if (url.pathname === config.workers.sponsorshipsPath) {
    const payload = await parseJsonBody(request);

    if (payload === null && request.method === 'POST') {
      return jsonResponse({ status: 'invalid_json' }, { status: 400 });
    }

    return handleWorkerSponsorshipRequest({
      request,
      payload,
      sponsorshipRepository: dependencies.sponsorshipRepository,
      authenticator: dependencies.petDraftAuthenticator,
      provider: config.payments.primaryProvider,
      now: dependencies.now?.() ?? new Date().toISOString(),
    });
  }

  const notificationReadId = matchWorkerNotificationReadId(
    url.pathname,
    config.workers.notificationsPath,
  );

  if (notificationReadId !== null) {
    return handleWorkerNotificationReadRequest({
      request,
      notificationId: notificationReadId,
      notificationRepository: dependencies.notificationRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  if (matchWorkerNotificationsPath(url.pathname, config.workers.notificationsPath)) {
    return handleWorkerNotificationListRequest({
      request,
      notificationRepository: dependencies.notificationRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  return jsonResponse({ message: 'Not found' }, { status: 404 });
};

export default {
  fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const parsedConfig = parseEnvironmentConfig(env);
    const dependencies = createSupabaseSdkWorkerDependencies();

    if (parsedConfig.ok) {
      return handleWorkerRequest(request, env, {
        ...dependencies,
        ...createR2UploadSignerWorkerDependencies({ config: parsedConfig.config }),
      });
    }

    return handleWorkerRequest(request, env, dependencies);
  },
};
