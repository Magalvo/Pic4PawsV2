// Generates supabase/migrations/*.sql from the approved TypeScript migration artifacts.
// Usage: npm run db:generate-migrations
import { writeFileSync, mkdirSync } from 'fs';
import { migrationArtifacts, renderMigrationArtifact } from '../packages/database/src/index.ts';

const OUTPUT_DIR = 'supabase/migrations';

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const artifact of migrationArtifacts) {
  const path = `${OUTPUT_DIR}/${artifact.filename}`;
  writeFileSync(path, renderMigrationArtifact(artifact) + '\n', 'utf8');
  console.log(`wrote ${path}`);
}

console.log(`\n${migrationArtifacts.length} migration(s) written to ${OUTPUT_DIR}/`);
