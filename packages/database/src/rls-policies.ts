export type RlsPolicyCommand = 'select' | 'insert' | 'update' | 'delete' | 'all';

export type RlsPolicyDefinition = {
  name: string;
  tableName: string;
  command: RlsPolicyCommand;
  roles: string[];
  usingSql: string;
  checkSql?: string;
};

const isAdminSql = `exists (
  select 1 from users
  where users.auth_user_id = auth.uid()
    and users.role = 'admin'
    and users.status = 'active'
)`;

const isShelterMemberSql = (tableName: string) => `exists (
  select 1
  from shelter_memberships
  join users on users.id = shelter_memberships.user_id
  where users.auth_user_id = auth.uid()
    and users.status = 'active'
    and shelter_memberships.shelter_id = ${tableName}.shelter_id
    and shelter_memberships.deleted_at is null
)`;

export const rlsPolicies: RlsPolicyDefinition[] = [
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
    name: 'donation_transactions_shelter_members_can_read_for_shelter',
    tableName: 'donation_transactions',
    command: 'select',
    roles: ['authenticated'],
    usingSql: isShelterMemberSql('donation_transactions'),
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
