export interface GitActionReviewStateInput {
  currentBranch?: string | null;
  storedThreadBranch?: string | null;
}

export interface GitActionReviewState {
  currentBranchName: string;
  hasThreadBranchMismatch: boolean;
  storedThreadBranchName: string;
}

function getGitActionReviewState({
  currentBranch,
  storedThreadBranch,
}: GitActionReviewStateInput): GitActionReviewState {
  const currentBranchName = currentBranch?.trim() ?? "";
  const storedThreadBranchName = storedThreadBranch?.trim() ?? "";
  return {
    currentBranchName,
    hasThreadBranchMismatch:
      currentBranchName.length > 0 &&
      storedThreadBranchName.length > 0 &&
      currentBranchName !== storedThreadBranchName,
    storedThreadBranchName,
  };
}

function initializeGitActionReviewState(): void {}

export { initializeGitActionReviewState as n, getGitActionReviewState as t };
