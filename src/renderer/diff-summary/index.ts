export interface FileDiffSummary {
  additions: number;
  deletions: number;
}

export interface DiffSummary {
  fileCount: number;
  hasChanges: boolean;
  linesAdded: number;
  linesDeleted: number;
}

function summarizeFileDiffs(files: readonly FileDiffSummary[]): DiffSummary {
  let linesAdded = 0;
  let linesDeleted = 0;
  for (const file of files) {
    linesAdded += file.additions;
    linesDeleted += file.deletions;
  }
  return {
    fileCount: files.length,
    hasChanges: linesAdded > 0 || linesDeleted > 0,
    linesAdded,
    linesDeleted,
  };
}

function initializeDiffSummary(): void {}

export { initializeDiffSummary as n, summarizeFileDiffs as t };
