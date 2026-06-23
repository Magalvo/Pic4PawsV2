import { handleWorkerShelterProfileRequest, matchWorkerShelterProfileId } from '../shelter-profile';
import { handleWorkerShelterSearchRequest } from '../shelter-search';
import {
  handleWorkerShelterMemberRequest,
  handleWorkerShelterMemberRemoveRequest,
  matchWorkerShelterMemberShelterId,
  matchWorkerShelterMemberRemoveIds,
} from '../shelter-member';
import { handleWorkerFinancialsRequest, matchWorkerFinancialsShelterId } from '../financials';
import { handleWorkerShelterPetListRequest, matchWorkerShelterPetsShelterId } from '../shelter-pet-list';
import { handleWorkerShelterRegistrationRequest } from '../shelter-register';
import { handleWorkerShelterUpdateRequest } from '../shelter-update';
import { handleWorkerShelterDeleteRequest } from '../shelter-delete';
import {
  handleWorkerShelterVerifyRequest,
  matchWorkerShelterVerificationId,
} from '../shelter-verify';
import {
  handleGetPaymentConfigRequest,
  handleSavePaymentConfigRequest,
  matchWorkerShelterPaymentConfigId,
} from '../shelter-payment-config';
import {
  handleWorkerAdminPendingSheltersRequest,
  matchWorkerAdminPendingSheltersPath,
} from '../admin-pending-shelters';
import { handleWorkerAdoptionListRequest, matchWorkerAdoptionListShelterId } from '../adoption-list';
import { handleWorkerDonationListRequest, matchWorkerDonationListShelterId } from '../donation-list';
import { handleWorkerSponsorshipListRequest, matchWorkerSponsorshipListShelterId } from '../sponsorship-list';
import type { WorkerRequestDependencies } from '../dependencies';
import type { WorkerParsedConfig } from './shared';

export const handle = async (
  request: Request,
  config: WorkerParsedConfig,
  dependencies: WorkerRequestDependencies,
): Promise<Response | null> => {
  const url = new URL(request.url);

  if (url.pathname === config.workers.shelterPath) {
    if (request.method === 'POST') {
      const payload = await request.json().catch(() => null);
      return handleWorkerShelterRegistrationRequest({
        request,
        payload,
        shelterRegistrationRepository: dependencies.shelterRegistrationRepository,
        authenticator: dependencies.petDraftAuthenticator,
      });
    }
    return handleWorkerShelterSearchRequest({
      request,
      shelterSearchRepository: dependencies.shelterSearchRepository,
    });
  }

  if (matchWorkerAdminPendingSheltersPath(url.pathname, config.workers.shelterPath)) {
    return handleWorkerAdminPendingSheltersRequest({
      request,
      adminPendingSheltersRepository: dependencies.adminPendingSheltersRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const memberRemoveIds = matchWorkerShelterMemberRemoveIds(url.pathname, config.workers.shelterPath);
  if (memberRemoveIds !== null) {
    return handleWorkerShelterMemberRemoveRequest({
      request,
      shelterId: memberRemoveIds.shelterId,
      memberId: memberRemoveIds.memberId,
      shelterMemberRepository: dependencies.shelterMemberRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const memberShelterId = matchWorkerShelterMemberShelterId(url.pathname, config.workers.shelterPath);
  if (memberShelterId !== null) {
    return handleWorkerShelterMemberRequest({
      request,
      shelterId: memberShelterId,
      shelterMemberRepository: dependencies.shelterMemberRepository,
      authenticator: dependencies.petDraftAuthenticator,
      now: dependencies.now?.() ?? new Date().toISOString(),
    });
  }

  const financialsShelterId = matchWorkerFinancialsShelterId(url.pathname, config.workers.shelterPath);
  if (financialsShelterId !== null) {
    return handleWorkerFinancialsRequest({
      request,
      shelterId: financialsShelterId,
      financialsRepository: dependencies.financialsRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const shelterPetListShelterId = matchWorkerShelterPetsShelterId(url.pathname, config.workers.shelterPath);
  if (shelterPetListShelterId !== null) {
    return handleWorkerShelterPetListRequest({
      request,
      shelterId: shelterPetListShelterId,
      shelterPetListRepository: dependencies.shelterPetListRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const paymentConfigShelterId = matchWorkerShelterPaymentConfigId(url.pathname, config.workers.shelterPath);
  if (paymentConfigShelterId !== null) {
    const payload = request.method === 'POST' ? await request.json().catch(() => null) : null;
    if (request.method === 'POST') {
      return handleSavePaymentConfigRequest({
        request,
        payload,
        shelterId: paymentConfigShelterId,
        repository: dependencies.shelterPaymentConfigRepository,
        authenticator: dependencies.petDraftAuthenticator,
      });
    }
    return handleGetPaymentConfigRequest({
      request,
      shelterId: paymentConfigShelterId,
      repository: dependencies.shelterPaymentConfigRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const verificationShelterId = matchWorkerShelterVerificationId(url.pathname, config.workers.shelterPath);
  if (verificationShelterId !== null) {
    const payload = await request.json().catch(() => null);
    return handleWorkerShelterVerifyRequest({
      request,
      shelterId: verificationShelterId,
      payload,
      shelterVerificationRepository: dependencies.shelterVerificationRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const shelterProfileId = matchWorkerShelterProfileId(url.pathname, config.workers.shelterPath);
  if (shelterProfileId !== null) {
    if (request.method === 'DELETE') {
      return handleWorkerShelterDeleteRequest({
        request,
        shelterId: shelterProfileId,
        shelterDeletionRepository: dependencies.shelterDeletionRepository,
        authenticator: dependencies.petDraftAuthenticator,
      });
    }
    if (request.method === 'PATCH') {
      const payload = await request.json().catch(() => null);
      return handleWorkerShelterUpdateRequest({
        request,
        shelterId: shelterProfileId,
        payload,
        shelterUpdateRepository: dependencies.shelterUpdateRepository,
        authenticator: dependencies.petDraftAuthenticator,
      });
    }
    return handleWorkerShelterProfileRequest({
      request,
      shelterId: shelterProfileId,
      shelterProfileRepository: dependencies.shelterProfileRepository,
    });
  }

  const adoptionListShelterId = matchWorkerAdoptionListShelterId(url.pathname, config.workers.shelterPath);
  if (adoptionListShelterId !== null) {
    return handleWorkerAdoptionListRequest({
      request,
      shelterId: adoptionListShelterId,
      adoptionListRepository: dependencies.adoptionListRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const donationListShelterId = matchWorkerDonationListShelterId(url.pathname, config.workers.shelterPath);
  if (donationListShelterId !== null) {
    return handleWorkerDonationListRequest({
      request,
      shelterId: donationListShelterId,
      donationListRepository: dependencies.donationListRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  const sponsorshipListShelterId = matchWorkerSponsorshipListShelterId(url.pathname, config.workers.shelterPath);
  if (sponsorshipListShelterId !== null) {
    return handleWorkerSponsorshipListRequest({
      request,
      shelterId: sponsorshipListShelterId,
      sponsorshipListRepository: dependencies.sponsorshipListRepository,
      authenticator: dependencies.petDraftAuthenticator,
    });
  }

  return null;
};
