import {
  $3 as reactCompilerRuntime,
  I3 as getJsxRuntime,
  K2 as initializeMessageRuntime,
  Y2 as FormattedMessage,
} from "@rchunk/app-shared";

void reactCompilerRuntime;

export type PullRequestStatus = "closed" | "draft" | "merged" | "open";

export interface PullRequestStatusLabelProps {
  status: PullRequestStatus;
}

const messages: Record<
  PullRequestStatus,
  { defaultMessage: string; description: string; id: string }
> = {
  closed: {
    id: "pullRequestSidePanel.state.closed",
    defaultMessage: "Closed",
    description: "Closed pull request state shown in the side panel header",
  },
  draft: {
    id: "pullRequestSidePanel.state.draft",
    defaultMessage: "Draft",
    description: "Draft pull request state shown in the side panel header",
  },
  merged: {
    id: "pullRequestSidePanel.state.merged",
    defaultMessage: "Merged",
    description: "Merged pull request state shown in the side panel header",
  },
  open: {
    id: "pullRequestSidePanel.state.open",
    defaultMessage: "Ready for review",
    description: "Ready for review pull request state shown in the side panel",
  },
};

function PullRequestStatusLabel({ status }: PullRequestStatusLabelProps): unknown {
  const { jsx } = getJsxRuntime();
  return jsx(FormattedMessage, messages[status]);
}

function initializePullRequestStatusLabel(): void {
  initializeMessageRuntime();
  getJsxRuntime();
}

export { initializePullRequestStatusLabel as n, PullRequestStatusLabel as t };
