import { describe, expect, it } from 'vitest';
import {
  canManageShelter,
  canPublishPet,
  canReadAdoptionApplication,
  canReadDonationTransaction,
  resolveAuthenticatedActor,
  type AuthUserRecord,
  type ShelterMembershipRecord,
} from '@pic4paws/domain';

const users: AuthUserRecord[] = [
  { id: 'admin-user', authUserId: 'auth-admin', role: 'admin', status: 'active' },
  {
    id: 'shelter-member-user',
    authUserId: 'auth-shelter-member',
    role: 'shelter_member',
    status: 'active',
  },
  { id: 'adopter-user', authUserId: 'auth-adopter', role: 'adopter', status: 'active' },
  { id: 'suspended-user', authUserId: 'auth-suspended', role: 'adopter', status: 'suspended' },
];

const memberships: ShelterMembershipRecord[] = [
  {
    id: 'membership-1',
    userId: 'shelter-member-user',
    shelterId: 'shelter-a',
    role: 'shelter_member',
    deletedAt: null,
  },
  {
    id: 'membership-2',
    userId: 'shelter-member-user',
    shelterId: 'shelter-removed',
    role: 'shelter_member',
    deletedAt: '2026-06-01T00:00:00.000Z',
  },
];

describe('resolveAuthenticatedActor', () => {
  it('resolves active application users by Supabase auth id', () => {
    expect(resolveAuthenticatedActor({ authUserId: 'auth-adopter', users, memberships })).toEqual({
      id: 'adopter-user',
      authUserId: 'auth-adopter',
      role: 'adopter',
      status: 'active',
      memberships: [],
    });
  });

  it('denies missing and inactive users by default', () => {
    expect(resolveAuthenticatedActor({ authUserId: 'auth-missing', users, memberships })).toBeNull();
    expect(resolveAuthenticatedActor({ authUserId: 'auth-suspended', users, memberships })).toBeNull();
  });
});

describe('role-aware authorization', () => {
  const admin = resolveAuthenticatedActor({ authUserId: 'auth-admin', users, memberships });
  const shelterMember = resolveAuthenticatedActor({
    authUserId: 'auth-shelter-member',
    users,
    memberships,
  });
  const adopter = resolveAuthenticatedActor({ authUserId: 'auth-adopter', users, memberships });

  it('allows admins to manage every shelter', () => {
    expect(canManageShelter(admin, 'any-shelter')).toBe(true);
  });

  it('limits shelter members to active memberships', () => {
    expect(canManageShelter(shelterMember, 'shelter-a')).toBe(true);
    expect(canManageShelter(shelterMember, 'shelter-b')).toBe(false);
    expect(canManageShelter(shelterMember, 'shelter-removed')).toBe(false);
  });

  it('allows adopters to read only their own adoption applications', () => {
    expect(
      canReadAdoptionApplication(adopter, {
        applicantUserId: 'adopter-user',
        shelterId: 'shelter-a',
      }),
    ).toBe(true);
    expect(
      canReadAdoptionApplication(adopter, {
        applicantUserId: 'another-user',
        shelterId: 'shelter-a',
      }),
    ).toBe(false);
  });

  it('allows shelter members to read adoption and donation records for their shelter', () => {
    expect(
      canReadAdoptionApplication(shelterMember, {
        applicantUserId: 'adopter-user',
        shelterId: 'shelter-a',
      }),
    ).toBe(true);
    expect(canReadDonationTransaction(shelterMember, { shelterId: 'shelter-a' })).toBe(true);
    expect(canReadDonationTransaction(shelterMember, { shelterId: 'shelter-b' })).toBe(false);
  });

  it('allows publishing only for verified shelters managed by the actor', () => {
    expect(
      canPublishPet(shelterMember, {
        shelterId: 'shelter-a',
        shelterVerificationStatus: 'verified',
      }),
    ).toBe(true);
    expect(
      canPublishPet(shelterMember, {
        shelterId: 'shelter-a',
        shelterVerificationStatus: 'pending_review',
      }),
    ).toBe(false);
    expect(canPublishPet(adopter, { shelterId: 'shelter-a', shelterVerificationStatus: 'verified' })).toBe(
      false,
    );
  });
});
