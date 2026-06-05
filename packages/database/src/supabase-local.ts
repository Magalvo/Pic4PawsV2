import type { MigrationArtifact } from './migration-artifacts';
import { initialDatabaseMigration, renderMigrationArtifact } from './migration-artifacts';

export type SupabaseLocalConfig = {
  projectId: string;
  localOnly: true;
  configPath: 'supabase/config.toml';
  migrationsDir: 'supabase/migrations';
  ports: {
    api: 54321;
    database: 54322;
    studio: 54323;
    inbucket: 54324;
  };
  auth: {
    siteUrl: 'http://localhost:3000';
    additionalRedirectUrls: ['http://localhost:8081', 'http://localhost:19006'];
  };
};

export type SupabaseMigrationFile = {
  path: `supabase/migrations/${string}.sql`;
  sql: string;
};

export type SupabaseDryRunStep = {
  label: string;
  command: string;
  scope: 'review' | 'local';
};

export type SupabaseDryRunPlan = {
  target: 'local';
  requiresHumanApprovalBeforeRemoteUse: true;
  migrationPath: SupabaseMigrationFile['path'];
  steps: SupabaseDryRunStep[];
};

const productionRiskCommandPattern =
  /\b(supabase\s+link|supabase\s+db\s+push)\b|--project-ref|SUPABASE_ACCESS_TOKEN|service_role|access_token/i;

export const supabaseLocalConfig: SupabaseLocalConfig = {
  projectId: 'pic4paws-v2-local',
  localOnly: true,
  configPath: 'supabase/config.toml',
  migrationsDir: 'supabase/migrations',
  ports: {
    api: 54321,
    database: 54322,
    studio: 54323,
    inbucket: 54324,
  },
  auth: {
    siteUrl: 'http://localhost:3000',
    additionalRedirectUrls: ['http://localhost:8081', 'http://localhost:19006'],
  },
};

export const renderSupabaseMigrationFile = (
  artifact: MigrationArtifact = initialDatabaseMigration,
): SupabaseMigrationFile => ({
  path: `${supabaseLocalConfig.migrationsDir}/${artifact.filename}`,
  sql: renderMigrationArtifact(artifact),
});

export const assertSafeSupabaseDryRunCommand = (command: string): void => {
  if (productionRiskCommandPattern.test(command)) {
    throw new Error('Production-risk Supabase command is not allowed in dry-run guidance');
  }
};

const migrationFile = renderSupabaseMigrationFile(initialDatabaseMigration);

export const supabaseDryRunPlan: SupabaseDryRunPlan = {
  target: 'local',
  requiresHumanApprovalBeforeRemoteUse: true,
  migrationPath: migrationFile.path,
  steps: [
    {
      label: 'Review local configuration',
      command: 'review supabase/config.toml',
      scope: 'review',
    },
    {
      label: 'Review generated migration SQL',
      command: `review ${migrationFile.path}`,
      scope: 'review',
    },
    {
      label: 'Start local Supabase stack',
      command: 'supabase start',
      scope: 'local',
    },
    {
      label: 'List local migrations',
      command: 'supabase migration list --local',
      scope: 'local',
    },
  ],
};

for (const step of supabaseDryRunPlan.steps) {
  assertSafeSupabaseDryRunCommand(step.command);
}

export const renderSupabaseDryRunGuide = (): string => {
  const steps = supabaseDryRunPlan.steps
    .map((step, index) => `${index + 1}. ${step.label}: \`${step.command}\``)
    .join('\n');

  return [
    '# Supabase Local Dry Run',
    '',
    'No production project should be linked during this phase.',
    `Config: \`${supabaseLocalConfig.configPath}\``,
    `Migration artifact path: \`${supabaseDryRunPlan.migrationPath}\``,
    '',
    steps,
  ].join('\n');
};
