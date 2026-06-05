import type { RlsPolicyDefinition } from './rls-policies';

export const coreRlsTableNames = [
  'pets',
  'adoption_applications',
  'donation_transactions',
  'shelters',
  'shelter_memberships',
  'media_assets',
  'users',
] as const;

type CoreRlsTableName = (typeof coreRlsTableNames)[number];

const safeIdentifierPattern = /^[a-z][a-z0-9_]*$/;

const assertSafeIdentifier = (identifier: string): string => {
  if (!safeIdentifierPattern.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }

  return identifier;
};

const renderRoles = (roles: string[]): string => {
  if (roles.length === 0) {
    throw new Error('RLS policy must declare at least one role');
  }

  return roles.map(assertSafeIdentifier).join(', ');
};

const renderPolicyName = (policy: RlsPolicyDefinition): string =>
  assertSafeIdentifier(policy.name);

const renderTableName = (tableName: string): string =>
  `public.${assertSafeIdentifier(tableName)}`;

const expandPolicy = (policy: RlsPolicyDefinition): RlsPolicyDefinition[] => {
  if (policy.tableName !== '*') {
    return [policy];
  }

  return coreRlsTableNames.map((tableName) => ({
    ...policy,
    name: `${policy.name}_on_${tableName}`,
    tableName,
  }));
};

export const renderEnableRowLevelSecuritySql = (tableName: CoreRlsTableName): string =>
  `alter table ${renderTableName(tableName)} enable row level security;`;

export const renderCreatePolicySql = (policy: RlsPolicyDefinition): string => {
  if (policy.tableName === '*') {
    throw new Error('Wildcard RLS policies must be expanded before SQL rendering');
  }

  const name = renderPolicyName(policy);
  const tableName = renderTableName(policy.tableName);
  const usingSql = policy.usingSql.trim();
  const checkSql = policy.checkSql?.trim();

  return [
    `drop policy if exists ${name} on ${tableName};`,
    `create policy ${name}`,
    `on ${tableName}`,
    `for ${policy.command}`,
    `to ${renderRoles(policy.roles)}`,
    `using (${usingSql})${checkSql ? `\nwith check (${checkSql})` : ''};`,
  ].join('\n');
};

export const renderRlsMigrationSql = (policies: RlsPolicyDefinition[]): string => {
  const expandedPolicies = policies.flatMap(expandPolicy);
  const enableStatements = coreRlsTableNames.map(renderEnableRowLevelSecuritySql);
  const policyStatements = expandedPolicies.map(renderCreatePolicySql);

  return [...enableStatements, ...policyStatements].join('\n\n');
};
