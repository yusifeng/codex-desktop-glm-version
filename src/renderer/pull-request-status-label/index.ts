import {
  $3 as getCompilerRuntime,
  I3 as getJsxRuntime,
  K2 as initializeMessageRuntime,
  Y2 as FormattedMessage,
} from "@rchunk/app-shared";

interface CompilerRuntime {
  c(size: number): unknown[];
}

let compilerRuntime: CompilerRuntime;
let jsx: ReturnType<typeof getJsxRuntime>;

export type PullRequestStatus = "closed" | "draft" | "merged" | "open";

export interface PullRequestStatusLabelProps {
  status: PullRequestStatus;
}

function PullRequestStatusLabel({ status }: PullRequestStatusLabelProps): unknown {
  const cache = compilerRuntime.c(4);
  const slot = status === "closed"
    ? 0
    : status === "draft"
      ? 1
      : status === "merged"
        ? 2
        : status === "open"
          ? 3
          : -1;
  if (slot < 0) return undefined;
  if (cache[slot] === Symbol.for("react.memo_cache_sentinel")) {
    const message = status === "closed"
      ? {
          id: "pullRequestSidePanel.state.closed",
          defaultMessage: "Closed",
          description: "Closed pull request state shown in the side panel header",
        }
      : status === "draft"
        ? {
            id: "pullRequestSidePanel.state.draft",
            defaultMessage: "Draft",
            description: "Draft pull request state shown in the side panel header",
          }
        : status === "merged"
          ? {
              id: "pullRequestSidePanel.state.merged",
              defaultMessage: "Merged",
              description: "Merged pull request state shown in the side panel header",
            }
          : {
              id: "pullRequestSidePanel.state.open",
              defaultMessage: "Ready for review",
              description: "Ready for review pull request state shown in the side panel",
            };
    cache[slot] = jsx.jsx(FormattedMessage, message);
  }
  return cache[slot];
}

function initializePullRequestStatusLabel(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeMessageRuntime();
  jsx = getJsxRuntime();
}

export { initializePullRequestStatusLabel as n, PullRequestStatusLabel as t };
