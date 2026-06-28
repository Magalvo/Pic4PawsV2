import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assertSafeSupabaseDryRunCommand,
  initialDatabaseMigration,
  migrationArtifacts,
  renderSupabaseDryRunGuide,
  renderSupabaseMigrationFile,
  supabaseDryRunPlan,
  supabaseLocalConfig,
} from '../../packages/database/src/index';

const secretPattern = /(service_role|jwt_secret|access_token|SUPABASE_ACCESS_TOKEN|eyJ[a-zA-Z0-9_-]+)/i;

describe('Supabase local configuration contract', () => {
  it('keeps Supabase configuration local-only and free of secrets', () => {
    const configToml = readFileSync('supabase/config.toml', 'utf8');

    expect(supabaseLocalConfig.projectId).toBe('pic4paws-v2-local');
    expect(supabaseLocalConfig.localOnly).toBe(true);
    expect(supabaseLocalConfig.configPath).toBe('supabase/config.toml');
    expect(configToml).toContain('project_id = "pic4paws-v2-local"');
    expect(configToml).toContain('port = 54321');
    expect(configToml).toContain('site_url = "http://localhost:3000"');
    expect(configToml).not.toMatch(secretPattern);
    expect(JSON.stringify(supabaseLocalConfig)).not.toMatch(secretPattern);
  });

  it('maps approved migration artifacts to Supabase migration paths', () => {
    const migrationFile = renderSupabaseMigrationFile(initialDatabaseMigration);

    expect(migrationFile.path).toBe('supabase/migrations/0001_initial_core_schema_and_rls.sql');
    expect(migrationFile.sql).toContain('create table public.users');
    expect(migrationFile.sql).toContain('alter table public.pets enable row level security;');
    expect(migrationFile.sql).not.toMatch(/\b(drop\s+table|drop\s+schema|truncate|delete\s+from)\b/i);
  });

  it('keeps every committed Supabase migration aligned with its TypeScript artifact', () => {
    for (const artifact of migrationArtifacts) {
      const migrationFile = renderSupabaseMigrationFile(artifact);
      const committedSql = readFileSync(migrationFile.path, 'utf8');
      const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, '\n');

      expect(normalizeLineEndings(committedSql)).toBe(
        normalizeLineEndings(`${migrationFile.sql}\n`),
      );
    }
  });

  it('documents a safe local dry-run plan without remote project commands', () => {
    expect(supabaseDryRunPlan.target).toBe('local');
    expect(supabaseDryRunPlan.requiresHumanApprovalBeforeRemoteUse).toBe(true);

    for (const step of supabaseDryRunPlan.steps) {
      expect(() => assertSafeSupabaseDryRunCommand(step.command)).not.toThrow();
      expect(step.command).not.toMatch(/\bsupabase\s+link\b|\bsupabase\s+db\s+push\b|--project-ref|SUPABASE_ACCESS_TOKEN/i);
    }
  });

  it('rejects production-risk Supabase commands', () => {
    expect(() => assertSafeSupabaseDryRunCommand('supabase db push')).toThrow(
      'Production-risk Supabase command is not allowed in dry-run guidance',
    );
    expect(() => assertSafeSupabaseDryRunCommand('supabase link --project-ref abc')).toThrow(
      'Production-risk Supabase command is not allowed in dry-run guidance',
    );
  });

  it('renders human-readable dry-run guidance', () => {
    const guide = renderSupabaseDryRunGuide();

    expect(guide).toContain('supabase/config.toml');
    expect(guide).toContain('supabase/migrations/0001_initial_core_schema_and_rls.sql');
    expect(guide).toContain('No production project should be linked');
    expect(guide).not.toMatch(secretPattern);
  });
});
