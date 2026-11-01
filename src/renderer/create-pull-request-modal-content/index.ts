import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import type { JsxRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";
import "@rchunk/git-action-new-branch-field";
import "@rchunk/pull-request";

interface BlockedStep { kind: string; reason: string }
interface BranchSummary { totalAdditions?: number; totalDeletions?: number }
interface NewBranchField {
  branchAlreadyExists?: boolean;
  isSelectionBlocked?: boolean;
  onChange(value: string): void;
  placeholder?: string;
  value: string;
}
interface Props {
  baseBranch?: string | null;
  blockedStep?: BlockedStep | null;
  branchSummary?: BranchSummary | null;
  defaultToDraft?: boolean;
  description: string;
  existingPullRequestUrl?: string | null;
  hasOpenPr?: boolean;
  headBranch?: string | null;
  includeLocalChanges?: boolean;
  isGitLab?: boolean;
  isWorkflowPending?: boolean;
  newBranch?: NewBranchField;
  onCreate(asDraft: boolean, openInBrowser?: boolean): void;
  onDescriptionChange(value: string): void;
  onIncludeLocalChangesChange(value: boolean): void;
  onOpenPullRequest(event?: unknown): void;
  onTitleChange(value: string): void;
  repositoryName?: string | null;
  title: string;
}

let jsx: JsxRuntime;

function CreatePullRequestModalContent(props: Props): unknown {
  initializeCreatePullRequestModalContent();
  const isGitLab = props.isGitLab === true;
  const hasOpenPr = props.hasOpenPr === true;
  const awaitingExistingUrl = hasOpenPr && props.existingPullRequestUrl == null;
  const disabled = awaitingExistingUrl || props.isWorkflowPending === true;
  const canCreate = !hasOpenPr && !disabled && props.newBranch?.isSelectionBlocked !== true && props.blockedStep == null;
  const selectedAction = hasOpenPr ? "open-pr" : props.defaultToDraft ? "create-draft-pr" : "create-pr";
  const headLabel = props.newBranch == null ? (props.headBranch ?? "-") : "New branch";
  const titleLabel = isGitLab ? "Create merge request" : "Create PR";

  const body = hasOpenPr
    ? jsx.jsx("div", { className: "min-h-32 px-3 py-2 text-codex-description", children: "A pull request already exists for this branch" })
    : jsx.jsxs("div", { className: "flex min-h-32 flex-col gap-2 text-codex-description", children: [
        props.newBranch == null ? null : jsx.jsxs("label", { className: "px-3 pt-2", children: [
          jsx.jsx("span", { className: "sr-only", children: "New branch" }),
          jsx.jsx("input", { value: props.newBranch.value, placeholder: props.newBranch.placeholder, disabled,
            "aria-invalid": props.newBranch.branchAlreadyExists === true || props.newBranch.isSelectionBlocked === true,
            onChange: (event: { currentTarget?: { value: string }; target?: { value: string } }) => props.newBranch?.onChange((event.target ?? event.currentTarget)?.value ?? "") }),
        ] }),
        jsx.jsx("input", { autoFocus: props.newBranch == null, id: "create-pr-title",
          className: "w-full bg-transparent px-3 pt-2 font-semibold text-default outline-none placeholder:text-codex-description",
          "aria-label": "Title", placeholder: "Title", value: props.title, disabled,
          onChange: (event: { currentTarget?: { value: string }; target?: { value: string } }) => props.onTitleChange((event.target ?? event.currentTarget)?.value ?? "") }),
        jsx.jsx("textarea", { id: "create-pr-message", rows: 3,
          className: "min-h-0 w-full flex-1 resize-none bg-transparent px-3 pb-2 text-default outline-none placeholder:text-codex-description",
          "aria-label": "Message", placeholder: "Description (leave empty to generate)", value: props.description, disabled,
          onKeyDown: stopPlainEnter,
          onChange: (event: { currentTarget?: { value: string }; target?: { value: string } }) => props.onDescriptionChange((event.target ?? event.currentTarget)?.value ?? "") }),
        jsx.jsxs("div", { className: "relative flex items-center gap-2 px-3 pt-2 pb-3", children: [
          jsx.jsx("input", { id: "create-pr-include-local-changes", type: "checkbox", checked: props.includeLocalChanges ?? false,
            disabled, onChange: (event: { currentTarget?: { checked: boolean }; target?: { checked: boolean } }) => props.onIncludeLocalChangesChange((event.target ?? event.currentTarget)?.checked ?? false) }),
          jsx.jsx("label", { htmlFor: "create-pr-include-local-changes", children: "Commit and push local changes" }),
          props.branchSummary == null ? null : jsx.jsx("span", { className: "ms-auto shrink-0", "data-branch-summary": true,
            children: `+${props.branchSummary.totalAdditions ?? 0} −${props.branchSummary.totalDeletions ?? 0}` }),
        ] }),
      ] });

  const actions = hasOpenPr
    ? Action({ value: "open-pr", disabled: props.existingPullRequestUrl == null, loading: awaitingExistingUrl,
        onSelect: props.onOpenPullRequest, onModifiedClick: props.onOpenPullRequest, children: "Open PR in browser" })
    : jsx.jsxs(jsx.Fragment, { children: [
        Action({ value: "create-draft-pr", disabled: !canCreate, loading: props.isWorkflowPending === true,
          tooltip: props.blockedStep?.reason, onSelect: () => props.onCreate(true),
          children: isGitLab ? "Create draft merge request" : "Create draft PR" }),
        Action({ value: "create-pr", disabled: !canCreate, loading: props.isWorkflowPending === true,
          tooltip: props.blockedStep?.reason, onSelect: () => props.onCreate(false),
          children: isGitLab ? "Create merge request" : "Create PR" }),
        Action({ value: "open-pr-in-browser", disabled: !canCreate, loading: props.isWorkflowPending === true,
          tooltip: props.blockedStep?.reason, onSelect: () => props.onCreate(false, true),
          children: isGitLab ? "Open merge request in browser" : "Open PR in browser" }),
      ] });

  return jsx.jsx("div", { className: "command-menu-dialog contents", children: jsx.jsxs("section", {
    "aria-label": titleLabel, "data-codex-shortcut-capture": true, "data-default-value": selectedAction,
    className: "w-[420px] max-w-[92vw]", children: [
      jsx.jsx("h2", { className: "sr-only", children: titleLabel }),
      jsx.jsx("div", { className: "flex h-9 items-center justify-between gap-3 px-3", children:
        jsx.jsxs("span", { className: "flex min-w-0 flex-1 items-center gap-1 whitespace-nowrap", children: [
          props.repositoryName == null ? null : jsx.jsxs(jsx.Fragment, { children: [props.repositoryName, " · "] }),
          headLabel, " → ", props.baseBranch ?? "-",
        ] }) }),
      body,
      props.newBranch?.isSelectionBlocked === true || props.blockedStep == null ? null
        : jsx.jsx("p", { role: "alert", className: "px-3", children: `Cannot continue: ${props.blockedStep.reason}` }),
      jsx.jsx("footer", { className: "border-t border-default py-1", children: actions }),
    ],
  }) });
}

function Action(props: { children: unknown; disabled?: boolean; loading?: boolean; onModifiedClick?(event: unknown): void; onSelect(): void; tooltip?: string; value: string }): unknown {
  const onClick = (event: { ctrlKey?: boolean; metaKey?: boolean; preventDefault?(): void; stopPropagation?(): void }) => {
    if ((event.ctrlKey || event.metaKey) && props.onModifiedClick != null) {
      event.preventDefault?.(); event.stopPropagation?.(); props.onModifiedClick(event); return;
    }
    props.onSelect();
  };
  return jsx.jsx("button", { type: "button", role: "menuitem", "data-value": props.value, disabled: props.disabled,
    "aria-busy": props.loading === true, title: props.disabled ? props.tooltip : undefined, onClick,
    children: jsx.jsxs("span", { children: [props.loading ? "Loading… " : "", props.children] }) });
}

function stopPlainEnter(event: { ctrlKey?: boolean; key?: string; metaKey?: boolean; stopPropagation(): void }): void {
  if (event.key === "Enter" && !event.metaKey && !event.ctrlKey) event.stopPropagation();
}

let initialized = false;
function initializeCreatePullRequestModalContent(): void {
  if (initialized) return;
  initialized = true;
  initializeApiClient();
  jsx = getJsxRuntime();
}

export { initializeCreatePullRequestModalContent as n, CreatePullRequestModalContent as t };
