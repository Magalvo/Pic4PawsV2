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
const implementedPattern = /^status:\s*done\s*$/im;

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
    if (!implementedPattern.test(content)) continue;

    for (const section of REQUIRED_SECTIONS) {
      if (!sectionPattern(section.aliases).test(content)) {
        issues.push({
          file: relative(repoRoot, file),
          message: `Missing required section: ${section.label}`,
        });
      }
    }

    if (isEmptyCompletionNotes(getCompletionNotesBody(content))) {
      issues.push({
        file: relative(repoRoot, file),
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
