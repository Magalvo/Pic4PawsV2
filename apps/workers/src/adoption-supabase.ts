import type { SupabaseClientLike, SupabaseQueryResult } from './pet-supabase';
import type {
  AdoptionApplicationRepository,
  AdoptionApplicationPetContext,
  CreateAdoptionApplicationInput,
  CreateAdoptionApplicationResult,
} from './adoption';

export class SupabaseAdoptionRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseAdoptionRepositoryError';
  }
}

export type CreateSupabaseAdoptionRepositoriesInput = {
  client: SupabaseClientLike;
};

export type CreateSupabaseAdoptionRepositoriesResult = {
  adoptionRepository: AdoptionApplicationRepository;
};

type PetForApplicationRow = {
  id: string;
  shelter_id: string;
};

type CreatedApplicationRow = {
  id: string;
  submitted_at: string;
};

export const createSupabaseAdoptionRepositories = ({
  client,
}: CreateSupabaseAdoptionRepositoriesInput): CreateSupabaseAdoptionRepositoriesResult => {
  const adoptionRepository: AdoptionApplicationRepository = {
    loadPetForApplication: async (petId: string): Promise<AdoptionApplicationPetContext | null> => {
      const result = (await client
        .from('pets')
        .select('id,shelter_id')
        .eq('id', petId)
        .eq('status', 'published')
        .is('deleted_at', null)
        .maybeSingle()) as SupabaseQueryResult<PetForApplicationRow>;

      if (result.error) {
        throw new SupabaseAdoptionRepositoryError(
          `Failed to load pet for application: ${result.error.message ?? 'unknown error'}`,
        );
      }

      if (!result.data) {
        return null;
      }

      return {
        petId: result.data.id,
        shelterId: result.data.shelter_id,
      };
    },

    createApplication: async (
      input: CreateAdoptionApplicationInput,
    ): Promise<CreateAdoptionApplicationResult> => {
      const row = {
        pet_id: input.petId,
        shelter_id: input.shelterId,
        applicant_user_id: input.applicantUserId,
        status: input.status,
        submitted_at: input.submittedAt,
        applicant_full_name: input.applicantFullName,
        applicant_email: input.applicantEmail,
        applicant_phone_number: input.applicantPhoneNumber,
        applicant_city: input.applicantCity,
        applicant_district: input.applicantDistrict,
        applicant_postal_code: input.applicantPostalCode,
        housing_type: input.housingType,
        has_outdoor_space: input.hasOutdoorSpace,
        has_children: input.hasChildren,
        has_other_animals: input.hasOtherAnimals,
        other_animals_description: input.otherAnimalsDescription,
        previous_pet_experience: input.previousPetExperience,
        daily_routine: input.dailyRoutine,
        adoption_motivation: input.adoptionMotivation,
        veterinarian_contact: input.veterinarianContact,
        data_processing_accepted: input.dataProcessingAccepted,
        shelter_contact_accepted: input.shelterContactAccepted,
        consent_version: input.consentVersion,
        consent_accepted_at: input.consentAcceptedAt,
        created_at: input.submittedAt,
        updated_at: input.submittedAt,
      };

      const result = (await client
        .from('adoption_applications')
        .insert(row)
        .select('id,submitted_at')
        .single()) as SupabaseQueryResult<CreatedApplicationRow>;

      if (result.error || !result.data) {
        throw new SupabaseAdoptionRepositoryError(
          `Failed to create adoption application: ${result.error?.message ?? 'unknown error'}`,
        );
      }

      return {
        applicationId: result.data.id,
        submittedAt: result.data.submitted_at,
      };
    },
  };

  return { adoptionRepository };
};
