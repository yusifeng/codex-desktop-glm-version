import "@rchunk/rolldown-runtime";
import "@rchunk/git-action-new-branch-field";
import "@rchunk/pull-request";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";

interface BlockedStep { kind: string; reason: string }
interface NewBranchField { branchAlreadyExists?: boolean; isSelectionBlocked?: boolean; onChange(value: string): void; placeholder?: string; value: string }
interface CreatePullRequestModalContentProps {
  baseBranch?: string | null;
  blockedStep?: BlockedStep | null;
  branchSummary?: unknown;
  defaultToDraft?: boolean;
  description: string;
  existingPullRequestUrl?: string | null;
  hasOpenPr?: boolean;
  headBranch?: string | null;
  includeLocalChanges?: boolean;
  isGitLab?: boolean;
  isWorkflowPending?: boolean;
  newBranch?: NewBranchField;
  onCreate(asDraft: boolean): void;
  onDescriptionChange(value: string): void;
  onIncludeLocalChangesChange(value: boolean): void;
  onOpenPullRequest(): void;
  onTitleChange(value: string): void;
  repositoryName?: string | null;
  title: string;
}
const jsx = getJsxRuntime();
function CreatePullRequestModalContent(props: CreatePullRequestModalContentProps): unknown {
  const blocked = props.newBranch?.isSelectionBlocked || props.blockedStep != null;
  const pending = props.isWorkflowPending === true;
  const actionLabel = props.hasOpenPr ? "Open pull request" : props.defaultToDraft ? "Create draft" : props.isGitLab ? "Create merge request" : "Create pull request";
  return jsx.jsxs("section", { "aria-label": props.isGitLab ? "Create merge request" : "Create pull request", children: [
    jsx.jsx("h2", { children: props.isGitLab ? "Create merge request" : "Create pull request" }),
    props.repositoryName ? jsx.jsx("p", { children: `${props.repositoryName} · ${props.baseBranch ?? "-"} ← ${props.headBranch ?? props.newBranch?.value ?? "-"}` }) : null,
    props.newBranch ? jsx.jsxs("label", { children: ["New branch", jsx.jsx("input", { value: props.newBranch.value, placeholder: props.newBranch.placeholder, "aria-invalid": props.newBranch.branchAlreadyExists || props.newBranch.isSelectionBlocked, onChange: (event: { currentTarget: { value: string } }) => props.newBranch?.onChange(event.currentTarget.value) })] }) : null,
    jsx.jsxs("label", { children: ["Title", jsx.jsx("input", { value: props.title, onChange: (event: { currentTarget: { value: string } }) => props.onTitleChange(event.currentTarget.value) })] }),
    jsx.jsxs("label", { children: ["Description", jsx.jsx("textarea", { value: props.description, onChange: (event: { currentTarget: { value: string } }) => props.onDescriptionChange(event.currentTarget.value) })] }),
    jsx.jsxs("label", { children: [jsx.jsx("input", { type: "checkbox", checked: props.includeLocalChanges ?? false, onChange: (event: { currentTarget: { checked: boolean } }) => props.onIncludeLocalChangesChange(event.currentTarget.checked) }), "Include local changes"] }),
    props.blockedStep ? jsx.jsx("p", { role: "alert", children: `Cannot continue: ${props.blockedStep.reason}` }) : null,
    jsx.jsxs("footer", { children: [props.hasOpenPr ? null : jsx.jsx("button", { type: "button", disabled: pending || blocked, onClick: () => props.onCreate(true), children: "Create draft" }), jsx.jsx("button", { type: "button", disabled: pending || blocked, onClick: props.hasOpenPr ? props.onOpenPullRequest : () => props.onCreate(false), children: actionLabel })] }),
  ] });
}
function initializeCreatePullRequestModalContent(): void { initializeApiClient(); }
export { initializeCreatePullRequestModalContent as n, CreatePullRequestModalContent as t };
