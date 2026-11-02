// thread-side-panel-tab-content —— 会话 Review 侧栏的来源切换、文件导航与 Git 操作。

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/diff-source";
import "@rchunk/review-preferences-model";
import "@rchunk/review-thread-file-diff";
import "@rchunk/virtualized-file-diff-line-position";
import "@rchunk/review-file-tree-side-pane";
import "@rchunk/review-thread-pull-request-revision-queries";
import "@rchunk/review-file-tree-pane";
import "@rchunk/scroll-to-match";
import "@rchunk/git-branch-switcher";
import "@rchunk/local-conversation-git-actions";
import "@rchunk/undo";
import "@rchunk/use-create-git-repository";
import { i as CodeDiff } from "@rchunk/code-diff";
import { PullRequestCodeReview } from "@rchunk/review-thread-pull-request-code-review";
import "@rchunk/revision-review-unavailable-message";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type ReviewSource =
  | "pr"
  | "branch"
  | "last-turn"
  | "uncommitted"
  | "unstaged"
  | "staged"
  | "committed";
interface ReviewFile {
  additions?: number;
  deletions?: number;
  diff?: string;
  generated?: boolean;
  path: string;
  status?: string;
}
interface PullRequest {
  baseBranch?: string;
  headBranch?: string;
  id: string;
  number?: number;
  title?: string;
}
interface Commit {
  id: string;
  subject?: string;
}
interface ReviewTabState {
  baseBranch?: string | null;
  commits?: Commit[];
  copyCommand?: string;
  error?: string | null;
  files?: ReviewFile[];
  gitInitError?: string | null;
  isGitInitializing?: boolean;
  isLoading?: boolean;
  largeDiff?: boolean;
  lastTurnStatus?: "committed" | "reverted" | null;
  omittedUntrackedCount?: number;
  pullRequests?: PullRequest[];
  repositoryInitialized?: boolean;
  search?: string;
  selectedCommit?: string | null;
  selectedPath?: string | null;
  selectedPullRequest?: string | null;
  source?: ReviewSource;
  watcherLimited?: boolean;
  onGitAction?(
    action: "revert" | "stage" | "unstage",
    path: string,
  ): Promise<unknown> | unknown;
  onInitializeGit?(): Promise<unknown> | unknown;
  onOpenFile?(path: string): void;
  onRefresh?(): Promise<unknown> | unknown;
  onRetry?(): Promise<unknown> | unknown;
}
interface ReviewThreadSidePanelTabProps {
  renderSlots(slots: {
    content: unknown;
    headerRows: Array<{ content: unknown; height: "content"; id: string }>;
  }): unknown;
  setTabState(
    next: ReviewTabState | ((current: ReviewTabState) => ReviewTabState),
  ): void;
  tabState: ReviewTabState;
}
interface SharedRuntime {
  $3(): void;
  I3(): JsxRuntime;
  e6: (() => ReactRuntime) & ReactRuntime;
}

const {
  $3: initializeRuntime,
  I3: getJsxRuntime,
  e6: getReactRuntime,
} = appSharedChunk as unknown as SharedRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
function initializeReviewThreadSidePanelTab(): void {
  if (initialized) return;
  initializeRuntime();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

const SOURCE_LABELS: Record<ReviewSource, string> = {
  pr: "Pull request",
  branch: "This branch",
  "last-turn": "Last turn",
  uncommitted: "Uncommitted",
  unstaged: "Unstaged",
  staged: "Staged",
  committed: "Committed",
};
const CLEANUP_COMMAND =
  'cd "$(git rev-parse --show-toplevel)" && git clean -d --interactive';
function copyText(value: string): Promise<void> {
  return navigator.clipboard?.writeText(value) ?? Promise.resolve();
}
function defaultApplyCommand(state: ReviewTabState): string {
  const source = state.source ?? "branch";
  const range =
    source === "branch" && state.baseBranch != null
      ? " # base: " + state.baseBranch
      : source === "committed" && state.selectedCommit != null
        ? " # commit: " + state.selectedCommit
        : "";
  return (
    "(cd \"$(git rev-parse --show-toplevel)\" && git apply --3way <<'EOF'\n# review patch" +
    range +
    "\nEOF\n)"
  );
}

function ReviewContent({
  expandedActionsPortalTarget,
  renderSlots,
  setTabState,
  tabState,
}: Pick<
  ReviewThreadSidePanelTabProps,
  "renderSlots" | "setTabState" | "tabState"
> & { expandedActionsPortalTarget: HTMLElement | null }): unknown {
  const source = tabState.source ?? "branch";
  const files = tabState.files ?? [];
  const [operationError, setOperationError] = React.useState<string | null>(
    null,
  );
  const [operationPending, setOperationPending] = React.useState(false);
  const update = (patch: Partial<ReviewTabState>): void =>
    setTabState((current) => ({ ...current, ...patch }));
  const selectSource = (next: ReviewSource): void =>
    update({ source: next, selectedPath: null });
  const refresh = async (): Promise<void> => {
    setOperationPending(true);
    setOperationError(null);
    try {
      await tabState.onRefresh?.();
    } catch {
      setOperationError("Unable to refresh changes");
    } finally {
      setOperationPending(false);
    }
  };
  const gitAction = async (
    action: "revert" | "stage" | "unstage",
    path: string,
  ): Promise<void> => {
    setOperationPending(true);
    setOperationError(null);
    try {
      await tabState.onGitAction?.(action, path);
    } catch {
      setOperationError(
        action === "revert"
          ? "Unable to revert changes"
          : "Unable to update staging",
      );
    } finally {
      setOperationPending(false);
    }
  };

  const renderContentOnly = (content: unknown): unknown =>
    renderSlots({ headerRows: [], content });
  if (tabState.isLoading)
    return renderContentOnly(
      jsx.jsx("div", { role: "status", children: "Loading changes…" }),
    );
  if (tabState.error != null)
    return renderContentOnly(
      jsx.jsxs("section", {
        children: [
          jsx.jsx("h2", { children: "Unable to load changes" }),
          jsx.jsx("p", { role: "alert", children: tabState.error }),
          jsx.jsx("button", {
            type: "button",
            onClick: () => {
              void tabState.onRetry?.();
            },
            children: "Retry",
          }),
        ],
      }),
    );
  if (tabState.repositoryInitialized === false)
    return renderContentOnly(
      jsx.jsxs("section", {
        children: [
          jsx.jsx("h2", {
            children: "Initialize a Git repository to review changes",
          }),
          tabState.gitInitError == null
            ? null
            : jsx.jsx("p", { role: "alert", children: tabState.gitInitError }),
          jsx.jsx("button", {
            type: "button",
            disabled: tabState.isGitInitializing === true,
            onClick: () => {
              void tabState.onInitializeGit?.();
            },
            children: tabState.isGitInitializing
              ? "Initializing Git…"
              : "Initialize Git",
          }),
        ],
      }),
    );

  const query = tabState.search?.trim().toLocaleLowerCase() ?? "";
  const filtered =
    query.length === 0
      ? files
      : files.filter((file) => file.path.toLocaleLowerCase().includes(query));
  const selectedPath = filtered.some(
    (file) => file.path === tabState.selectedPath,
  )
    ? tabState.selectedPath!
    : (filtered[0]?.path ?? null);
  const selectedIndex = filtered.findIndex(
    (file) => file.path === selectedPath,
  );
  const visibleFiles =
    tabState.largeDiff && selectedPath != null
      ? filtered.filter((file) => file.path === selectedPath)
      : filtered;
  const selectedFile =
    visibleFiles.find((file) => file.path === selectedPath) ??
    visibleFiles[0] ??
    null;
  const selectFile = (path: string): void => {
    update({ selectedPath: path });
    tabState.onOpenFile?.(path);
  };

  let emptyMessage = "No changes to review";
  if (source === "last-turn" && tabState.lastTurnStatus === "committed")
    emptyMessage = "The last turn was committed or reverted.";
  else if (source === "last-turn" && tabState.lastTurnStatus === "reverted")
    emptyMessage = "The last turn was reverted.";
  else if (source === "pr" && (tabState.pullRequests?.length ?? 0) === 0)
    emptyMessage = "No open pull requests";
  else if (source === "committed" && (tabState.commits?.length ?? 0) === 0)
    emptyMessage = "No commits on branch";

  const sourceControls = jsx.jsxs("header", {
    children: [
      jsx.jsx("label", {
        children: [
          "Review source",
          jsx.jsx("select", {
            value: source,
            onChange: (event: { target: { value: string } }) =>
              selectSource(event.target.value as ReviewSource),
            children: (Object.keys(SOURCE_LABELS) as ReviewSource[]).map(
              (value) =>
                jsx.jsx(
                  "option",
                  { value, children: SOURCE_LABELS[value] },
                  value,
                ),
            ),
          }),
        ],
      }),
      source === "pr"
        ? jsx.jsx("select", {
            "aria-label": "Pull requests",
            value: tabState.selectedPullRequest ?? "",
            onChange: (event: { target: { value: string } }) =>
              update({ selectedPullRequest: event.target.value }),
            children: (tabState.pullRequests ?? []).map((pullRequest) =>
              jsx.jsx(
                "option",
                {
                  value: pullRequest.id,
                  children:
                    pullRequest.title ??
                    "Pull request #" + (pullRequest.number ?? pullRequest.id),
                },
                pullRequest.id,
              ),
            ),
          })
        : null,
      source === "committed"
        ? jsx.jsx("select", {
            "aria-label": "Committed revision",
            value: tabState.selectedCommit ?? "",
            onChange: (event: { target: { value: string } }) =>
              update({ selectedCommit: event.target.value }),
            children: (tabState.commits ?? []).map((commit) =>
              jsx.jsx(
                "option",
                { value: commit.id, children: commit.subject ?? commit.id },
                commit.id,
              ),
            ),
          })
        : null,
      jsx.jsx("input", {
        "aria-label": "Search changed files",
        type: "search",
        value: tabState.search ?? "",
        onChange: (event: { target: { value: string } }) =>
          update({ search: event.target.value }),
      }),
      jsx.jsx("button", {
        type: "button",
        disabled: operationPending,
        onClick: () => {
          void refresh();
        },
        children: "Refresh",
      }),
      jsx.jsx("button", {
        type: "button",
        disabled: files.length === 0,
        onClick: () => {
          void copyText(tabState.copyCommand ?? defaultApplyCommand(tabState));
        },
        children: "Copy git apply command",
      }),
    ],
  });

  const notices = jsx.jsxs("div", {
    children: [
      operationError == null
        ? null
        : jsx.jsx("p", { role: "alert", children: operationError }),
      tabState.watcherLimited
        ? jsx.jsx("p", {
            role: "status",
            children:
              "Some files can't be watched for changes. Refresh to update this view.",
          })
        : null,
      tabState.omittedUntrackedCount == null
        ? null
        : jsx.jsxs("aside", {
            children: [
              jsx.jsx("strong", { children: "Showing tracked changes only" }),
              jsx.jsx("p", {
                children:
                  "Review skipped " +
                  tabState.omittedUntrackedCount +
                  " untracked files to stay responsive.",
              }),
              jsx.jsx("button", {
                type: "button",
                onClick: () => {
                  void copyText(CLEANUP_COMMAND);
                },
                children: "Copy cleanup command",
              }),
              jsx.jsx("button", {
                type: "button",
                onClick: () => {
                  void refresh();
                },
                children: "Refresh",
              }),
            ],
          }),
      tabState.largeDiff && filtered.length > 0
        ? jsx.jsxs("aside", {
            role: "status",
            children: [
              jsx.jsx("span", {
                children: "This diff is large, showing one file at a time",
              }),
              jsx.jsx("button", {
                "aria-label": "Previous file",
                type: "button",
                disabled: selectedIndex <= 0,
                onClick: () => {
                  const path = filtered[selectedIndex - 1]?.path;
                  if (path != null) selectFile(path);
                },
                children: "Previous",
              }),
              jsx.jsx("button", {
                "aria-label": "Next file",
                type: "button",
                disabled:
                  selectedIndex < 0 || selectedIndex >= filtered.length - 1,
                onClick: () => {
                  const path = filtered[selectedIndex + 1]?.path;
                  if (path != null) selectFile(path);
                },
                children: "Next",
              }),
            ],
          })
        : null,
    ],
  });

  let body: unknown;
  if (filtered.length === 0)
    body = jsx.jsxs("section", {
      children: [
        jsx.jsx("p", {
          children:
            query.length > 0 ? "No files match your search" : emptyMessage,
        }),
        source !== "branch" && files.length === 0
          ? jsx.jsx("button", {
              type: "button",
              onClick: () => selectSource("branch"),
              children: "View branch diff",
            })
          : null,
      ],
    });
  else if (source === "pr" && tabState.selectedPullRequest != null) {
    const pullRequest = tabState.pullRequests?.find(
      (candidate) => candidate.id === tabState.selectedPullRequest,
    );
    body = jsx.jsx(PullRequestCodeReview, {
      request: pullRequest,
      baseBranch: pullRequest?.baseBranch,
      headBranch: pullRequest?.headBranch,
    });
  } else
    body = jsx.jsxs("div", {
      className: "review-layout",
      children: [
        jsx.jsx("nav", {
          "aria-label": "Changed files",
          children: filtered.map((file) =>
            jsx.jsxs(
              "button",
              {
                type: "button",
                "aria-current": file.path === selectedPath ? "true" : undefined,
                onClick: () => selectFile(file.path),
                children: [
                  file.path,
                  file.generated ? " Generated" : "",
                  " +" + (file.additions ?? 0) + " -" + (file.deletions ?? 0),
                ],
              },
              file.path,
            ),
          ),
        }),
        jsx.jsx("section", {
          children: [
            selectedFile == null
              ? null
              : jsx.jsx(CodeDiff, {
                  diff: selectedFile.diff ?? "",
                  files: visibleFiles,
                  onSelectFile: selectFile,
                  expandedActionsPortalTarget,
                }),
            selectedFile == null
              ? null
              : jsx.jsxs("div", {
                  children: [
                    source === "staged"
                      ? jsx.jsx("button", {
                          type: "button",
                          disabled: operationPending,
                          onClick: () => {
                            void gitAction("unstage", selectedFile.path);
                          },
                          children: "Unstage file",
                        })
                      : source === "unstaged" || source === "uncommitted"
                        ? jsx.jsx("button", {
                            type: "button",
                            disabled: operationPending,
                            onClick: () => {
                              void gitAction("stage", selectedFile.path);
                            },
                            children: "Stage file",
                          })
                        : null,
                    source === "unstaged" || source === "uncommitted"
                      ? jsx.jsx("button", {
                          type: "button",
                          disabled: operationPending,
                          onClick: () => {
                            void gitAction("revert", selectedFile.path);
                          },
                          children: "Revert file",
                        })
                      : null,
                  ],
                }),
            source === "staged"
              ? jsx.jsx("button", {
                  type: "button",
                  disabled: operationPending,
                  onClick: () => {
                    void gitAction("unstage", "");
                  },
                  children: "Unstage all",
                })
              : source === "unstaged" || source === "uncommitted"
                ? jsx.jsxs("div", {
                    children: [
                      jsx.jsx("button", {
                        type: "button",
                        disabled: operationPending,
                        onClick: () => {
                          void gitAction("revert", "");
                        },
                        children: "Revert all",
                      }),
                      jsx.jsx("button", {
                        type: "button",
                        disabled: operationPending,
                        onClick: () => {
                          void gitAction("stage", "");
                        },
                        children: "Stage all",
                      }),
                    ],
                  })
                : null,
          ],
        }),
      ],
    });
  return renderSlots({
    headerRows: [
      { id: "review-controls", height: "content", content: sourceControls },
      { id: "review-notices", height: "content", content: notices },
    ],
    content: jsx.jsx("div", {
      className: "review-thread-side-panel",
      children: body,
    }),
  });
}

function ReviewThreadSidePanelTab({
  renderSlots,
  setTabState,
  tabState,
}: ReviewThreadSidePanelTabProps): unknown {
  const [expandedActionsPortalTarget, setExpandedActionsPortalTarget] =
    React.useState<HTMLElement | null>(null);
  return jsx.jsx("div", {
    ref: setExpandedActionsPortalTarget,
    className: "relative h-full min-h-0",
    children: jsx.jsx(ReviewContent, {
      expandedActionsPortalTarget,
      renderSlots,
      setTabState,
      tabState,
    }),
  });
}

initializeReviewThreadSidePanelTab();
export { ReviewThreadSidePanelTab };
