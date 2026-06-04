export type AuthUserRole = 'admin' | 'shelter_owner' | 'shelter_member' | 'adopter';

export type AuthUserStatus = 'active' | 'pending_verification' | 'suspended' | 'deleted';

export type AuthUserRecord = {
  id: string;
  authUserId: string;
  role: AuthUserRole;
  status: AuthUserStatus;
};

export type ShelterMembershipRecord = {
  id: string;
  userId: string;
  shelterId: string;
  role: Extract<AuthUserRole, 'shelter_owner' | 'shelter_member'>;
  deletedAt?: string | null;
};

export type AuthenticatedActor = AuthUserRecord & {
  status: 'active';
  memberships: ShelterMembershipRecord[];
};

export type ResolveAuthenticatedActorInput = {
  authUserId: string;
  users: AuthUserRecord[];
  memberships: ShelterMembershipRecord[];
};

export type AdoptionApplicationAccessRecord = {
  applicantUserId: string;
  shelterId: string;
};

export type ShelterScopedAccessRecord = {
  shelterId: string;
};

export type PetPublishAccessRecord = {
  shelterId: string;
  shelterVerificationStatus: 'draft' | 'pending_review' | 'verified' | 'rejected' | 'suspended';
};

const hasActiveMembership = (actor: AuthenticatedActor, shelterId: string): boolean =>
  actor.memberships.some((membership) => membership.shelterId === shelterId && !membership.deletedAt);

export const resolveAuthenticatedActor = ({
  authUserId,
  users,
  memberships,
}: ResolveAuthenticatedActorInput): AuthenticatedActor | null => {
  const user = users.find((candidate) => candidate.authUserId === authUserId);

  if (!user || user.status !== 'active') {
    return null;
  }

  return {
    ...user,
    status: 'active',
    memberships: memberships.filter(
      (membership) => membership.userId === user.id && !membership.deletedAt,
    ),
  };
};

export const canManageShelter = (
  actor: AuthenticatedActor | null,
  shelterId: string,
): boolean => {
  if (!actor) {
    return false;
  }

  if (actor.role === 'admin') {
    return true;
  }

  return hasActiveMembership(actor, shelterId);
};

export const canReadAdoptionApplication = (
  actor: AuthenticatedActor | null,
  application: AdoptionApplicationAccessRecord,
): boolean => {
  if (!actor) {
    return false;
  }

  if (actor.role === 'admin') {
    return true;
  }

  if (application.applicantUserId === actor.id) {
    return true;
  }

  return hasActiveMembership(actor, application.shelterId);
};

export const canReadDonationTransaction = (
  actor: AuthenticatedActor | null,
  donation: ShelterScopedAccessRecord,
): boolean => canManageShelter(actor, donation.shelterId);

export const canPublishPet = (
  actor: AuthenticatedActor | null,
  pet: PetPublishAccessRecord,
): boolean =>
  pet.shelterVerificationStatus === 'verified' && canManageShelter(actor, pet.shelterId);
