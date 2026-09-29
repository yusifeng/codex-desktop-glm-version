import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, LX as useScope, Y2 as FormattedMessage, ZI as appScope, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
// @ts-expect-error The interrupt helper is part of the compressed request runtime surface.
import { Ugn as getHostService, egt as interruptThread } from "@rchunk/app-initial";
import "@rchunk/app-primary";
import { n as initializePlanImplementationRequest, t as IMPLEMENT_PLAN_PREFIX } from "@rchunk/plan-implementation-request";
import { n as initializePermissionRequestModel, t as groupPermissionRequest, type PermissionGroup, type PermissionRequest } from "@rchunk/permission-request-model";
import { a as initializeResultValues } from "@rchunk/result-values";
// @ts-expect-error The semantic side-panel module preserves the compressed initializer export.
import { n as initializeSidePanel } from "@rchunk/side-panel";
import { t as initializeEditablePlanTab } from "@rchunk/editable-plan-tab";
// @ts-expect-error The compact plan side-panel initializer is registered by the chunk manifest.
import { t as initializePlanSidePanel } from "@rchunk/plan-side-panel";
import { r as initializeResultCard } from "@rchunk/result-card";
// @ts-expect-error The semantic patch stats module preserves its compressed exports.
import { n as initializePatchDiffStats, t as getPatchDiffStats } from "@rchunk/patch-diff-stats";
import { n as initializeDiffPreviewTooltip, t as DiffPreviewTooltip } from "@rchunk/diff-preview-tooltip";
// @ts-expect-error The hand icon surface is registered by the chunk manifest.
import { n as initializeHandIcon } from "@rchunk/hand";
import { t as initializeReadSavedPlanContent } from "@rchunk/read-saved-plan-content";
import { n as initializeMcpServerElicitationPanel, t as McpServerElicitationRequestPanel } from "@rchunk/mcp-server-elicitation-request-panel";

type Draft = { freeformText?: string | null; selectedOptionId?: string | null };
type Question = { description?: string | null; id: string; isOther?: boolean; isSecret?: boolean; options: Array<{ description?: string | null; label: string }>; question: string };
type UserInputRequest = { questions: Question[]; requestId: string };
type OptionPickerParams = { allowMultiple?: boolean; description?: string | null; options: Array<{ description?: string | null; id: string; label?: string }>; showFreeform?: boolean; title?: string | null };
type ApprovalItem = { approvalReason?: string | null; approvalRequestId: string; changes?: Record<string, string>; command?: string | string[]; networkApprovalContext?: { host: string; protocol?: string | null } | null; proposedExecpolicyAmendment?: unknown; proposedNetworkPolicyAmendments?: unknown[]; type: "exec" | "patch" };
type PermissionItem = { permissions: PermissionRequest; reason?: string | null; requestId: string };
type EnvironmentInput = { mode: "repositories" | "name" | "secrets" | "network" | "review"; state?: { access?: string; name?: string; networkDomains?: string[]; networkEnabled?: boolean; repositories?: string[]; secretNames?: string[] } };
type PendingRequest =
  | { environmentInput?: EnvironmentInput | null; isOnboardingDynamicInput?: boolean; item: UserInputRequest; type: "userInput" }
  | { params: OptionPickerParams; requestId: string; type: "optionPicker" }
  | { item?: UserInputRequest; requestId: string; step: "role" | "task"; type: "setupCodexStep" }
  | { item: ApprovalItem; type: "approval" }
  | ({ type: "mcpServerElicitation" } & Record<string, unknown>)
  | { item: PermissionItem; type: "permissionRequest" }
  | { plan?: string; planPath?: string; requestId?: string; turnId: string; type: "implementPlan" };

export interface PendingRequestItemPanelProps {
  approvalQuestionActor?: unknown;
  conversationId: string;
  cwd?: string | null;
  hostId: string;
  onSubmitLocalFollowup(message: string, kind: string, collaborationMode?: unknown): void;
  pendingRequest: PendingRequest;
}

interface HostService {
  removePlanImplementationRequest(conversationId: string, turnId: string): void | Promise<void>;
  replyWithCommandExecutionApprovalDecision(conversationId: string, requestId: string, decision: unknown): void | Promise<void>;
  replyWithFileChangeApprovalDecision(conversationId: string, requestId: string, decision: unknown): void | Promise<void>;
  replyWithOptionPickerResponse(conversationId: string, requestId: string, response: unknown): void | Promise<void>;
  replyWithPermissionsRequestApprovalResponse(conversationId: string, requestId: string, response: unknown): void | Promise<void>;
  replyWithUserInputResponse(conversationId: string, requestId: string, response: unknown): void | Promise<void>;
}

const jsx: JsxRuntime = getJsxRuntime();
const React: ReactRuntime = getReactRuntime();
const serviceFor = (scope: unknown, hostId: string): HostService => getHostService(scope, hostId) as unknown as HostService;
const interruptConversation = interruptThread as unknown as (scope: unknown, input: { conversationId: string; hostId: string; initiatedBy: "user" }) => Promise<unknown>;
const message = (id: string, defaultMessage: string): unknown => jsx.jsx(FormattedMessage, { id, defaultMessage });

function responseFor(questions: Question[], drafts: Draft[]): { answers: Record<string, { answers: string[] }> } {
  const answers: Record<string, { answers: string[] }> = {};
  questions.forEach((question, index) => {
    const selected = drafts[index]?.selectedOptionId?.trim() ?? "";
    const freeform = drafts[index]?.freeformText?.trim() ?? "";
    const value = selected.length > 0 ? selected : freeform;
    if (value.length > 0) answers[question.id] = { answers: [value] };
  });
  return { answers };
}

function Frame({ children, title }: { children: unknown; title: unknown }): unknown {
  return jsx.jsxs("section", { className: "flex flex-col gap-3 rounded-xl border border-default bg-surface-primary p-4", "data-pending-request-panel": true, children: [jsx.jsx("h3", { className: "font-medium", children: title }), children] });
}

function UserInputPanel({ conversationId, forceOtherOption = false, hostId, replyWithEmptyResponseOnDismiss = false, request }: { conversationId: string; forceOtherOption?: boolean; hostId: string; replyWithEmptyResponseOnDismiss?: boolean; request: UserInputRequest }): unknown {
  const scope = useScope(appScope);
  const service = serviceFor(scope, hostId);
  const [drafts, setDrafts] = React.useState<Draft[]>(() => request.questions.map(() => ({})));
  if (request.questions.length === 0) return null;
  const update = (index: number, patch: Draft): void => setDrafts((current) => current.map((draft, itemIndex) => itemIndex === index ? { ...draft, ...patch } : draft));
  const submit = (): void => { void service.replyWithUserInputResponse(conversationId, request.requestId, responseFor(request.questions, drafts)); };
  const dismiss = (): void => {
    if (replyWithEmptyResponseOnDismiss) {
      void service.replyWithUserInputResponse(conversationId, request.requestId, { answers: {} });
      return;
    }
    void interruptConversation(scope, { conversationId, hostId, initiatedBy: "user" });
  };
  return jsx.jsx(Frame, { title: message("pendingRequest.userInput.title", "ChatGPT needs your input"), children: jsx.jsxs("form", { onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); submit(); }, children: [
    ...request.questions.map((question, index) => jsx.jsxs("fieldset", { className: "flex flex-col gap-2", children: [
      jsx.jsx("legend", { children: question.question }),
      question.description == null ? null : jsx.jsx("p", { className: "text-sm text-secondary", children: question.description }),
      ...question.options.map((option) => jsx.jsxs("label", { children: [jsx.jsx("input", { checked: drafts[index]?.selectedOptionId === option.label, name: question.id, onChange: () => update(index, { selectedOptionId: option.label }), type: "radio" }), option.label] }, option.label)),
      question.options.length === 0 || question.isOther === true || forceOtherOption ? jsx.jsx("input", { "aria-label": question.question, onChange: (event: { target: { value: string } }) => update(index, { freeformText: event.target.value, selectedOptionId: null }), placeholder: question.isSecret ? "Secret value" : "Type your answer", type: question.isSecret ? "password" : "text", value: drafts[index]?.freeformText ?? "" }) : null,
    ] }, question.id)),
    jsx.jsxs("footer", { className: "flex justify-end gap-2", children: [jsx.jsx("button", { onClick: dismiss, type: "button", children: "Dismiss" }), jsx.jsx("button", { type: "submit", children: "Submit" })] }),
  ] }) });
}

function OptionPickerPanel({ conversationId, hostId, pendingRequest }: { conversationId: string; hostId: string; pendingRequest: Extract<PendingRequest, { type: "optionPicker" }> }): unknown {
  const service = serviceFor(useScope(appScope), hostId);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [freeformAnswer, setFreeformAnswer] = React.useState("");
  const choose = (id: string): void => setSelected((current) => pendingRequest.params.allowMultiple ? current.includes(id) ? current.filter((value) => value !== id) : [...current, id] : [id]);
  const reply = (action: "dismiss" | "skip" | "submit"): void => { void service.replyWithOptionPickerResponse(conversationId, pendingRequest.requestId, { action, freeformAnswer: freeformAnswer.trim() || null, selectedOptions: selected }); };
  return jsx.jsx(Frame, { title: pendingRequest.params.title ?? "Choose an option", children: jsx.jsxs("div", { children: [
    pendingRequest.params.description == null ? null : jsx.jsx("p", { children: pendingRequest.params.description }),
    jsx.jsx("div", { children: pendingRequest.params.options.map((option) => jsx.jsx("button", { "aria-pressed": selected.includes(option.id), onClick: () => choose(option.id), title: option.description ?? undefined, type: "button", children: option.label ?? option.id }, option.id)) }),
    pendingRequest.params.showFreeform === true ? jsx.jsx("textarea", { onChange: (event: { target: { value: string } }) => setFreeformAnswer(event.target.value), value: freeformAnswer }) : null,
    jsx.jsxs("footer", { children: [jsx.jsx("button", { onClick: () => reply("dismiss"), type: "button", children: "Dismiss" }), jsx.jsx("button", { onClick: () => reply("skip"), type: "button", children: "Skip" }), jsx.jsx("button", { disabled: selected.length === 0 && freeformAnswer.trim().length === 0, onClick: () => reply("submit"), type: "button", children: "Submit" })] }),
  ] }) });
}

function EnvironmentSetupPanel({ conversationId, hostId, pendingRequest }: { conversationId: string; hostId: string; pendingRequest: Extract<PendingRequest, { type: "userInput" }> }): unknown {
  const input = pendingRequest.environmentInput;
  const service = serviceFor(useScope(appScope), hostId);
  const [value, setValue] = React.useState(() => {
    if (input?.mode === "name") return input.state?.name ?? "";
    if (input?.mode === "review") return input.state?.access ?? "private";
    if (input?.mode === "repositories") return (input.state?.repositories ?? []).join("\n");
    if (input?.mode === "secrets") return (input.state?.secretNames ?? []).join("\n");
    return (input?.state?.networkDomains ?? []).join("\n");
  });
  if (input == null) return null;
  const values = input.mode === "name" || input.mode === "review" ? [value.trim()].filter(Boolean) : value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
  const submit = (): void => {
    const answers = input.mode === "review" ? { review: { answers: values }, name: { answers: [input.state?.name ?? ""] }, repositories: { answers: input.state?.repositories ?? [] }, secrets: { answers: input.state?.secretNames ?? [] }, network: { answers: input.state?.networkDomains ?? [] }, networkEnabled: { answers: [input.state?.networkEnabled === true ? "enabled" : "disabled"] } } : { [input.mode]: { answers: values } };
    void service.replyWithUserInputResponse(conversationId, pendingRequest.item.requestId, { answers });
  };
  return jsx.jsx(Frame, { title: "Set up the environment", children: jsx.jsxs("div", { "data-environment-step": input.mode, children: [jsx.jsx("textarea", { "aria-label": input.mode, onChange: (event: { target: { value: string } }) => setValue(event.target.value), value }), jsx.jsx("button", { disabled: input.mode !== "secrets" && values.length === 0, onClick: submit, type: "button", children: input.mode === "review" ? "Finish setup" : "Continue" })] }) });
}

function SetupCodexStepPanel({ conversationId, hostId, pendingRequest }: { conversationId: string; hostId: string; pendingRequest: Extract<PendingRequest, { type: "setupCodexStep" }> }): unknown {
  const fallback: Question = { id: pendingRequest.step, isOther: true, options: pendingRequest.step === "role" ? [{ label: "Engineering" }, { label: "Product" }, { label: "Design" }, { label: "Other" }] : [], question: pendingRequest.step === "role" ? "What kind of work do you do?" : "What's something we can knock off your list today?" };
  return jsx.jsx(UserInputPanel, { conversationId, forceOtherOption: true, hostId, request: pendingRequest.item ?? { questions: [fallback], requestId: pendingRequest.requestId }, replyWithEmptyResponseOnDismiss: true });
}

function execDecision(choice: string, item: ApprovalItem): unknown {
  if (choice === "acceptWithExecpolicyAmendment") {
    if (item.proposedExecpolicyAmendment == null) throw new Error("Missing exec policy amendment");
    return { acceptWithExecpolicyAmendment: { execpolicy_amendment: item.proposedExecpolicyAmendment } };
  }
  if (choice === "applyNetworkPolicyAmendment") {
    const amendment = item.proposedNetworkPolicyAmendments?.[0];
    if (amendment == null) throw new Error("Missing network policy amendment");
    return { applyNetworkPolicyAmendment: { network_policy_amendment: amendment } };
  }
  return choice;
}

function ApprovalPanel({ actor, conversationId, hostId, item }: { actor?: unknown; conversationId: string; hostId: string; item: ApprovalItem }): unknown {
  const service = serviceFor(useScope(appScope), hostId);
  const respond = (choice: string): void => { if (item.type === "exec") void service.replyWithCommandExecutionApprovalDecision(conversationId, item.approvalRequestId, execDecision(choice, item)); else void service.replyWithFileChangeApprovalDecision(conversationId, item.approvalRequestId, choice); };
  const network = item.type === "exec" ? item.networkApprovalContext : null;
  const prompt = item.approvalReason?.trim() || (item.type === "patch"
    ? "Allow ChatGPT to edit these files?"
    : network == null
      ? "Allow ChatGPT to run this command?"
      : "Allow ChatGPT to connect to " + network.host + "?");
  return jsx.jsx(Frame, { title: jsx.jsxs("span", { children: [actor ?? null, actor == null ? null : " — ", prompt] }), children: jsx.jsxs("div", { "data-approval-kind": network == null ? item.type : "network", children: [
    item.type === "exec" ? jsx.jsx("pre", { children: Array.isArray(item.command) ? item.command.join(" ") : item.command ?? "" }) : null,
    item.type === "patch" ? jsx.jsx("ul", { children: Object.entries(item.changes ?? {}).map(([path, patch]) => { const stats = getPatchDiffStats(patch, path); return jsx.jsx("li", { children: jsx.jsx(DiffPreviewTooltip, { diff: { metadata: { patch } }, displayPath: path, linesAdded: stats?.added ?? 0, linesRemoved: stats?.deleted ?? 0, children: path + " +" + (stats?.added ?? 0) + " −" + (stats?.deleted ?? 0) }) }, path); }) }) : null,
    jsx.jsxs("footer", { children: [
      jsx.jsx("button", { onClick: () => respond("decline"), type: "button", children: "Decline" }),
      jsx.jsx("button", { onClick: () => respond("accept"), type: "button", children: "Allow" }),
      jsx.jsx("button", { onClick: () => respond("acceptForSession"), type: "button", children: item.type === "patch" ? "Allow all edits" : "Allow for this session" }),
      item.type === "exec" && item.proposedExecpolicyAmendment != null ? jsx.jsx("button", { onClick: () => respond("acceptWithExecpolicyAmendment"), type: "button", children: "Allow similar commands" }) : null,
      item.type === "exec" && item.proposedNetworkPolicyAmendments?.length ? jsx.jsx("button", { onClick: () => respond("applyNetworkPolicyAmendment"), type: "button", children: "Allow this network rule" }) : null,
    ] }),
  ] }) });
}

function permissionLabel(group: PermissionGroup): string {
  if (group.kind === "network") return "Network access";
  const action = group.access === "readWrite" ? "Read and write" : group.access === "read" ? "Read" : "Write";
  return action + ": " + group.paths.join(", ");
}

function PermissionPanel({ actor, conversationId, hostId, item }: { actor?: unknown; conversationId: string; hostId: string; item: PermissionItem }): unknown {
  const service = serviceFor(useScope(appScope), hostId);
  const groups = groupPermissionRequest(item.permissions);
  const respond = (scopeValue: "session" | "turn", allowed: boolean): void => { void service.replyWithPermissionsRequestApprovalResponse(conversationId, item.requestId, { permissions: allowed ? item.permissions : {}, scope: scopeValue }); };
  return jsx.jsx(Frame, { title: jsx.jsxs("span", { children: [actor ?? "ChatGPT", " is requesting additional permissions"] }), children: jsx.jsxs("div", { children: [
    item.reason == null ? null : jsx.jsx("p", { children: item.reason }),
    groups.length === 0 ? jsx.jsx("p", { role: "alert", children: "No supported permissions were requested." }) : jsx.jsx("ul", { children: groups.map((group, index) => jsx.jsx("li", { children: permissionLabel(group) }, index)) }),
    jsx.jsxs("footer", { children: [jsx.jsx("button", { onClick: () => respond("turn", false), type: "button", children: "Deny" }), jsx.jsx("button", { disabled: groups.length === 0, onClick: () => respond("turn", true), type: "button", children: "Allow once" }), jsx.jsx("button", { disabled: groups.length === 0, onClick: () => respond("session", true), type: "button", children: "Allow for session" })] }),
  ] }) });
}

function ImplementPlanPanel({ conversationId, hostId, onSubmitLocalFollowup, pendingRequest }: { conversationId: string; hostId: string; onSubmitLocalFollowup(message: string, kind: string, collaborationMode?: unknown): void; pendingRequest: Extract<PendingRequest, { type: "implementPlan" }> }): unknown {
  const service = serviceFor(useScope(appScope), hostId);
  const [feedback, setFeedback] = React.useState("");
  const finish = (content: string): void => { void service.removePlanImplementationRequest(conversationId, pendingRequest.turnId); onSubmitLocalFollowup(IMPLEMENT_PLAN_PREFIX + "\n" + content, "plan_implementation"); };
  return jsx.jsx(Frame, { title: "Ready to implement this plan?", children: jsx.jsxs("div", { children: [
    pendingRequest.plan == null ? null : jsx.jsx("pre", { children: pendingRequest.plan }),
    jsx.jsx("textarea", { "aria-label": "Plan feedback", onChange: (event: { target: { value: string } }) => setFeedback(event.target.value), value: feedback }),
    jsx.jsxs("footer", { children: [jsx.jsx("button", { onClick: () => { void service.removePlanImplementationRequest(conversationId, pendingRequest.turnId); }, type: "button", children: "Dismiss" }), jsx.jsx("button", { disabled: feedback.trim().length === 0, onClick: () => finish(feedback.trim()), type: "button", children: "Send feedback" }), jsx.jsx("button", { onClick: () => finish(pendingRequest.plan ?? "Implement the approved plan."), type: "button", children: "Implement plan" })] }),
  ] }) });
}

function PendingRequestItemPanel({ approvalQuestionActor, conversationId, hostId, onSubmitLocalFollowup, pendingRequest }: PendingRequestItemPanelProps): unknown {
  switch (pendingRequest.type) {
    case "userInput": return pendingRequest.environmentInput == null ? jsx.jsx(UserInputPanel, { conversationId, forceOtherOption: pendingRequest.isOnboardingDynamicInput === true, hostId, replyWithEmptyResponseOnDismiss: pendingRequest.isOnboardingDynamicInput === true, request: pendingRequest.item }) : jsx.jsx(EnvironmentSetupPanel, { conversationId, hostId, pendingRequest });
    case "optionPicker": return jsx.jsx(OptionPickerPanel, { conversationId, hostId, pendingRequest });
    case "setupCodexStep": return jsx.jsx(SetupCodexStepPanel, { conversationId, hostId, pendingRequest });
    case "approval": return jsx.jsx(ApprovalPanel, { actor: approvalQuestionActor, conversationId, hostId, item: pendingRequest.item });
    case "mcpServerElicitation": return jsx.jsx(McpServerElicitationRequestPanel, { conversationId, hostId, pendingRequest });
    case "permissionRequest": return jsx.jsx(PermissionPanel, { actor: approvalQuestionActor, conversationId, hostId, item: pendingRequest.item });
    case "implementPlan": return jsx.jsx(ImplementPlanPanel, { conversationId, hostId, onSubmitLocalFollowup, pendingRequest });
  }
}

initializePlanImplementationRequest();
initializePermissionRequestModel();
initializeResultValues();
initializeSidePanel();
initializeEditablePlanTab();
initializePlanSidePanel();
initializeResultCard();
initializePatchDiffStats();
initializeDiffPreviewTooltip();
initializeHandIcon();
initializeReadSavedPlanContent();
initializeMcpServerElicitationPanel();

export { PendingRequestItemPanel };
