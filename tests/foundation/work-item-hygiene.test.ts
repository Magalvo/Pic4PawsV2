import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkWorkItemFiles } from '../../scripts/check-work-items.mjs';

const makeRepo = () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pic4paws-work-items-'));
  mkdirSync(join(repoRoot, 'docs', 'work-items'), { recursive: true });
  return repoRoot;
};

const writeWorkItem = (repoRoot: string, name: string, content: string) => {
  writeFileSync(join(repoRoot, 'docs', 'work-items', name), content);
};

describe('work item hygiene check', () => {
  it('passes implemented work items with the required SDD envelope', () => {
    const repoRoot = makeRepo();
    writeWorkItem(
      repoRoot,
      'VALID-001.md',
      `---
id: VALID-001
status: done
---

## Goal
Ship a tested boundary.

## States
- idle
- done

## Contract
- The boundary is explicit.

## Affected files
- packages/example.ts

## Completion Notes
- Implemented and validated.
`,
    );

    expect(checkWorkItemFiles({ repoRoot })).toEqual([]);
  });

  it('fails implemented work items missing required sections', () => {
    const repoRoot = makeRepo();
    writeWorkItem(
      repoRoot,
      'INVALID-001.md',
      `---
id: INVALID-001
status: done
---

## Goal
Ship a boundary.

## Contract
- Missing states and affected files.
`,
    );

    expect(checkWorkItemFiles({ repoRoot })).toEqual([
      { file: 'docs/work-items/INVALID-001.md', message: 'Missing required section: States' },
      {
        file: 'docs/work-items/INVALID-001.md',
        message: 'Missing required section: Affected files',
      },
    ]);
  });

  it('fails pending completion notes when the section exists on implemented work', () => {
    const repoRoot = makeRepo();
    writeWorkItem(
      repoRoot,
      'PENDING-001.md',
      `---
id: PENDING-001
status: done
---

## Goal
Ship a boundary.

## States
- done

## Acceptance Criteria
- Legacy contract alias is accepted.

## Affected Files
- apps/example.ts

## Completion Notes
- Pending implementation.
`,
    );

    expect(checkWorkItemFiles({ repoRoot })).toEqual([
      {
        file: 'docs/work-items/PENDING-001.md',
        message: 'Completion Notes section is empty or still pending',
      },
    ]);
  });

  it('fails completion notes without status metadata', () => {
    const repoRoot = makeRepo();
    writeWorkItem(
      repoRoot,
      'NO-STATUS-001.md',
      `# NO-STATUS-001

## Goal
Ship a boundary.

## States
- done

## Contract
- The boundary is explicit.

## Affected files
- apps/example.ts

## Completion Notes
- Implemented and validated.
`,
    );

    expect(checkWorkItemFiles({ repoRoot })).toEqual([
      {
        file: 'docs/work-items/NO-STATUS-001.md',
        message: 'Missing status metadata',
      },
    ]);
  });

  it('fails done work items with open acceptance criteria', () => {
    const repoRoot = makeRepo();
    writeWorkItem(
      repoRoot,
      'OPEN-CRITERIA-001.md',
      `---
id: OPEN-CRITERIA-001
status: done
---

## Goal
Ship a boundary.

## States
- done

## Acceptance Criteria
- [ ] Important criterion still open.

## Affected Files
- apps/example.ts

## Completion Notes
- Implemented and validated.
`,
    );

    expect(checkWorkItemFiles({ repoRoot })).toEqual([
      {
        file: 'docs/work-items/OPEN-CRITERIA-001.md',
        message: 'Open acceptance criteria on done work item',
      },
    ]);
  });
});
