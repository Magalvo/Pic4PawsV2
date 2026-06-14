export type WorkItemIssue = {
  file: string;
  message: string;
};

export function checkWorkItemFiles(input?: { repoRoot?: string }): WorkItemIssue[];
