import {
  $3 as reactCompilerRuntime,
  I3 as getJsxRuntime,
  If as initializeMenu,
  Yh as Button,
  Zh as initializeButton,
  h4 as initializeStyleRuntime,
  iy as CheckIcon,
  jf as Menu,
  kf as DropdownMenu,
  lw as initializeBrowserIcons,
  m4 as classNames,
  sy as ChevronDownIcon,
} from "@rchunk/app-shared";
import {
  dat as initializeDiffStats,
  uat as DiffStats,
} from "@rchunk/app-initial";

void reactCompilerRuntime;

export interface RevisionDiffStats {
  additions: number;
  deletions: number;
}

export interface RevisionSourceDropdownProps {
  children?: unknown;
  diffStats?: RevisionDiffStats | null;
  label: unknown;
  onOpenChange?: (open: boolean) => void;
  reviewV2Enabled?: boolean;
}

export interface RevisionSourceMenuItemProps {
  diffStats?: RevisionDiffStats | null;
  isSelected: boolean;
  label: unknown;
  showDiffStats?: boolean;
  showSelectionIndicator?: boolean;
}

function RevisionDiffStatsView({
  additions,
  deletions,
  reviewV2Enabled,
}: RevisionDiffStats & { reviewV2Enabled?: boolean }): unknown {
  if (additions === 0 && deletions === 0) return null;
  const { jsx } = getJsxRuntime();
  return jsx(DiffStats, {
    className: classNames(
      "me-1 shrink-0 select-none",
      reviewV2Enabled ? "text-sm" : "text-size-chat",
    ),
    linesAdded: additions,
    linesRemoved: deletions,
  });
}

function RevisionSourceDropdown({
  children,
  diffStats,
  label,
  onOpenChange,
  reviewV2Enabled = true,
}: RevisionSourceDropdownProps): unknown {
  const { jsx, jsxs } = getJsxRuntime();
  const triggerButton = jsxs(Button, {
    className: classNames(
      "w-fit max-w-[320px] border-transparent px-1.5",
      reviewV2Enabled && "gap-1.5",
    ),
    allowShrink: true,
    color: "ghostActive",
    size: "toolbar",
    children: [
      jsxs("span", {
        className: classNames(
          "flex max-w-full min-w-0 items-center",
          reviewV2Enabled ? "gap-3" : "gap-1.5 truncate",
        ),
        children: [
          jsx("span", { className: "min-w-0 truncate", children: label }),
          reviewV2Enabled && diffStats != null
            ? jsx(RevisionDiffStatsView, { ...diffStats, reviewV2Enabled: true })
            : null,
        ],
      }),
      jsx(ChevronDownIcon, {}),
    ],
  });
  return jsx(DropdownMenu, {
    onOpenChange,
    triggerButton,
    contentWidth: reviewV2Enabled ? "menuWide" : "menuBounded",
    children,
  });
}

function RevisionSourceMenuItem({
  diffStats,
  isSelected,
  label,
  showDiffStats,
  showSelectionIndicator = true,
}: RevisionSourceMenuItemProps): unknown {
  const { jsx, jsxs } = getJsxRuntime();
  const selection = showSelectionIndicator
    ? jsx(Menu.ItemIcon, {
        size: "xs",
        children: isSelected ? jsx(CheckIcon, {}) : null,
      })
    : null;
  let stats: unknown = null;
  if (showDiffStats && diffStats != null) {
    stats =
      diffStats.additions === 0 && diffStats.deletions === 0
        ? jsx("span", {
            "aria-hidden": true,
            className: "shrink-0 text-codex-description",
            children: "—",
          })
        : jsx(DiffStats, {
            className: "shrink-0",
            linesAdded: diffStats.additions,
            linesRemoved: diffStats.deletions,
          });
  }
  return jsxs("span", {
    className: "flex min-w-0 flex-1 items-center gap-1.5",
    children: [
      selection,
      jsx("span", { className: "min-w-0 flex-1 truncate", children: label }),
      stats,
    ],
  });
}

export interface RevisionAvailabilityIntl {
  formatMessage(descriptor: {
    defaultMessage: string;
    description: string;
    id: string;
  }): string;
}

function getRevisionUnavailableMessage(
  intl: RevisionAvailabilityIntl,
  availability: "account-mismatch" | "available" | "cli-required" | "loading",
): string | undefined {
  if (availability === "available") return undefined;
  return availability === "loading"
    ? intl.formatMessage({
        id: "pullRequestRevision.checking",
        defaultMessage: "Checking review availability…",
        description: "Status while checking exact-revision review support",
      })
    : intl.formatMessage({
        id: "pullRequestRevision.cliRequired",
        defaultMessage:
          "Exact-revision review requires GitHub CLI signed in to this GitHub account on the selected host. The GitHub connector does not yet provide fixed-revision comparisons.",
        description:
          "Explains why a connector-backed pull request cannot open an immutable code review",
      });
}

function initializeRevisionSourceUi(): void {
  initializeStyleRuntime();
  initializeButton();
  initializeMenu();
  initializeBrowserIcons();
  initializeDiffStats();
  getJsxRuntime();
}

function initializeRevisionUnavailableMessage(): void {}

export {
  RevisionSourceMenuItem as a,
  RevisionSourceDropdown as i,
  initializeRevisionUnavailableMessage as n,
  initializeRevisionSourceUi as o,
  RevisionDiffStatsView as r,
  getRevisionUnavailableMessage as t,
};
