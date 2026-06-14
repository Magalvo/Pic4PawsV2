export type RlsPolicyCommand = 'select' | 'insert' | 'update' | 'delete' | 'all';

export type RlsPolicyDefinition = {
  name: string;
  tableName: string;
  command: RlsPolicyCommand;
  roles: string[];
  usingSql?: string;
  checkSql?: string;
};

export type RlsPolicyMatrix = Record<string, RlsPolicyCommand[]>;

export const rlsPolicyMatrix: RlsPolicyMatrix = {
  users: ['select', 'update', 'all'],
  shelters: ['select', 'update', 'all'],
  shelter_memberships: ['select', 'insert', 'update', 'delete', 'all'],
  pets: ['select', 'insert', 'update', 'delete', 'all'],
  media_assets: ['select', 'insert', 'update', 'delete', 'all'],
  adoption_applications: ['select', 'insert', 'update', 'all'],
  donation_transactions: ['select', 'all'],
};

const isAdminSql = `exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
)`;

const isShelterMemberSql = (tableName: string) => `exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = ${tableName}.shelter_id
    and actor_memberships.deleted_at is null
)`;

const isShelterOwnerSql = (tableName: string) => `exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.role = 'shelter_owner'
    and actor_memberships.shelter_id = ${tableName}.shelter_id
    and actor_memberships.deleted_at is null
)`;

const isCurrentUserSql = (userColumn: string) => `exists (
  select 1 from users
  where users.id = ${userColumn}
    and users.auth_user_id = auth.uid()
    and users.status = 'active'
)`;

const isOwnUserRowSql = `users.auth_user_id = auth.uid()
and users.status = 'active'`;

export const rlsPolicies: RlsPolicyDefinition[] = [
  {
    name: 'users_can_read_own_profile',
    tableName: 'users',
    command: 'select',
    roles: ['authenticated'],
    usingSql: isOwnUserRowSql,
  },
  {
    name: 'users_adopters_can_update_own_profile',
    tableName: 'users',
    command: 'update',
    roles: ['authenticated'],
    usingSql: isOwnUserRowSql,
    checkSql: `${isOwnUserRowSql}
and users.role = 'adopter'`,
  },
  {
    name: 'shelters_public_can_read_verified',
    tableName: 'shelters',
    command: 'select',
    roles: ['anon', 'authenticated'],
    usingSql: `shelters.verification_status = 'verified'
and shelters.deleted_at is null`,
  },
  {
    name: 'shelters_members_can_read_own',
    tableName: 'shelters',
    command: 'select',
    roles: ['authenticated'],
    usingSql: `exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.shelter_id = shelters.id
    and actor_memberships.deleted_at is null
)`,
  },
  {
    name: 'shelters_owners_can_update_own',
    tableName: 'shelters',
    command: 'update',
    roles: ['authenticated'],
    usingSql: `exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.role = 'shelter_owner'
    and actor_memberships.shelter_id = shelters.id
    and actor_memberships.deleted_at is null
)`,
    checkSql: `exists (
  select 1
  from shelter_memberships as actor_memberships
  join users on users.id = actor_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and actor_memberships.role = 'shelter_owner'
    and actor_memberships.shelter_id = shelters.id
    and actor_memberships.deleted_at is null
)`,
  },
  {
    name: 'shelter_memberships_members_can_read_for_shelter',
    tableName: 'shelter_memberships',
    command: 'select',
    roles: ['authenticated'],
    usingSql: isShelterMemberSql('shelter_memberships'),
  },
  {
    name: 'shelter_memberships_owners_can_insert_for_shelter',
    tableName: 'shelter_memberships',
    command: 'insert',
    roles: ['authenticated'],
    checkSql: isShelterOwnerSql('shelter_memberships'),
  },
  {
    name: 'shelter_memberships_owners_can_update_for_shelter',
    tableName: 'shelter_memberships',
    command: 'update',
    roles: ['authenticated'],
    usingSql: isShelterOwnerSql('shelter_memberships'),
    checkSql: isShelterOwnerSql('shelter_memberships'),
  },
  {
    name: 'shelter_memberships_owners_can_delete_for_shelter',
    tableName: 'shelter_memberships',
    command: 'delete',
    roles: ['authenticated'],
    usingSql: isShelterOwnerSql('shelter_memberships'),
  },
  {
    name: 'pets_public_can_read_published_verified_shelter_pets',
    tableName: 'pets',
    command: 'select',
    roles: ['anon', 'authenticated'],
    usingSql: `pets.status = 'published'
and exists (
  select 1 from shelters
  where shelters.id = pets.shelter_id
    and shelters.verification_status = 'verified'
    and shelters.deleted_at is null
    )`,
  },
  {
    name: 'pets_shelter_members_can_read_for_shelter',
    tableName: 'pets',
    command: 'select',
    roles: ['authenticated'],
    usingSql: isShelterMemberSql('pets'),
  },
  {
    name: 'pets_shelter_members_can_insert_for_shelter',
    tableName: 'pets',
    command: 'insert',
    roles: ['authenticated'],
    checkSql: isShelterMemberSql('pets'),
  },
  {
    name: 'pets_shelter_members_can_update_for_shelter',
    tableName: 'pets',
    command: 'update',
    roles: ['authenticated'],
    usingSql: isShelterMemberSql('pets'),
    checkSql: isShelterMemberSql('pets'),
  },
  {
    name: 'pets_shelter_members_can_delete_for_shelter',
    tableName: 'pets',
    command: 'delete',
    roles: ['authenticated'],
    usingSql: isShelterMemberSql('pets'),
  },
  {
    name: 'media_assets_public_can_read_public',
    tableName: 'media_assets',
    command: 'select',
    roles: ['anon', 'authenticated'],
    usingSql: `media_assets.visibility = 'public'
and media_assets.deleted_at is null`,
  },
  {
    name: 'media_assets_owner_can_read_own',
    tableName: 'media_assets',
    command: 'select',
    roles: ['authenticated'],
    usingSql: isCurrentUserSql('media_assets.owner_user_id'),
  },
  {
    name: 'media_assets_shelter_members_can_read_for_shelter',
    tableName: 'media_assets',
    command: 'select',
    roles: ['authenticated'],
    usingSql: isShelterMemberSql('media_assets'),
  },
  {
    name: 'media_assets_owner_can_insert_own',
    tableName: 'media_assets',
    command: 'insert',
    roles: ['authenticated'],
    checkSql: isCurrentUserSql('media_assets.owner_user_id'),
  },
  {
    name: 'media_assets_shelter_members_can_insert_for_shelter',
    tableName: 'media_assets',
    command: 'insert',
    roles: ['authenticated'],
    checkSql: isShelterMemberSql('media_assets'),
  },
  {
    name: 'media_assets_owner_can_update_own',
    tableName: 'media_assets',
    command: 'update',
    roles: ['authenticated'],
    usingSql: isCurrentUserSql('media_assets.owner_user_id'),
    checkSql: isCurrentUserSql('media_assets.owner_user_id'),
  },
  {
    name: 'media_assets_shelter_members_can_update_for_shelter',
    tableName: 'media_assets',
    command: 'update',
    roles: ['authenticated'],
    usingSql: isShelterMemberSql('media_assets'),
    checkSql: isShelterMemberSql('media_assets'),
  },
  {
    name: 'media_assets_owner_can_delete_own',
    tableName: 'media_assets',
    command: 'delete',
    roles: ['authenticated'],
    usingSql: isCurrentUserSql('media_assets.owner_user_id'),
  },
  {
    name: 'media_assets_shelter_members_can_delete_for_shelter',
    tableName: 'media_assets',
    command: 'delete',
    roles: ['authenticated'],
    usingSql: isShelterMemberSql('media_assets'),
  },
  {
    name: 'adoption_applications_applicant_can_read_own',
    tableName: 'adoption_applications',
    command: 'select',
    roles: ['authenticated'],
    usingSql: `exists (
  select 1 from users
  where users.id = adoption_applications.applicant_user_id
    and users.auth_user_id = auth.uid()
    and users.status = 'active'
)`,
  },
  {
    name: 'adoption_applications_shelter_members_can_read_for_shelter',
    tableName: 'adoption_applications',
    command: 'select',
    roles: ['authenticated'],
    usingSql: isShelterMemberSql('adoption_applications'),
  },
  {
    name: 'adoption_applications_applicant_can_insert_own',
    tableName: 'adoption_applications',
    command: 'insert',
    roles: ['authenticated'],
    checkSql: isCurrentUserSql('adoption_applications.applicant_user_id'),
  },
  {
    name: 'adoption_applications_applicant_can_update_own_draft',
    tableName: 'adoption_applications',
    command: 'update',
    roles: ['authenticated'],
    usingSql: `${isCurrentUserSql('adoption_applications.applicant_user_id')}
and adoption_applications.status = 'draft'`,
    checkSql: isCurrentUserSql('adoption_applications.applicant_user_id'),
  },
  {
    name: 'adoption_applications_shelter_members_can_update_for_shelter',
    tableName: 'adoption_applications',
    command: 'update',
    roles: ['authenticated'],
    usingSql: isShelterMemberSql('adoption_applications'),
    checkSql: isShelterMemberSql('adoption_applications'),
  },
  {
    name: 'donation_transactions_shelter_members_can_read_for_shelter',
    tableName: 'donation_transactions',
    command: 'select',
    roles: ['authenticated'],
    usingSql: isShelterMemberSql('donation_transactions'),
  },
  {
    name: 'donation_transactions_donor_can_read_own',
    tableName: 'donation_transactions',
    command: 'select',
    roles: ['authenticated'],
    usingSql: isCurrentUserSql('donation_transactions.donor_user_id'),
  },
  {
    name: 'admin_can_manage_all_core_tables',
    tableName: '*',
    command: 'all',
    roles: ['authenticated'],
    usingSql: isAdminSql,
    checkSql: isAdminSql,
  },
];
