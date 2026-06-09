import type { AuthenticatedActor } from '@pic4paws/domain';
import type { WorkerPetDraftAuthenticator } from './pet-drafts';
import type { NotificationRepository } from './notification';

export type HousingType = 'apartment' | 'house' | 'farm' | 'other';

export type AdoptionApplicationPetContext = {
  petId: string;
  shelterId: string;
};

export type CreateAdoptionApplicationInput = {
  petId: string;
  shelterId: string;
  applicantUserId: string;
  status: 'submitted';
  submittedAt: string;
  applicantFullName: string;
  applicantEmail: string;
  applicantPhoneNumber: string;
  applicantCity: string;
  applicantDistrict: string | null;
  applicantPostalCode: string | null;
  housingType: HousingType;
  hasOutdoorSpace: boolean;
  hasChildren: boolean;
  hasOtherAnimals: boolean;
  otherAnimalsDescription: string | null;
  previousPetExperience: string;
  dailyRoutine: string;
  adoptionMotivation: string;
  veterinarianContact: string | null;
  dataProcessingAccepted: true;
  shelterContactAccepted: boolean;
  consentVersion: string;
  consentAcceptedAt: string;
};

export type CreateAdoptionApplicationResult = {
  applicationId: string;
  submittedAt: string;
};

export type AdoptionApplicationRepository = {
  loadPetForApplication: (petId: string) => Promise<AdoptionApplicationPetContext | null>;
  createApplication: (input: CreateAdoptionApplicationInput) => Promise<CreateAdoptionApplicationResult>;
};

// ─── Payload validation ───────────────────────────────────────────────────────

type ValidatedAdoptionPayload = {
  petId: string;
  applicantFullName: string;
  applicantEmail: string;
  applicantPhoneNumber: string;
  applicantCity: string;
  applicantDistrict: string | null;
  applicantPostalCode: string | null;
  housingType: HousingType;
  hasOutdoorSpace: boolean;
  hasChildren: boolean;
  hasOtherAnimals: boolean;
  otherAnimalsDescription: string | null;
  previousPetExperience: string;
  dailyRoutine: string;
  adoptionMotivation: string;
  veterinarianContact: string | null;
  dataProcessingAccepted: true;
  shelterContactAccepted: boolean;
  consentVersion: string;
  consentAcceptedAt: string;
};

type ValidateAdoptionPayloadResult =
  | { valid: true; data: ValidatedAdoptionPayload }
  | { valid: false; reasons: string[] };

const HOUSING_TYPES: HousingType[] = ['apartment', 'house', 'farm', 'other'];

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

export const validateAdoptionPayload = (payload: unknown): ValidateAdoptionPayloadResult => {
  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, reasons: ['payload_must_be_object'] };
  }

  const p = payload as Record<string, unknown>;
  const reasons: string[] = [];

  if (!isNonEmptyString(p['petId'])) reasons.push('petId_required');
  if (!isNonEmptyString(p['applicantFullName'])) reasons.push('applicant_full_name_required');
  if (!isNonEmptyString(p['applicantEmail'])) reasons.push('applicant_email_required');
  if (!isNonEmptyString(p['applicantPhoneNumber'])) reasons.push('applicant_phone_number_required');
  if (!isNonEmptyString(p['applicantCity'])) reasons.push('applicant_city_required');
  if (!HOUSING_TYPES.includes(p['housingType'] as HousingType)) reasons.push('housing_type_invalid');
  if (!isBoolean(p['hasOutdoorSpace'])) reasons.push('has_outdoor_space_required');
  if (!isBoolean(p['hasChildren'])) reasons.push('has_children_required');
  if (!isBoolean(p['hasOtherAnimals'])) reasons.push('has_other_animals_required');
  if (!isNonEmptyString(p['previousPetExperience'])) reasons.push('previous_pet_experience_required');
  if (!isNonEmptyString(p['dailyRoutine'])) reasons.push('daily_routine_required');
  if (!isNonEmptyString(p['adoptionMotivation'])) reasons.push('adoption_motivation_required');
  if (p['dataProcessingAccepted'] !== true) reasons.push('data_processing_consent_required');
  if (!isBoolean(p['shelterContactAccepted'])) reasons.push('shelter_contact_accepted_required');
  if (!isNonEmptyString(p['consentVersion'])) reasons.push('consent_version_required');
  if (!isNonEmptyString(p['consentAcceptedAt'])) reasons.push('consent_accepted_at_required');

  // Optional nullable fields — only validate if present and wrong type
  if (!isNullableString(p['applicantDistrict'])) reasons.push('applicant_district_invalid');
  if (!isNullableString(p['applicantPostalCode'])) reasons.push('applicant_postal_code_invalid');
  if (!isNullableString(p['otherAnimalsDescription'])) reasons.push('other_animals_description_invalid');
  if (!isNullableString(p['veterinarianContact'])) reasons.push('veterinarian_contact_invalid');

  if (reasons.length > 0) {
    return { valid: false, reasons };
  }

  return {
    valid: true,
    data: {
      petId: p['petId'] as string,
      applicantFullName: p['applicantFullName'] as string,
      applicantEmail: p['applicantEmail'] as string,
      applicantPhoneNumber: p['applicantPhoneNumber'] as string,
      applicantCity: p['applicantCity'] as string,
      applicantDistrict: (p['applicantDistrict'] as string | null) ?? null,
      applicantPostalCode: (p['applicantPostalCode'] as string | null) ?? null,
      housingType: p['housingType'] as HousingType,
      hasOutdoorSpace: p['hasOutdoorSpace'] as boolean,
      hasChildren: p['hasChildren'] as boolean,
      hasOtherAnimals: p['hasOtherAnimals'] as boolean,
      otherAnimalsDescription: (p['otherAnimalsDescription'] as string | null) ?? null,
      previousPetExperience: p['previousPetExperience'] as string,
      dailyRoutine: p['dailyRoutine'] as string,
      adoptionMotivation: p['adoptionMotivation'] as string,
      veterinarianContact: (p['veterinarianContact'] as string | null) ?? null,
      dataProcessingAccepted: true,
      shelterContactAccepted: p['shelterContactAccepted'] as boolean,
      consentVersion: p['consentVersion'] as string,
      consentAcceptedAt: p['consentAcceptedAt'] as string,
    },
  };
};

// ─── Handler ──────────────────────────────────────────────────────────────────

const jsonResponse = (body: unknown, init?: ResponseInit): Response =>
  Response.json(body, init);

const extractBearerToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

export type HandleWorkerAdoptionRequestInput = {
  request: Request;
  payload: unknown;
  adoptionRepository?: AdoptionApplicationRepository;
  authenticator?: WorkerPetDraftAuthenticator;
  actor?: AuthenticatedActor;
  notificationRepository?: NotificationRepository;
  now: string;
};

export const handleWorkerAdoptionRequest = async ({
  request,
  payload,
  adoptionRepository,
  authenticator,
  notificationRepository,
  now,
}: HandleWorkerAdoptionRequestInput): Promise<Response> => {
  // 1. Method check
  if (request.method !== 'POST') {
    return jsonResponse(
      { status: 'method_not_allowed', allowedMethods: ['POST'] },
      { status: 405, headers: { Allow: 'POST' } },
    );
  }

  // 2. Bearer token
  const bearerToken = extractBearerToken(request);
  if (!bearerToken) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  // 3. Authenticator configured
  if (!authenticator) {
    return jsonResponse({ status: 'auth_adapter_not_configured' }, { status: 501 });
  }

  // 4. Authenticate
  const authorizationHeader = request.headers.get('Authorization') ?? '';
  const actor = await authenticator({ request, authorizationHeader, bearerToken });
  if (!actor) {
    return jsonResponse({ status: 'unauthenticated' }, { status: 401 });
  }

  // 5. Validate payload
  const validation = validateAdoptionPayload(payload);
  if (!validation.valid) {
    return jsonResponse(
      { status: 'invalid_adoption_application', reasons: validation.reasons },
      { status: 400 },
    );
  }

  // 6. Repository check
  if (!adoptionRepository) {
    return jsonResponse({ status: 'adoption_repository_not_configured' }, { status: 501 });
  }

  // 7. Load pet context (shelterId derived server-side — never from client)
  const petContext = await adoptionRepository.loadPetForApplication(validation.data.petId);
  if (!petContext) {
    return jsonResponse({ status: 'pet_not_found' }, { status: 404 });
  }

  // 8. Create application
  const result = await adoptionRepository.createApplication({
    petId: petContext.petId,
    shelterId: petContext.shelterId,
    applicantUserId: actor.id,
    status: 'submitted',
    submittedAt: now,
    applicantFullName: validation.data.applicantFullName,
    applicantEmail: validation.data.applicantEmail,
    applicantPhoneNumber: validation.data.applicantPhoneNumber,
    applicantCity: validation.data.applicantCity,
    applicantDistrict: validation.data.applicantDistrict,
    applicantPostalCode: validation.data.applicantPostalCode,
    housingType: validation.data.housingType,
    hasOutdoorSpace: validation.data.hasOutdoorSpace,
    hasChildren: validation.data.hasChildren,
    hasOtherAnimals: validation.data.hasOtherAnimals,
    otherAnimalsDescription: validation.data.otherAnimalsDescription,
    previousPetExperience: validation.data.previousPetExperience,
    dailyRoutine: validation.data.dailyRoutine,
    adoptionMotivation: validation.data.adoptionMotivation,
    veterinarianContact: validation.data.veterinarianContact,
    dataProcessingAccepted: true,
    shelterContactAccepted: validation.data.shelterContactAccepted,
    consentVersion: validation.data.consentVersion,
    consentAcceptedAt: validation.data.consentAcceptedAt,
  });

  // 9. Dispatch notification (fire-and-forget)
  if (notificationRepository) {
    notificationRepository
      .notifyNewAdoptionApplication({
        shelterId: petContext.shelterId,
        applicationId: result.applicationId,
        petId: petContext.petId,
        applicantName: validation.data.applicantFullName,
      })
      .catch(() => undefined);
  }

  return jsonResponse(
    {
      status: 'adoption_application_submitted',
      applicationId: result.applicationId,
      petId: petContext.petId,
      shelterId: petContext.shelterId,
      submittedAt: result.submittedAt,
    },
    { status: 201 },
  );
};
