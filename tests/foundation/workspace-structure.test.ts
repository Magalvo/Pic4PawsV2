import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

type PackageManifest = {
  name?: string;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

describe('approved monorepo foundation', () => {
  it('declares Turborepo orchestration at the root', () => {
    const rootPackage = readJson<PackageManifest>(join(root, 'package.json'));

    expect(existsSync(join(root, 'turbo.json'))).toBe(true);
    expect(rootPackage.devDependencies).toHaveProperty('turbo');
    expect(rootPackage.scripts?.build).toContain('turbo run build');
    expect(rootPackage.scripts?.typecheck).toContain('turbo run typecheck');
    expect(rootPackage.scripts?.lint).toContain('turbo run lint');
    expect(rootPackage.scripts?.test).toContain('turbo run test');
  });

  it('contains the approved app workspaces', () => {
    const apps = [
      ['apps/mobile/package.json', '@pic4paws/mobile'],
      ['apps/web/package.json', '@pic4paws/web'],
      ['apps/workers/package.json', '@pic4paws/workers'],
    ] as const;

    for (const [manifestPath, expectedName] of apps) {
      const manifest = readJson<PackageManifest>(join(root, manifestPath));
      expect(manifest.name).toBe(expectedName);
      expect(manifest.scripts).toHaveProperty('build');
      expect(manifest.scripts).toHaveProperty('typecheck');
    }
  });

  it('contains the approved shared package workspaces', () => {
    const packages = [
      ['packages/domain/package.json', '@pic4paws/domain'],
      ['packages/config/package.json', '@pic4paws/config'],
      ['packages/database/package.json', '@pic4paws/database'],
      ['packages/payments/package.json', '@pic4paws/payments'],
      ['packages/ui/package.json', '@pic4paws/ui'],
    ] as const;

    for (const [manifestPath, expectedName] of packages) {
      const manifest = readJson<PackageManifest>(join(root, manifestPath));
      expect(manifest.name).toBe(expectedName);
      expect(manifest.scripts).toHaveProperty('build');
      expect(manifest.scripts).toHaveProperty('typecheck');
    }
  });
});
