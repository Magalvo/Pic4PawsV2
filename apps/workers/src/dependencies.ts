import type { EnvironmentConfig } from '@pic4paws/config';
import {
  createSupabaseAuthAdapter,
  type SupabaseAuthClientLike,
  type SupabaseAuthTableQueryLike,
} from './auth-supabase';
import { type MediaAssetRepository, type MediaUploadSigner } from './media-upload';
import {
  createSupabasePetRepositories,
  type SupabaseClientLike,
  type SupabaseTableQueryLike,
} from './pet-supabase';
import type { PetFeedRepository } from './pet-feed';
import type { PetProfileRepository } from './pet-profile';
import type { ShelterProfileRepository } from './shelter-profile';
import { createSupabaseShelterRepositories } from './shelter-supabase';
import type { AdoptionApplicationRepository } from './adoption';
import { createSupabaseAdoptionRepositories } from './adoption-supabase';
import type { AdoptionListRepository } from './adoption-list';
import { createSupabaseAdoptionListRepositories } from './adoption-list-supabase';
import type { DonationRepository } from './donation';
import { createSupabaseDonationRepositories } from './donation-supabase';
import type { DonationListRepository } from './donation-list';
import { createSupabaseDonationListRepositories } from './donation-list-supabase';
import type { PaymentWebhookRepository, PaymentWebhookVerifier } from './payment-webhook';
import { createSupabasePaymentWebhookRepositories } from './payment-webhook-supabase';
import type { DonationStatusRepository } from './donation-status';
import { createSupabaseDonationStatusRepositories } from './donation-status-supabase';
import type { SponsorshipRepository } from './sponsorship';
import { createSupabaseSponsorshipRepositories } from './sponsorship-supabase';
import type { SponsorshipListRepository } from './sponsorship-list';
import { createSupabaseSponsorshipListRepositories } from './sponsorship-list-supabase';
import type { SponsorshipManageRepository } from './sponsorship-manage';
import { createSupabaseSponsorshipManageRepositories } from './sponsorship-manage-supabase';
import type { SponsorshipDonorListRepository } from './sponsorship-donor-list';
import { createSupabaseSponsorshipDonorListRepositories } from './sponsorship-donor-list-supabase';
import type { AdoptionStatusRepository } from './adoption-status';
import { createSupabaseAdoptionStatusRepositories } from './adoption-status-supabase';
import type { AdoptionViewRepository } from './adoption-view';
import { createSupabaseAdoptionViewRepositories } from './adoption-view-supabase';
import type { ShelterMemberRepository } from './shelter-member';
import { createSupabaseShelterMemberRepositories } from './shelter-member-supabase';
import type { PetArchiveRepository } from './pet-archive';
import { createSupabasePetArchiveRepositories } from './pet-archive-supabase';
import type { NotificationRepository } from './notification';
import { createSupabaseNotificationRepositories } from './notification-supabase';
import type { AdoptionDonorListRepository } from './adoption-donor-list';
import { createSupabaseAdoptionDonorListRepositories } from './adoption-donor-list-supabase';
import type { ShelterSearchRepository } from './shelter-search';
import { createSupabaseShelterSearchRepositories } from './shelter-search-supabase';
import type { NotificationPreferencesRepository } from './notification-preferences';
import { createSupabaseNotificationPreferencesRepositories } from './notification-preferences-supabase';
import type { FinancialsRepository } from './financials';
import { createSupabaseFinancialsRepositories } from './financials-supabase';
import type {
  PetDraftRepository,
  PetMediaAttachRepository,
  PetPublishRepository,
  WorkerPetDraftAuthenticator,
} from './pet-drafts';
import type { ShelterPetListRepository } from './shelter-pet-list';
import { createSupabaseShelterPetListRepositories } from './shelter-pet-list-supabase';
import type { ShelterRegistrationRepository } from './shelter-register';
import { createSupabaseShelterRegistrationRepositories } from './shelter-register-supabase';

export type WorkerSupabaseTableQueryLike = SupabaseAuthTableQueryLike & SupabaseTableQueryLike;

export type WorkerSupabaseClientLike = Omit<SupabaseAuthClientLike, 'from'> &
  Omit<SupabaseClientLike, 'from'> & {
    from: (table: string) => WorkerSupabaseTableQueryLike;
  };

export type WorkerSupabaseClientFactoryInput = {
  supabaseUrl: string;
  serviceRoleKey: string;
};

export type WorkerSupabaseClientFactory = (
  input: WorkerSupabaseClientFactoryInput,
) => WorkerSupabaseClientLike;

export type WorkerRequestDependencies = {
  mediaUploadSigner?: MediaUploadSigner;
  mediaAssetRepository?: MediaAssetRepository;
  petDraftAuthenticator?: WorkerPetDraftAuthenticator;
  petDraftRepository?: PetDraftRepository;
  petMediaAttachRepository?: PetMediaAttachRepository;
  petPublishRepository?: PetPublishRepository;
  petFeedRepository?: PetFeedRepository;
  petProfileRepository?: PetProfileRepository;
  shelterProfileRepository?: ShelterProfileRepository;
  adoptionRepository?: AdoptionApplicationRepository;
  adoptionListRepository?: AdoptionListRepository;
  donationRepository?: DonationRepository;
  donationListRepository?: DonationListRepository;
  paymentWebhookVerifier?: PaymentWebhookVerifier;
  paymentWebhookRepository?: PaymentWebhookRepository;
  donationStatusRepository?: DonationStatusRepository;
  sponsorshipRepository?: SponsorshipRepository;
  sponsorshipListRepository?: SponsorshipListRepository;
  sponsorshipManageRepository?: SponsorshipManageRepository;
  sponsorshipDonorListRepository?: SponsorshipDonorListRepository;
  adoptionStatusRepository?: AdoptionStatusRepository;
  adoptionViewRepository?: AdoptionViewRepository;
  shelterMemberRepository?: ShelterMemberRepository;
  petArchiveRepository?: PetArchiveRepository;
  notificationRepository?: NotificationRepository;
  adoptionDonorListRepository?: AdoptionDonorListRepository;
  shelterSearchRepository?: ShelterSearchRepository;
  notificationPreferencesRepository?: NotificationPreferencesRepository;
  financialsRepository?: FinancialsRepository;
  shelterPetListRepository?: ShelterPetListRepository;
  shelterRegistrationRepository?: ShelterRegistrationRepository;
  supabaseClientFactory?: WorkerSupabaseClientFactory;
  now?: () => string;
};

export type CreateWorkerSupabaseDependenciesInput = {
  config: EnvironmentConfig;
  supabaseClientFactory: WorkerSupabaseClientFactory;
  mediaUploadSigner?: MediaUploadSigner;
  mediaAssetRepository?: MediaAssetRepository;
  now?: () => string;
};

export type ResolveWorkerRequestDependenciesInput = {
  config: EnvironmentConfig;
  dependencies?: WorkerRequestDependencies;
};

export class WorkerSupabaseWiringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerSupabaseWiringError';
  }
}

const wiringFailureMessage = 'Failed to configure Supabase worker dependencies';

export const createWorkerSupabaseDependencies = ({
  config,
  supabaseClientFactory,
  mediaUploadSigner,
  mediaAssetRepository,
  now,
}: CreateWorkerSupabaseDependenciesInput): WorkerRequestDependencies => {
  try {
    const client = supabaseClientFactory({
      supabaseUrl: config.supabase.url,
      serviceRoleKey: config.supabase.serviceRoleKey,
    });
    const petRepositories = createSupabasePetRepositories({ client });
    const shelterRepositories = createSupabaseShelterRepositories({ client });
    const adoptionRepositories = createSupabaseAdoptionRepositories({ client });
    const adoptionListRepositories = createSupabaseAdoptionListRepositories({ client });
    const donationRepositories = createSupabaseDonationRepositories({ client });
    const donationListRepositories = createSupabaseDonationListRepositories({ client });
    const paymentWebhookRepositories = createSupabasePaymentWebhookRepositories({ client });
    const donationStatusRepositories = createSupabaseDonationStatusRepositories({ client });
    const sponsorshipRepositories = createSupabaseSponsorshipRepositories({ client });
    const sponsorshipListRepositories = createSupabaseSponsorshipListRepositories({ client });
    const sponsorshipManageRepositories = createSupabaseSponsorshipManageRepositories({ client });
    const sponsorshipDonorListRepositories = createSupabaseSponsorshipDonorListRepositories({ client });
    const adoptionStatusRepositories = createSupabaseAdoptionStatusRepositories({ client });
    const adoptionViewRepositories = createSupabaseAdoptionViewRepositories({ client });
    const shelterMemberRepositories = createSupabaseShelterMemberRepositories({ client });
    const petArchiveRepositories = createSupabasePetArchiveRepositories({ client });
    const adoptionDonorListRepositories = createSupabaseAdoptionDonorListRepositories({ client });
    const shelterSearchRepositories = createSupabaseShelterSearchRepositories({ client });
    const notificationPreferencesRepositories = createSupabaseNotificationPreferencesRepositories({ client });
    const financialsRepositories = createSupabaseFinancialsRepositories({ client });
    const shelterPetListRepositories = createSupabaseShelterPetListRepositories({ client });
    const shelterRegistrationRepositories = createSupabaseShelterRegistrationRepositories({ client });
    const notificationRepositories = createSupabaseNotificationRepositories({
      client,
      notificationPreferencesRepository: notificationPreferencesRepositories.notificationPreferencesRepository,
    });

    return {
      mediaUploadSigner,
      mediaAssetRepository: mediaAssetRepository ?? petRepositories.mediaAssetRepository,
      petDraftAuthenticator: createSupabaseAuthAdapter({ client }),
      petDraftRepository: petRepositories.petDraftRepository,
      petMediaAttachRepository: petRepositories.petMediaAttachRepository,
      petPublishRepository: petRepositories.petPublishRepository,
      petFeedRepository: petRepositories.petFeedRepository,
      petProfileRepository: petRepositories.petProfileRepository,
      shelterProfileRepository: shelterRepositories.shelterProfileRepository,
      adoptionRepository: adoptionRepositories.adoptionRepository,
      adoptionListRepository: adoptionListRepositories.adoptionListRepository,
      donationRepository: donationRepositories.donationRepository,
      donationListRepository: donationListRepositories.donationListRepository,
      paymentWebhookRepository: paymentWebhookRepositories.paymentWebhookRepository,
      donationStatusRepository: donationStatusRepositories.donationStatusRepository,
      sponsorshipRepository: sponsorshipRepositories.sponsorshipRepository,
      sponsorshipListRepository: sponsorshipListRepositories.sponsorshipListRepository,
      sponsorshipManageRepository: sponsorshipManageRepositories.sponsorshipManageRepository,
      sponsorshipDonorListRepository: sponsorshipDonorListRepositories.sponsorshipDonorListRepository,
      adoptionStatusRepository: adoptionStatusRepositories.adoptionStatusRepository,
      adoptionViewRepository: adoptionViewRepositories.adoptionViewRepository,
      shelterMemberRepository: shelterMemberRepositories.shelterMemberRepository,
      petArchiveRepository: petArchiveRepositories.petArchiveRepository,
      notificationRepository: notificationRepositories.notificationRepository,
      adoptionDonorListRepository: adoptionDonorListRepositories.adoptionDonorListRepository,
      shelterSearchRepository: shelterSearchRepositories.shelterSearchRepository,
      notificationPreferencesRepository: notificationPreferencesRepositories.notificationPreferencesRepository,
      financialsRepository: financialsRepositories.financialsRepository,
      shelterPetListRepository: shelterPetListRepositories.shelterPetListRepository,
      shelterRegistrationRepository: shelterRegistrationRepositories.shelterRegistrationRepository,
      // paymentWebhookVerifier is intentionally NOT set here — it is provider-SDK-specific
      // and must be injected by the production fetch handler or tests
      now,
    };
  } catch {
    throw new WorkerSupabaseWiringError(wiringFailureMessage);
  }
};

export const resolveWorkerRequestDependencies = ({
  config,
  dependencies = {},
}: ResolveWorkerRequestDependenciesInput): WorkerRequestDependencies => {
  if (!dependencies.supabaseClientFactory) {
    return dependencies;
  }

  if (
    dependencies.petDraftAuthenticator &&
    dependencies.petDraftRepository &&
    dependencies.petMediaAttachRepository &&
    dependencies.petPublishRepository
  ) {
    return dependencies;
  }

  const supabaseDependencies = createWorkerSupabaseDependencies({
    config,
    supabaseClientFactory: dependencies.supabaseClientFactory,
    mediaUploadSigner: dependencies.mediaUploadSigner,
    mediaAssetRepository: dependencies.mediaAssetRepository,
    now: dependencies.now,
  });

  return {
    ...dependencies,
    mediaAssetRepository:
      dependencies.mediaAssetRepository ?? supabaseDependencies.mediaAssetRepository,
    petDraftAuthenticator:
      dependencies.petDraftAuthenticator ?? supabaseDependencies.petDraftAuthenticator,
    petDraftRepository: dependencies.petDraftRepository ?? supabaseDependencies.petDraftRepository,
    petMediaAttachRepository:
      dependencies.petMediaAttachRepository ?? supabaseDependencies.petMediaAttachRepository,
    petPublishRepository:
      dependencies.petPublishRepository ?? supabaseDependencies.petPublishRepository,
    petFeedRepository:
      dependencies.petFeedRepository ?? supabaseDependencies.petFeedRepository,
    petProfileRepository:
      dependencies.petProfileRepository ?? supabaseDependencies.petProfileRepository,
    shelterProfileRepository:
      dependencies.shelterProfileRepository ?? supabaseDependencies.shelterProfileRepository,
    adoptionRepository:
      dependencies.adoptionRepository ?? supabaseDependencies.adoptionRepository,
    adoptionListRepository:
      dependencies.adoptionListRepository ?? supabaseDependencies.adoptionListRepository,
    donationRepository:
      dependencies.donationRepository ?? supabaseDependencies.donationRepository,
    donationListRepository:
      dependencies.donationListRepository ?? supabaseDependencies.donationListRepository,
    paymentWebhookVerifier: dependencies.paymentWebhookVerifier,
    paymentWebhookRepository:
      dependencies.paymentWebhookRepository ?? supabaseDependencies.paymentWebhookRepository,
    donationStatusRepository:
      dependencies.donationStatusRepository ?? supabaseDependencies.donationStatusRepository,
    sponsorshipRepository:
      dependencies.sponsorshipRepository ?? supabaseDependencies.sponsorshipRepository,
    sponsorshipListRepository:
      dependencies.sponsorshipListRepository ?? supabaseDependencies.sponsorshipListRepository,
    sponsorshipManageRepository:
      dependencies.sponsorshipManageRepository ?? supabaseDependencies.sponsorshipManageRepository,
    sponsorshipDonorListRepository:
      dependencies.sponsorshipDonorListRepository ??
      supabaseDependencies.sponsorshipDonorListRepository,
    adoptionStatusRepository:
      dependencies.adoptionStatusRepository ?? supabaseDependencies.adoptionStatusRepository,
    adoptionViewRepository:
      dependencies.adoptionViewRepository ?? supabaseDependencies.adoptionViewRepository,
    shelterMemberRepository:
      dependencies.shelterMemberRepository ?? supabaseDependencies.shelterMemberRepository,
    petArchiveRepository:
      dependencies.petArchiveRepository ?? supabaseDependencies.petArchiveRepository,
    notificationRepository:
      dependencies.notificationRepository ?? supabaseDependencies.notificationRepository,
    adoptionDonorListRepository:
      dependencies.adoptionDonorListRepository ?? supabaseDependencies.adoptionDonorListRepository,
    shelterSearchRepository:
      dependencies.shelterSearchRepository ?? supabaseDependencies.shelterSearchRepository,
    notificationPreferencesRepository:
      dependencies.notificationPreferencesRepository ?? supabaseDependencies.notificationPreferencesRepository,
    financialsRepository:
      dependencies.financialsRepository ?? supabaseDependencies.financialsRepository,
    shelterPetListRepository:
      dependencies.shelterPetListRepository ?? supabaseDependencies.shelterPetListRepository,
    shelterRegistrationRepository:
      dependencies.shelterRegistrationRepository ?? supabaseDependencies.shelterRegistrationRepository,
  };
};
