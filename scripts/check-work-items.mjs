/* global console, process */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_SECTIONS = [
  { label: 'Goal', aliases: ['Goal'] },
  { label: 'States', aliases: ['States'] },
  { label: 'Contract', aliases: ['Contract', 'Acceptance Criteria'] },
  { label: 'Affected files', aliases: ['Affected files', 'Affected Files'] },
];

const sectionPattern = (aliases) =>
  new RegExp(`^##\\s+(?:\\d+\\.?\\s*)?(?:${aliases.join('|')})\\b`, 'im');

const completionNotesPattern = /^##\s+(?:\d+\.?\s*)?Completion Notes\b/im;
const statusPattern = /^status:\s*\S+\s*$/im;
const implementedPattern = /^status:\s*done\s*$/im;
const openAcceptanceCriterionPattern = /^-\s+\[\s\]\s+/m;

const LEGACY_COMPLETED_WITHOUT_STATUS = new Set([
  'docs/work-items/ADOPTION-CLIENT-001-adoption-application-client.md',
  'docs/work-items/ADOPTION-LIST-CLIENT-001-adoption-list-client.md',
  'docs/work-items/ADOPTION-LIST-WORKER-001-shelter-adoption-list-worker-route.md',
  'docs/work-items/ADOPTION-STATUS-CLIENT-001-adoption-status-client.md',
  'docs/work-items/ADOPTION-STATUS-WORKER-001-adoption-status-worker.md',
  'docs/work-items/ADOPTION-VIEW-CLIENT-001-adoption-view-client.md',
  'docs/work-items/ADOPTION-VIEW-WORKER-001-adoption-view-worker-route.md',
  'docs/work-items/ADOPTION-WORKER-001-adoption-application-worker-route.md',
  'docs/work-items/AUTH-001-role-aware-auth-contracts.md',
  'docs/work-items/AUTH-SUPABASE-001-supabase-auth-adapter.md',
  'docs/work-items/DB-001-core-schema-and-rls.md',
  'docs/work-items/DB-SHELTER-GEO-001-canonical-shelter-coordinates.md',
  'docs/work-items/DONATION-CLIENT-001-donation-client.md',
  'docs/work-items/DONATION-LIST-CLIENT-001-donation-list-client.md',
  'docs/work-items/DONATION-LIST-WORKER-001-donation-list-worker-route.md',
  'docs/work-items/DONATION-STATUS-CLIENT-001-donation-status-client.md',
  'docs/work-items/DONATION-STATUS-WORKER-001-donation-status-worker-route.md',
  'docs/work-items/DONOR-ADOPTION-LIST-CLIENT-001-donor-adoption-list-client.md',
  'docs/work-items/DONOR-ADOPTION-LIST-WORKER-001-donor-adoption-list-worker.md',
  'docs/work-items/ENV-001-typed-environment-contracts.md',
  'docs/work-items/FOUND-002-approved-monorepo-foundation.md',
  'docs/work-items/MEDIA-001-media-asset-upload-policy.md',
  'docs/work-items/MEDIA-DB-001-media-asset-persistence-contract.md',
  'docs/work-items/MEDIA-UPLOAD-BINARY-CLIENT-001-browser-mobile-safe-binary-upload-executor.md',
  'docs/work-items/MEDIA-UPLOAD-CLIENT-001-web-mobile-media-upload-client-contract.md',
  'docs/work-items/MEDIA-UPLOAD-FLOW-CLIENT-001-composed-media-upload-client-flow.md',
  'docs/work-items/MEDIA-WORKER-PERSIST-001-authenticated-media-asset-worker-persistence.md',
  'docs/work-items/MIGRATIONS-001-initial-schema-and-rls-artifacts.md',
  'docs/work-items/MOBILE-001-portuguese-first-mobile-foundation.md',
  'docs/work-items/MOBILE-ADOPTION-001-mobile-adoption-application-product-boundary.md',
  'docs/work-items/MOBILE-ADOPTION-LIST-001-mobile-adoption-list-product-boundary.md',
  'docs/work-items/MOBILE-ADOPTION-VIEW-001-mobile-adoption-view-product-boundary.md',
  'docs/work-items/MOBILE-DONATION-001-mobile-donation-ui.md',
  'docs/work-items/MOBILE-DONATION-LIST-001-mobile-donation-list-ui.md',
  'docs/work-items/MOBILE-DONATION-STATUS-001-mobile-donation-status-ui.md',
  'docs/work-items/MOBILE-DONOR-ADOPTION-LIST-001-mobile-donor-adoption-list.md',
  'docs/work-items/MOBILE-MEDIA-UPLOAD-001-portuguese-mobile-media-upload-boundary.md',
  'docs/work-items/MOBILE-NOTIFICATION-001-mobile-notification-product-boundary.md',
  'docs/work-items/MOBILE-PET-ARCHIVE-001-mobile-pet-archive-product-boundary.md',
  'docs/work-items/MOBILE-PET-DRAFT-001-mobile-pet-draft-product-flow.md',
  'docs/work-items/MOBILE-PET-DRAFT-SAVE-FLOW-001-mobile-pet-draft-save-flow-boundary.md',
  'docs/work-items/MOBILE-PET-FEED-001-mobile-pet-feed-product-flow.md',
  'docs/work-items/MOBILE-PET-MEDIA-UPLOAD-ATTACH-001-mobile-pet-media-upload-attach-product-flow.md',
  'docs/work-items/MOBILE-PET-PROFILE-001-mobile-pet-profile-product-flow.md',
  'docs/work-items/MOBILE-PET-PUBLISH-001-mobile-pet-publish-product-flow.md',
  'docs/work-items/MOBILE-PET-REPUBLISH-001-mobile-pet-republish.md',
  'docs/work-items/MOBILE-SHELTER-MEMBER-001-mobile-shelter-member-product-boundary.md',
  'docs/work-items/MOBILE-SHELTER-PROFILE-001-mobile-shelter-profile-product-boundary.md',
  'docs/work-items/MOBILE-SPONSORSHIP-001-mobile-sponsorship-ui.md',
  'docs/work-items/MOBILE-SPONSORSHIP-DONOR-LIST-001-mobile-sponsorship-donor-list-ui.md',
  'docs/work-items/MOBILE-SPONSORSHIP-LIST-001-mobile-sponsorship-list-ui.md',
  'docs/work-items/MOBILE-SPONSORSHIP-MANAGE-001-mobile-sponsorship-manage-ui.md',
  'docs/work-items/NOTIFICATION-CLIENT-001-notification-client.md',
  'docs/work-items/NOTIFICATION-WORKER-001-notification-worker-routes.md',
  'docs/work-items/PAYMENT-WEBHOOK-VERIFIER-001-production-webhook-verifier-gate.md',
  'docs/work-items/PET-ARCHIVE-CLIENT-001-pet-archive-client.md',
  'docs/work-items/PET-DB-001-pet-draft-persistence-contract.md',
  'docs/work-items/PET-DRAFT-CLIENT-001-web-mobile-pet-draft-client.md',
  'docs/work-items/PET-DRAFT-SAVE-FLOW-CLIENT-001-composed-pet-draft-save-flow.md',
  'docs/work-items/PET-FEED-CLIENT-001-public-pet-feed-client.md',
  'docs/work-items/PET-FEED-WORKER-001-public-pet-feed-worker-route.md',
  'docs/work-items/PET-MEDIA-001-persisted-media-for-pet-publishing.md',
  'docs/work-items/PET-MEDIA-ATTACH-CLIENT-001-web-mobile-pet-media-attach-client.md',
  'docs/work-items/PET-MEDIA-ATTACH-WORKER-001-authenticated-pet-media-attach-worker.md',
  'docs/work-items/PET-MEDIA-UPLOAD-ATTACH-FLOW-001-composed-pet-media-upload-attach-flow.md',
  'docs/work-items/PET-MEDIA-UPLOAD-UI-001-pet-media-product-upload-flow.md',
  'docs/work-items/PET-PROFILE-CLIENT-001-public-pet-profile-client.md',
  'docs/work-items/PET-PROFILE-WORKER-001-public-pet-profile-worker-route.md',
  'docs/work-items/PET-PUBLISH-CLIENT-001-web-mobile-pet-publish-client.md',
  'docs/work-items/PET-PUBLISH-WORKER-001-authenticated-pet-publish-worker-contract.md',
  'docs/work-items/PET-REPUBLISH-CLIENT-001-pet-republish-client.md',
  'docs/work-items/PET-REPUBLISH-WORKER-001-pet-republish-worker.md',
  'docs/work-items/PET-SUPABASE-001-pet-supabase-repository-adapters.md',
  'docs/work-items/PET-WORKER-001-authenticated-pet-draft-worker-contract.md',
  'docs/work-items/PETS-001-pet-draft-publish-lifecycle.md',
  'docs/work-items/R2-001-r2-bucket-contracts-and-upload-dry-run.md',
  'docs/work-items/R2-SIGNER-SDK-001-server-side-r2-upload-signer-factory.md',
  'docs/work-items/RLS-001-migration-ready-policy-sql.md',
  'docs/work-items/SEC-001-dependency-vulnerability-remediation.md',
  'docs/work-items/SHELTER-MEMBER-CLIENT-001-shelter-member-client.md',
  'docs/work-items/SHELTER-PROFILE-CLIENT-001-shelter-profile-client.md',
  'docs/work-items/SHELTER-PROFILE-WORKER-001-shelter-profile-worker-route.md',
  'docs/work-items/SIGNER-001-injectable-r2-upload-signer.md',
  'docs/work-items/SPONSORSHIP-CLIENT-001-sponsorship-client.md',
  'docs/work-items/SPONSORSHIP-DONOR-LIST-CLIENT-001-sponsorship-donor-list-client.md',
  'docs/work-items/SPONSORSHIP-DONOR-LIST-WORKER-001-sponsorship-donor-list-worker.md',
  'docs/work-items/SPONSORSHIP-LIST-CLIENT-001-sponsorship-list-client.md',
  'docs/work-items/SPONSORSHIP-LIST-WORKER-001-sponsorship-list-worker.md',
  'docs/work-items/SPONSORSHIP-MANAGE-CLIENT-001-sponsorship-manage-client.md',
  'docs/work-items/SPONSORSHIP-MANAGE-WORKER-001-sponsorship-manage-worker.md',
  'docs/work-items/SPONSORSHIP-WORKER-001-sponsorship-worker-route.md',
  'docs/work-items/SUPABASE-001-local-config-and-migration-dry-run.md',
  'docs/work-items/UPLOAD-001-worker-media-upload-request-contract.md',
  'docs/work-items/WEB-001-portuguese-first-web-foundation.md',
  'docs/work-items/WEB-ADOPTION-001-web-adoption-application-product-boundary.md',
  'docs/work-items/WEB-ADOPTION-LIST-001-web-adoption-list-product-boundary.md',
  'docs/work-items/WEB-ADOPTION-VIEW-001-web-adoption-view-product-boundary.md',
  'docs/work-items/WEB-DONATION-001-web-donation-ui.md',
  'docs/work-items/WEB-DONATION-LIST-001-web-donation-list-ui.md',
  'docs/work-items/WEB-DONATION-STATUS-001-web-donation-status-ui.md',
  'docs/work-items/WEB-DONOR-ADOPTION-LIST-001-web-donor-adoption-list.md',
  'docs/work-items/WEB-MEDIA-UPLOAD-001-portuguese-web-media-upload-boundary.md',
  'docs/work-items/WEB-NOTIFICATION-001-web-notification-product-boundary.md',
  'docs/work-items/WEB-PET-ARCHIVE-001-web-pet-archive-product-boundary.md',
  'docs/work-items/WEB-PET-DRAFT-001-web-pet-draft-product-flow.md',
  'docs/work-items/WEB-PET-DRAFT-SAVE-FLOW-001-web-pet-draft-save-flow-boundary.md',
  'docs/work-items/WEB-PET-FEED-001-web-pet-feed-product-flow.md',
  'docs/work-items/WEB-PET-MEDIA-UPLOAD-ATTACH-001-web-pet-media-upload-attach-product-flow.md',
  'docs/work-items/WEB-PET-PROFILE-001-web-pet-profile-product-flow.md',
  'docs/work-items/WEB-PET-PUBLISH-001-web-pet-publish-product-flow.md',
  'docs/work-items/WEB-PET-REPUBLISH-001-web-pet-republish.md',
  'docs/work-items/WEB-SHELTER-MEMBER-001-web-shelter-member-product-boundary.md',
  'docs/work-items/WEB-SHELTER-PROFILE-001-web-shelter-profile-product-boundary.md',
  'docs/work-items/WEB-SPONSORSHIP-001-web-sponsorship-ui.md',
  'docs/work-items/WEB-SPONSORSHIP-DONOR-LIST-001-web-sponsorship-donor-list-ui.md',
  'docs/work-items/WEB-SPONSORSHIP-LIST-001-web-sponsorship-list-ui.md',
  'docs/work-items/WEB-SPONSORSHIP-MANAGE-001-web-sponsorship-manage-ui.md',
  'docs/work-items/WORKER-SUPABASE-SDK-001-server-side-supabase-sdk-client-factory.md',
  'docs/work-items/WORKER-SUPABASE-WIRING-001-production-worker-supabase-dependencies.md',
  'docs/work-items/WORKERS-001-validated-worker-boundaries.md',
]);

const LEGACY_DONE_WITH_OPEN_ACCEPTANCE_CRITERIA = new Set([
  'docs/work-items/DONATION-WORKER-001-donation-worker-route.md',
  'docs/work-items/MOBILE-SHELTER-PETS-001-mobile-shelter-pet-list-boundary.md',
  'docs/work-items/MOBILE-SHELTER-REGISTER-001-mobile-shelter-registration-boundary.md',
  'docs/work-items/PAYMENT-WEBHOOK-WORKER-001-payment-webhook-handler.md',
  'docs/work-items/SHELTER-PETS-CLIENT-001-shelter-pet-list-client.md',
  'docs/work-items/SHELTER-PETS-WORKER-001-shelter-pet-list-worker-route.md',
  'docs/work-items/SHELTER-REGISTER-ATOMIC-001-atomic-shelter-registration.md',
  'docs/work-items/SHELTER-REGISTER-CLIENT-001-shelter-registration-client.md',
  'docs/work-items/SHELTER-REGISTER-WORKER-001-shelter-registration-worker-route.md',
  'docs/work-items/SHELTER-UPDATE-001-shelter-profile-update.md',
  'docs/work-items/WEB-SHELTER-PETS-001-web-shelter-pet-list-boundary.md',
  'docs/work-items/WEB-SHELTER-REGISTER-001-web-shelter-registration-boundary.md',
]);

const listMarkdownFiles = (directory) => {
  if (!existsSync(directory)) return [];

  return readdirSync(directory)
    .map((name) => join(directory, name))
    .filter((path) => statSync(path).isFile() && path.endsWith('.md'));
};

const getCompletionNotesBody = (content) => {
  const match = completionNotesPattern.exec(content);
  if (!match) return null;

  const rest = content.slice(match.index + match[0].length);
  const nextSectionIndex = rest.search(/^##\s+/m);
  return nextSectionIndex === -1 ? rest : rest.slice(0, nextSectionIndex);
};

const isEmptyCompletionNotes = (body) => {
  if (body === null) return false;

  const normalized = body
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/[.!?]+$/u, '')
    .toLowerCase();

  return normalized.length === 0 || normalized === 'pending implementation';
};

export const checkWorkItemFiles = ({ repoRoot = process.cwd() } = {}) => {
  const workItemDir = join(repoRoot, 'docs', 'work-items');
  const issues = [];

  for (const file of listMarkdownFiles(workItemDir)) {
    const content = readFileSync(file, 'utf8');
    const relativeFile = relative(repoRoot, file).replace(/\\/g, '/');
    const hasStatus = statusPattern.test(content);
    const hasCompletionNotes = completionNotesPattern.test(content);
    const isImplemented = implementedPattern.test(content);

    if (
      !hasStatus &&
      hasCompletionNotes &&
      !LEGACY_COMPLETED_WITHOUT_STATUS.has(relativeFile)
    ) {
      issues.push({
        file: relativeFile,
        message: 'Missing status metadata',
      });
    }

    if (!isImplemented) continue;

    for (const section of REQUIRED_SECTIONS) {
      if (!sectionPattern(section.aliases).test(content)) {
        issues.push({
          file: relativeFile,
          message: `Missing required section: ${section.label}`,
        });
      }
    }

    if (
      openAcceptanceCriterionPattern.test(content) &&
      !LEGACY_DONE_WITH_OPEN_ACCEPTANCE_CRITERIA.has(relativeFile)
    ) {
      issues.push({
        file: relativeFile,
        message: 'Open acceptance criteria on done work item',
      });
    }

    if (isEmptyCompletionNotes(getCompletionNotesBody(content))) {
      issues.push({
        file: relativeFile,
        message: 'Completion Notes section is empty or still pending',
      });
    }
  }

  return issues;
};

const isCli = process.argv[1] === fileURLToPath(import.meta.url);

if (isCli) {
  const issues = checkWorkItemFiles();

  if (issues.length > 0) {
    console.error('SDD work item hygiene check failed:');
    for (const issue of issues) {
      console.error(`- ${issue.file}: ${issue.message}`);
    }
    process.exit(1);
  }

  console.log('SDD work item hygiene check passed.');
}
