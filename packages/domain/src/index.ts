import type {
  PetLifecycleSpecies,
  PetLifecycleStatus,
  PublicPetMedicalStatus,
} from './pet-lifecycle';

export type UUID = string;
export type ISODateTime = string;
export type Locale = 'pt-PT' | 'en';
export type CurrencyCode = 'EUR';

export type AuditMetadata = {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime | null;
};

export * from './auth';
export * from './media-policy';
export * from './pet-lifecycle';

export type PaymentProvider = 'eupago' | 'ifthenpay' | 'stripe';
export type PaymentMethod = 'mb_way' | 'multibanco' | 'card' | 'bank_transfer' | 'unknown';
export type DonationKind = 'one_time_donation' | 'monthly_sponsorship';
export type DonationStatus =
  | 'created'
  | 'pending_payment'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export const productName = 'Pic4Paws';
export const SUPPORTED_LOCALES = ['pt-PT', 'en'] as const satisfies readonly Locale[];
export const DEFAULT_LOCALE = 'pt-PT' satisfies Locale;
export const PAYMENT_PROVIDERS = ['eupago', 'ifthenpay', 'stripe'] as const satisfies readonly PaymentProvider[];
export const PAYMENT_METHODS = [
  'mb_way',
  'multibanco',
  'card',
  'bank_transfer',
  'unknown',
] as const satisfies readonly PaymentMethod[];
export const DONATION_KINDS = [
  'one_time_donation',
  'monthly_sponsorship',
] as const satisfies readonly DonationKind[];
export const DONATION_STATUSES = [
  'created',
  'pending_payment',
  'paid',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded',
] as const satisfies readonly DonationStatus[];

export type UserRole = 'admin' | 'shelter_owner' | 'shelter_member' | 'adopter';
export type UserStatus = 'active' | 'pending_verification' | 'suspended' | 'deleted';

export type User = AuditMetadata & {
  id: UUID;
  authUserId: UUID;
  role: UserRole;
  status: UserStatus;
  email: string;
  displayName: string;
  phoneNumber?: string | null;
  locale: Locale;
  avatarMediaId?: UUID | null;
  gdprConsentVersion: string;
  gdprConsentAcceptedAt: ISODateTime;
};

export type ShelterKind = 'shelter' | 'sanctuary' | 'association' | 'foster_network';
export type ShelterVerificationStatus =
  | 'draft'
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'suspended';
export type ShelterPaymentAccountStatus = 'not_configured' | 'pending' | 'active' | 'disabled';

export const SHELTER_KINDS = [
  'shelter',
  'sanctuary',
  'association',
  'foster_network',
] as const satisfies readonly ShelterKind[];
export const SHELTER_VERIFICATION_STATUSES = [
  'draft',
  'pending_review',
  'verified',
  'rejected',
  'suspended',
] as const satisfies readonly ShelterVerificationStatus[];
export const SHELTER_PAYMENT_ACCOUNT_STATUSES = [
  'not_configured',
  'pending',
  'active',
  'disabled',
] as const satisfies readonly ShelterPaymentAccountStatus[];

export type Shelter = AuditMetadata & {
  id: UUID;
  name: string;
  slug: string;
  kind: ShelterKind;
  verificationStatus: ShelterVerificationStatus;
  taxId?: string | null;
  registrationNumber?: string | null;
  publicEmail?: string | null;
  publicPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city: string;
  district?: string | null;
  postalCode?: string | null;
  countryCode: 'PT';
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  logoMediaId?: UUID | null;
  coverMediaId?: UUID | null;
  paymentAccountStatus: ShelterPaymentAccountStatus;
};

export type PetSpecies = PetLifecycleSpecies;
export type PetStatus = PetLifecycleStatus;
export type PetSex = 'female' | 'male' | 'unknown';
export type PetSize = 'small' | 'medium' | 'large' | 'giant' | 'unknown';
export type PetMedicalStatus = PublicPetMedicalStatus;

export const PET_SPECIES = [
  'dog',
  'cat',
  'horse',
  'donkey',
  'guinea_pig',
  'rabbit',
  'bird',
  'other',
] as const satisfies readonly PetSpecies[];
export const PET_STATUSES = [
  'draft',
  'published',
  'adoption_pending',
  'adopted',
  'not_available',
  'archived',
] as const satisfies readonly PetStatus[];
export const PET_SEXES = ['female', 'male', 'unknown'] as const satisfies readonly PetSex[];
export const PET_SIZES = [
  'small',
  'medium',
  'large',
  'giant',
  'unknown',
] as const satisfies readonly PetSize[];

export type PetSponsorshipSettings = {
  enabled: boolean;
  monthlyGoalCents?: number | null;
  currentMonthCoveredCents?: number | null;
  goalLabel?: string | null;
};

export type Pet = AuditMetadata & {
  id: UUID;
  shelterId: UUID;
  status: PetStatus;
  name: string;
  species: PetSpecies;
  customSpeciesLabel?: string | null;
  breedPrimary?: string | null;
  breedSecondary?: string | null;
  sex: PetSex;
  size: PetSize;
  birthDate?: string | null;
  estimatedAgeLabel?: string | null;
  locationLabel: string;
  shortDescription: string;
  story?: string | null;
  traits: string[];
  adoptionFeeCents?: number | null;
  mediaIds: UUID[];
  heroMediaId?: UUID | null;
  medical: PetMedicalStatus;
  sponsorship: PetSponsorshipSettings;
  publishedAt?: ISODateTime | null;
};

export type AdoptionApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'more_info_requested'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'expired';
export type HousingType = 'apartment' | 'house' | 'farm' | 'other';

export const ADOPTION_APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'more_info_requested',
  'approved',
  'rejected',
  'withdrawn',
  'expired',
] as const satisfies readonly AdoptionApplicationStatus[];
export const HOUSING_TYPES = [
  'apartment',
  'house',
  'farm',
  'other',
] as const satisfies readonly HousingType[];

export type AdoptionForm = AuditMetadata & {
  id: UUID;
  petId: UUID;
  shelterId: UUID;
  applicantUserId: UUID;
  status: AdoptionApplicationStatus;
  submittedAt?: ISODateTime | null;
  reviewedAt?: ISODateTime | null;
  reviewedByUserId?: UUID | null;
  applicant: {
    fullName: string;
    email: string;
    phoneNumber: string;
    city: string;
    district?: string | null;
    postalCode?: string | null;
  };
  household: {
    housingType: HousingType;
    hasOutdoorSpace: boolean;
    hasChildren: boolean;
    hasOtherAnimals: boolean;
    otherAnimalsDescription?: string | null;
  };
  experience: {
    previousPetExperience: string;
    dailyRoutine: string;
    adoptionMotivation: string;
    veterinarianContact?: string | null;
  };
  consent: {
    dataProcessingAccepted: boolean;
    shelterContactAccepted: boolean;
    consentVersion: string;
    acceptedAt: ISODateTime;
  };
  internalNotes?: string | null;
  rejectionReason?: string | null;
};

export type DonationTransaction = AuditMetadata & {
  id: UUID;
  kind: DonationKind;
  status: DonationStatus;
  provider: PaymentProvider;
  providerPaymentId: string;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  idempotencyKey: string;
  shelterId: UUID;
  petId?: UUID | null;
  donorUserId?: UUID | null;
  donorDisplayName?: string | null;
  donorEmail?: string | null;
  amountCents: number;
  feeCents?: number | null;
  netAmountCents?: number | null;
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  paidAt?: ISODateTime | null;
  refundedAt?: ISODateTime | null;
  rawProviderEventIds: string[];
  publicMessage?: string | null;
  anonymous: boolean;
};

export type SponsorshipProgressInput = {
  currentMonthCoveredCents: number;
  monthlyGoalCents: number;
};

export const calculateSponsorshipProgress = ({
  currentMonthCoveredCents,
  monthlyGoalCents,
}: SponsorshipProgressInput): number => {
  if (monthlyGoalCents <= 0) {
    return 0;
  }

  const progress = (currentMonthCoveredCents / monthlyGoalCents) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
};
